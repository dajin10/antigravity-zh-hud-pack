#!/usr/bin/env node
/**
 * Antigravity 汉化 + HUD V2.1 拓展包一键卸载还原脚本
 * 优先从 app.asar.original 恢复；若无原版备份，则自动剥离注入块并重打包。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const asar = require('@electron/asar');

const BACKUP_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'backups');
const START_MARKER = '// === ANTIGRAVITY_ZH_HUD_PACK_START ===';
const LEGACY_MARKER = '// Antigravity 全量界面汉化与效率增强引擎';

function parseArgs(argv) {
  const args = { asar: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--asar' && argv[i + 1]) {
      args.asar = path.resolve(argv[++i]);
    }
  }
  return args;
}

function detectAsarPath(customPath) {
  if (customPath) {
    if (fs.existsSync(customPath)) return customPath;
    throw new Error(`指定的 app.asar 不存在: ${customPath}`);
  }
  const candidates = [];
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    candidates.push(
      path.join(localAppData, 'Programs', 'Antigravity', 'resources', 'app.asar'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Antigravity', 'resources', 'app.asar')
    );
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Antigravity.app/Contents/Resources/app.asar');
  } else {
    candidates.push('/usr/lib/antigravity/resources/app.asar', '/opt/Antigravity/resources/app.asar');
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('未自动探测到 Antigravity 的 app.asar，请使用 --asar <路径> 手动指定。');
}

async function main() {
  const args = parseArgs(process.argv);
  const asarTarget = detectAsarPath(args.asar);
  const originalBackup = path.join(BACKUP_DIR, 'app.asar.original');

  if (fs.existsSync(originalBackup)) {
    try {
      fs.copyFileSync(originalBackup, asarTarget);
      console.log('✅ 已从官方原版备份无损恢复:', originalBackup, '->', asarTarget);
      return;
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
        console.error('[错误] 目标 app.asar 正被占用，请先完全退出 Antigravity 后重试。');
        process.exit(2);
      }
      throw err;
    }
  }

  // 无原版备份时，解包并剥离注入代码后重打包
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-unpatch-'));
  const unpackDir = path.join(tmpRoot, 'unpacked');
  const cleanAsar = path.join(tmpRoot, 'app.asar.clean');

  try {
    asar.extractAll(asarTarget, unpackDir);
    const preloadPath = path.join(unpackDir, 'dist', 'preload.js');
    const src = fs.readFileSync(preloadPath, 'utf8');

    let cutIdx = src.indexOf(START_MARKER);
    if (cutIdx === -1) {
      const legacyIdx = src.indexOf(LEGACY_MARKER);
      if (legacyIdx !== -1) {
        const bannerIdx = src.lastIndexOf('// ====', legacyIdx);
        cutIdx = bannerIdx !== -1 ? bannerIdx : legacyIdx;
      }
    }

    if (cutIdx === -1) {
      console.log('当前 app.asar 未检测到本拓展包注入内容，无需卸载。');
      return;
    }

    const cleaned = src.slice(0, cutIdx).replace(/\s+$/, '') + '\n';
    fs.writeFileSync(preloadPath, cleaned, 'utf8');
    execFileSync(process.execPath, ['--check', preloadPath], { stdio: 'inherit' });

    await asar.createPackageWithOptions(unpackDir, cleanAsar, {
      unpackDir: 'node_modules/chrome-devtools-mcp'
    });
    fs.copyFileSync(cleanAsar, asarTarget);
    console.log('✅ 已剥离拓展包代码并恢复原生 preload.js:', asarTarget);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('[卸载失败]', err.message || err);
  process.exit(1);
});
