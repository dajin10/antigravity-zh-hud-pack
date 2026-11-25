"""Antigravity 对话历史标题中文化工具。

支持热备份 conversation_summaries.db，并同步更新 title、preview 列以及
raw_summary (protobuf) 中的对应字段。
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shutil
import sqlite3
from pathlib import Path

_AGY_HOME = Path.home() / ".gemini" / "antigravity"
DEFAULT_DB_PATH = _AGY_HOME / "conversation_summaries.db"
DEFAULT_PB_PATH = _AGY_HOME / "agyhub_summaries_proto.pb"
DEFAULT_BACKUP_DIR = _AGY_HOME / "backups"
DEFAULT_TRANSLATIONS_PATH = Path(__file__).with_name("translations.json")
CJK_RE = re.compile(r"[\u4e00-\u9fff]")


def decode_varint(buf: bytes, pos: int) -> tuple[int, int]:
    """从字节流中解码 protobuf varint。"""
    result = 0
    shift = 0
    while pos < len(buf):
        b = buf[pos]
        pos += 1
        result |= (b & 0x7F) << shift
        if not (b & 0x80):
            return result, pos
        shift += 7
    raise ValueError("Truncated varint in protobuf payload")


def encode_varint(val: int) -> bytes:
    """将非负整数编码为 protobuf varint。"""
    if val < 0:
        raise ValueError(f"Varint must be non-negative: {val}")
    out = bytearray()
    while True:
        byte = val & 0x7F
        val >>= 7
        if val:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            break
    return bytes(out)


def _patch_length_delimited_field(
    buf: bytes, target_field: int, new_payload: bytes | None = None, sub_patcher=None
) -> bytes:
    """按 wire format 遍历并替换指定 field_num 的 length-delimited 字段。"""
    pos = 0
    out = bytearray()
    while pos < len(buf):
        tag_start = pos
        tag, pos = decode_varint(buf, pos)
        field_num = tag >> 3
        wire_type = tag & 0x07

        if wire_type == 0:  # varint
            _, pos = decode_varint(buf, pos)
            out.extend(buf[tag_start:pos])
        elif wire_type == 1:  # 64-bit
            pos += 8
            if pos > len(buf):
                raise ValueError("Truncated 64-bit field")
            out.extend(buf[tag_start:pos])
        elif wire_type == 2:  # length-delimited
            length, payload_start = decode_varint(buf, pos)
            payload_end = payload_start + length
            if payload_end > len(buf):
                raise ValueError("Truncated length-delimited field")
            payload = buf[payload_start:payload_end]
            pos = payload_end

            if field_num == target_field:
                replaced = sub_patcher(payload) if sub_patcher else new_payload
                assert replaced is not None
                out.extend(encode_varint(tag))
                out.extend(encode_varint(len(replaced)))
                out.extend(replaced)
            else:
                out.extend(buf[tag_start:pos])
        elif wire_type == 5:  # 32-bit
            pos += 4
            if pos > len(buf):
                raise ValueError("Truncated 32-bit field")
            out.extend(buf[tag_start:pos])
        else:
            raise ValueError(f"Unsupported protobuf wire_type={wire_type} at field={field_num}")
    return bytes(out)


def patch_raw_summary(raw_bytes: bytes, new_title: str) -> bytes:
    """替换 raw_summary protobuf 中顶层 field 1 与 field 15.1 的标题字符串。"""
    title_bytes = new_title.encode("utf-8")
    patched = _patch_length_delimited_field(raw_bytes, target_field=1, new_payload=title_bytes)
    patched = _patch_length_delimited_field(
        patched,
        target_field=15,
        sub_patcher=lambda sub: _patch_length_delimited_field(
            sub, target_field=1, new_payload=title_bytes
        ),
    )
    return patched


def _extract_field1_str(buf: bytes) -> str | None:
    """提取 protobuf 消息中第一个 field 1 (length-delimited) 的 UTF-8 字符串。"""
    pos = 0
    while pos < len(buf):
        tag, pos = decode_varint(buf, pos)
        fnum, wt = tag >> 3, tag & 0x07
        if wt == 0:
            _, pos = decode_varint(buf, pos)
        elif wt == 1:
            pos += 8
        elif wt == 2:
            length, p = decode_varint(buf, pos)
            payload = buf[p : p + length]
            pos = p + length
            if fnum == 1:
                return payload.decode("utf-8", errors="replace")
        elif wt == 5:
            pos += 4
        else:
            raise ValueError(f"Unsupported wire_type={wt}")
    return None


def patch_summaries_pb(pb_bytes: bytes, translations: dict[str, str]) -> tuple[bytes, int]:
    """同步替换 agyhub_summaries_proto.pb 中所有匹配对话 ID 的标题。"""
    updated = 0

    def _patch_entry(entry_bytes: bytes) -> bytes:
        nonlocal updated
        cid = _extract_field1_str(entry_bytes)
        if cid and cid in translations:
            zh_title = translations[cid]
            updated += 1
            return _patch_length_delimited_field(
                entry_bytes,
                target_field=2,
                sub_patcher=lambda sub: patch_raw_summary(sub, zh_title),
            )
        return entry_bytes

    patched = _patch_length_delimited_field(pb_bytes, target_field=1, sub_patcher=_patch_entry)
    return patched, updated


def hot_backup_db(db_path: Path, backup_dir: Path, pb_path: Path | None = None) -> Path:
    """使用 SQLite 在线备份 API 创建一致的快照备份，并同步备份 pb 文件。"""
    backup_dir.mkdir(parents=True, exist_ok=True)
    ts = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"conversation_summaries_{ts}.db"
    src = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True, timeout=10.0)
    dst = sqlite3.connect(backup_path)
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()
    if pb_path and pb_path.exists():
        shutil.copy2(pb_path, backup_dir / f"agyhub_summaries_proto_{ts}.pb")
    return backup_path


def find_non_cjk_rows(db_path: Path) -> list[tuple[str, str]]:
    """查询所有 title 不含中文字符的记录。"""
    conn = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True, timeout=10.0)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT conversation_id, title FROM conversation_summaries "
            "ORDER BY last_modified_time DESC"
        )
        return [
            (cid, title)
            for cid, title in cur.fetchall()
            if title and not CJK_RE.search(title)
        ]
    finally:
        conn.close()


def apply_translations(
    db_path: Path,
    translations: dict[str, str],
    backup_dir: Path,
    pb_path: Path | None = None,
) -> tuple[int, int]:
    """备份并批量写入中文标题到 SQLite DB 与 agyhub_summaries_proto.pb。"""
    backup_path = hot_backup_db(db_path, backup_dir, pb_path)
    print(f"[BACKUP] 已创建快照备份: {backup_path}")

    conn = sqlite3.connect(db_path, timeout=15.0)
    db_updated = 0
    try:
        cur = conn.cursor()
        for cid, zh_title in translations.items():
            cur.execute(
                "SELECT title, raw_summary FROM conversation_summaries WHERE conversation_id = ?",
                (cid,),
            )
            row = cur.fetchone()
            if not row:
                continue
            old_title, raw_summary = row
            if old_title == zh_title:
                continue

            new_raw = patch_raw_summary(raw_summary, zh_title) if raw_summary else raw_summary
            cur.execute(
                "UPDATE conversation_summaries SET title = ?, preview = ?, raw_summary = ? "
                "WHERE conversation_id = ?",
                (zh_title, zh_title, new_raw, cid),
            )
            db_updated += 1
        conn.commit()
    finally:
        conn.close()

    pb_updated = 0
    if pb_path and pb_path.exists():
        pb_bytes = pb_path.read_bytes()
        new_pb_bytes, pb_updated = patch_summaries_pb(pb_bytes, translations)
        pb_path.write_bytes(new_pb_bytes)

    return db_updated, pb_updated


def main() -> None:
    parser = argparse.ArgumentParser(description="Antigravity 对话历史标题中文化工具")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH)
    parser.add_argument("--pb", type=Path, default=DEFAULT_PB_PATH)
    parser.add_argument("--backup-dir", type=Path, default=DEFAULT_BACKUP_DIR)
    parser.add_argument("--translations", type=Path, default=DEFAULT_TRANSLATIONS_PATH)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="检查非中文标题数量与列表")
    group.add_argument("--export", type=Path, help="导出待翻译的英文标题到 JSON 文件")
    group.add_argument("--apply", action="store_true", help="备份并应用翻译映射表")
    args = parser.parse_args()

    if args.check:
        rows = find_non_cjk_rows(args.db)
        print(f"剩余纯英文/非中文标题数量: {len(rows)}")
        for cid, title in rows:
            print(f"  {cid} | {title}")
        return

    if args.export:
        rows = find_non_cjk_rows(args.db)
        data = {cid: title for cid, title in rows}
        args.export.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"已导出 {len(data)} 条待翻译标题至: {args.export}")
        return

    if args.apply:
        raw_translations = json.loads(args.translations.read_text(encoding="utf-8"))
        translations = {k: v for k, v in raw_translations.items() if not k.startswith("_") and isinstance(v, str)}
        db_updated, pb_updated = apply_translations(args.db, translations, args.backup_dir, args.pb)
        remaining = find_non_cjk_rows(args.db)
        print(f"[DONE] DB 更新数: {db_updated}, PB 更新数: {pb_updated}")
        print(f"[VERIFY] 更新后剩余非中文标题数: {len(remaining)}")


if __name__ == "__main__":
    main()
