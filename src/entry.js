// 统一启动入口：依次初始化原生统计桥接、简体中文汉化引擎、全局文件拖拽增强与 V2.1 算力/配额底栏
  initStatsBridge(electron_1, nodeFs, nodePath, nodeOs);

  // 清除 Claude 主题样式与主题徽标残留，确保左下角 controlDock 完好无损
  try {
    const s = document.getElementById('agy-claude-theme-styles');
    if (s) s.remove();
    const b = document.getElementById('agy-claude-theme-badge');
    if (b) b.remove();
    if (document.body) {
      document.body.classList.remove('agy-claude-active', 'agy-claude-light');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('__agy_theme_mode');
    }
  } catch (e) {}

  try {
    if (typeof initI18nEngine === 'function') initI18nEngine();
  } catch (e) {
    console.warn('[Antigravity-i18n] 引擎加载异常:', e && e.message);
  }
  try {
    if (typeof initFileDropEnhancer === 'function') initFileDropEnhancer();
  } catch (e) {
    console.warn('[Antigravity-Drop] 拖拽增强加载异常:', e && e.message);
  }
  try {
    if (typeof initAntigravityDashboard === 'function') {
      initAntigravityDashboard(nodeFs, nodePath, nodeOs);
    }
  } catch (e) {
    console.warn('[Antigravity-Dashboard] 仪表盘加载异常:', e && e.message);
  }
})(typeof electron_1 !== 'undefined' ? electron_1 : null);
