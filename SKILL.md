---
name: antigravity-zh-hud-pack
description: "Antigravity 桌面客户端一站式增强包（Chinese i18n + Real-Time HUD + Quota Monitor + File Drop）。支持中英双语/简体中文切换、输入框底部实时 Token/TPS/5h与每周配额监控、任意文件拖拽绝对路径注入与无损卸载还原。触发词：安装Antigravity汉化、安装监控底栏、Antigravity中文包、HUD状态栏。"
---

# Antigravity 中文汉化与算力/配额监控拓展包 (`antigravity-zh-hud-pack`)

## 一、AI Agent 自动安装流程

1. **拉取依赖与预校验**：
   ```bash
   npm install --omit=dev
   node bin/install.js --dry-run
   ```
2. **执行注入（严格防自杀规则）**：
   - 若检测到 `Antigravity` 进程未运行，直接执行 `node bin/install.js`。
   - 若当前 Agent 正运行在 Antigravity 进程内部，**严禁强杀 Antigravity 进程**；应提示用户退出客户端后双击 `install.bat` 或执行 `node bin/install.js`（约 5 秒完成），再重启生效。
3. **卸载还原**：
   客户端关闭状态下执行 `node bin/uninstall.js`（或 `uninstall.bat`），优先使用 `app.asar.original` 完整还原。
