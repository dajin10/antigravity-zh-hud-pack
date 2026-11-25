#!/usr/bin/env node
/**
 * Antigravity 汉化 + HUD V2.1 拓展包一键安装 / 升级脚本 (幂等)
 * 用法: node bin/install.js [--asar <path-to-app.asar>] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const asar = require('@electron/asar');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const CONFIG_EXAMPLE = path.join(ROOT_DIR, 'config', 'i18n-custom.example.json');
const BACKUP_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'backups');

const START_MARKER = '// === ANTIGRAVITY_ZH_HUD_PACK_START ===';
const END_MARKER = '// === ANTIGRAVITY_ZH_HUD_PACK_END ===';
const LEGACY_MARKER = '// Antigravity 全量界面汉化与效率增强引擎';

function parseArgs(argv) {
  const args = { asar: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--asar' && argv[i + 1]) {
      args.asar = path.resolve(argv[++i]);
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
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
    candidates.push(
      '/Applications/Antigravity.app/Contents/Resources/app.asar',
      path.join(os.homedir(), 'Applications', 'Antigravity.app', 'Contents', 'Resources', 'app.asar')
    );
  } else {
    candidates.push(
      '/usr/lib/antigravity/resources/app.asar',
      '/opt/Antigravity/resources/app.asar',
      path.join(os.homedir(), '.local', 'share', 'Antigravity', 'resources', 'app.asar')
    );
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    '未自动探测到 Antigravity 的 app.asar，请使用 --asar <路径> 手动指定。\n已尝试路径:\n  - ' +
      candidates.join('\n  - ')
  );
}

function stripExistingPatch(preloadSrc) {
  let idx = preloadSrc.indexOf(START_MARKER);
  if (idx !== -1) {
    return { base: preloadSrc.slice(0, idx).replace(/\s+$/, '') + '\n', alreadyPatched: true };
  }
  const legacyIdx = preloadSrc.indexOf(LEGACY_MARKER);
  if (legacyIdx !== -1) {
    // 回退到旧版注释块顶部双斜杠分隔线
    const bannerIdx = preloadSrc.lastIndexOf('// ====', legacyIdx);
    const cutIdx = bannerIdx !== -1 ? bannerIdx : legacyIdx;
    return { base: preloadSrc.slice(0, cutIdx).replace(/\s+$/, '') + '\n', alreadyPatched: true };
  }
  return { base: preloadSrc.replace(/\s+$/, '') + '\n', alreadyPatched: false };
}

function buildInjectedBundle() {
  const statsBridge = fs.readFileSync(path.join(SRC_DIR, 'stats-bridge.js'), 'utf8').trim();
  const i18nEngine = fs.readFileSync(path.join(SRC_DIR, 'i18n-engine.js'), 'utf8').trim();
  const fileDrop = fs.readFileSync(path.join(SRC_DIR, 'file-drop-enhancer.js'), 'utf8').trim();
  let hudV2 = fs.readFileSync(path.join(SRC_DIR, 'hud-v2.js'), 'utf8');
  hudV2 = hudV2.replace(/\r?\nif\s*\(typeof module\s*!==\s*'undefined'[\s\S]*$/, '').trim();
  const entry = fs.readFileSync(path.join(SRC_DIR, 'entry.js'), 'utf8').trim();

  return [
    '',
    START_MARKER,
    '// Antigravity 中文汉化与实时算力/配额监控拓展包 (Auto-injected)',
    '((electronInstance) => {',
    "  if (typeof window === 'undefined') return;",
    '  const electron_1 = electronInstance;',
    "  const nodeFs = (typeof require !== 'undefined') ? (() => { try { return require('fs'); } catch(e) { return null; } })() : null;",
    "  const nodePath = (typeof require !== 'undefined') ? (() => { try { return require('path'); } catch(e) { return null; } })() : null;",
    "  const nodeOs = (typeof require !== 'undefined') ? (() => { try { return require('os'); } catch(e) { return null; } })() : null;",
    '',
    statsBridge,
    '',
    i18nEngine,
    '',
    fileDrop,
    '',
    hudV2,
    '',
    entry,
    END_MARKER,
    ''
  ].join('\n');
}

function getAntigravityConfigDir() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Antigravity');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity');
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdg, 'Antigravity');
}

function ensureCustomDictInitialized() {
  const targetDir = getAntigravityConfigDir();
  const targetFile = path.join(targetDir, 'i18n-custom.json');
  if (fs.existsSync(CONFIG_EXAMPLE) && !fs.existsSync(targetFile)) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(CONFIG_EXAMPLE, targetFile);
    console.log('[初始化] 已生成自定义词典模板 ->', targetFile);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const asarTarget = detectAsarPath(args.asar);
  console.log('[1/5] 目标 app.asar:', asarTarget);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-pack-'));
  const unpackDir = path.join(tmpRoot, 'unpacked');
  const patchedAsar = path.join(tmpRoot, 'app.asar.patched');

  try {
    // 2. 解包检查是否已打过补丁
    asar.extractAll(asarTarget, unpackDir);
    const preloadPath = path.join(unpackDir, 'dist', 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      throw new Error('解包后未找到 dist/preload.js，可能当前版本结构已变化。');
    }

    const preloadSrc = fs.readFileSync(preloadPath, 'utf8');
    const { base, alreadyPatched } = stripExistingPatch(preloadSrc);
    console.log(`[2/5] 已解包并剥离基准 preload.js (${alreadyPatched ? '升级模式' : '全新注入模式'})`);

    // 3. 备份
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const tsBackup = path.join(BACKUP_DIR, `app.asar.bak.${ts}`);
    fs.copyFileSync(asarTarget, tsBackup);
    const originalBackup = path.join(BACKUP_DIR, 'app.asar.original');
    if (!alreadyPatched && !fs.existsSync(originalBackup)) {
      fs.copyFileSync(asarTarget, originalBackup);
      console.log('[3/5] 已保存官方原版备份 ->', originalBackup);
    } else {
      console.log('[3/5] 已保存当前版本备份 ->', tsBackup);
    }

    // 4. 拼装并做语法校验
    const bundle = buildInjectedBundle();
    fs.writeFileSync(preloadPath, base + bundle, 'utf8');
    execFileSync(process.execPath, ['--check', preloadPath], { stdio: 'inherit' });

    // 4.1 确保新版 Electron 窗口关闭渲染沙盒限制，允许 preload 访问本地 fs/child_process
    const utilsPath = path.join(unpackDir, 'dist', 'utils.js');
    if (fs.existsSync(utilsPath)) {
      let utilsSrc = fs.readFileSync(utilsPath, 'utf8');
      if (utilsSrc.includes('contextIsolation: true,') && !utilsSrc.includes('sandbox: false')) {
        utilsSrc = utilsSrc.replace(
          /contextIsolation:\s*true,/g,
          'contextIsolation: true,\n            sandbox: false,'
        );
        fs.writeFileSync(utilsPath, utilsSrc, 'utf8');
        execFileSync(process.execPath, ['--check', utilsPath], { stdio: 'inherit' });
      }
    }

    // 4.2 拦截官方后台每小时静默轮询更新并强行覆盖（保护本地插件与汉化），用户手动点检查更新仍可用
    const updaterPath = path.join(unpackDir, 'dist', 'updater.js');
    if (fs.existsSync(updaterPath)) {
      let updaterSrc = fs.readFileSync(updaterPath, 'utf8');
      if (updaterSrc.includes('function startAutoUpdateChecks() {') && !updaterSrc.includes('// [Customization Protection]')) {
        updaterSrc = updaterSrc.replace(
          'function startAutoUpdateChecks() {',
          'function startAutoUpdateChecks() {\n    // [Customization Protection] 阻止后台每小时静默下载并自动覆盖\n    console.log("[AutoUpdater] 后台静默自动轮询已拦截保护");\n    return;'
        );
        fs.writeFileSync(updaterPath, updaterSrc, 'utf8');
        execFileSync(process.execPath, ['--check', updaterPath], { stdio: 'inherit' });
        console.log('      🛡️ 已拦截后台静默更新轮询');
      }
    }

    // 4.3 注入原生菜单汉化 (File -> 文件, Edit -> 编辑 等)
    const menuPath = path.join(unpackDir, 'dist', 'menu.js');
    if (fs.existsSync(menuPath)) {
      let menuSrc = fs.readFileSync(menuPath, 'utf8');
      if (!menuSrc.includes('menuTranslations')) {
        const menuHelper = `
const menuTranslations = {
  'File': '文件', 'Edit': '编辑', 'View': '视图', 'Window': '窗口', 'Help': '帮助',
  'New Window': '新建窗口', 'Check for Updates': '检查更新', 'Docs': '官方文档',
  'Undo': '撤销', 'Redo': '重做', 'Cut': '剪切', 'Copy': '复制', 'Paste': '粘贴',
  'Paste and Match Style': '粘贴并匹配样式', 'Delete': '删除', 'Select All': '全选',
  'Reload': '重新加载', 'Force Reload': '强制重新加载', 'Toggle Full Screen': '切换全屏',
  'Actual Size': '实际大小', 'Zoom In': '放大', 'Zoom Out': '缩小', 'Minimize': '最小化',
  'Zoom': '缩放', 'Close': '关闭', 'Quit Antigravity': '退出 Antigravity'
};
const localizeMenu = (menuInstance) => {
  try {
    (menuInstance && menuInstance.items ? menuInstance.items : []).forEach((item) => {
      if (item.label && menuTranslations[item.label]) item.label = menuTranslations[item.label];
      if (item.submenu) localizeMenu(item.submenu);
    });
  } catch (e) {}
};
`;
        menuSrc = menuHelper + '\n' + menuSrc;
        menuSrc = menuSrc.replace(
          /electron_1\.Menu\.setApplicationMenu\(menu\);/g,
          'localizeMenu(menu);\n    electron_1.Menu.setApplicationMenu(menu);'
        );
        fs.writeFileSync(menuPath, menuSrc, 'utf8');
        execFileSync(process.execPath, ['--check', menuPath], { stdio: 'inherit' });
        console.log('      🇨🇳 已注入顶部原生系统菜单汉化');
      }
    }

    console.log('[4/5] 已完成模块化拼装并通过 node --check 语法校验');

    if (args.dryRun) {
      console.log('[Dry-Run] 校验完成，未写回 app.asar。');
      return;
    }

    // 5. 重新打包并写回
    await asar.createPackageWithOptions(unpackDir, patchedAsar, {
      unpackDir: 'node_modules/chrome-devtools-mcp'
    });

    try {
      fs.copyFileSync(patchedAsar, asarTarget);
      console.log('[5/5] ✅ 拓展包已成功安装到:', asarTarget);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
        console.error('\n[错误] 目标 app.asar 正被运行中的 Antigravity 进程占用！');
        console.error('请先完全退出 Antigravity 客户端（含系统托盘图标），然后重新运行本脚本。');
        process.exitCode = 2;
        return;
      }
      throw err;
    }

    const stagedTargets = [
      process.env.AGY_STAGED_ASAR,
      path.join(os.homedir(), '.gemini', 'antigravity', 'app.asar.staged')
    ].filter(Boolean);
    for (const st of stagedTargets) {
      try {
        if (fs.existsSync(path.dirname(st))) {
          fs.copyFileSync(patchedAsar, st);
          console.log('      ✅ 已同步更新自愈底包 staged ->', st);
        }
      } catch (e) {}
    }

    // 清理官方残留的后台静默升级包，防止再次被旧安装包覆盖
    try {
      const pendingDir = path.join(os.homedir(), 'AppData', 'Local', 'antigravity-updater', 'pending');
      if (fs.existsSync(pendingDir)) {
        fs.rmSync(pendingDir, { recursive: true, force: true });
        console.log('      🧹 已清理后台挂起的静默升级包缓存');
      }
    } catch (e) {}

    ensureCustomDictInitialized();
    console.log('\n🎉 安装完成！请重新启动 Antigravity 即可生效。');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('\n[安装失败]', err.message || err);
  process.exit(1);
});
