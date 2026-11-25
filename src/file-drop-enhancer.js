/**
 * =========================================================================
 * Antigravity 全局文件拖拽与路径/链接自动注入增强器 (File Drop & Path/Link Autofill Enhancer)
 * 彻底解决原生客户端对 .txt、代码文件及各类文档拖拽出现 🚫 禁止图标或无法识别的痛点。
 * 拖入任意文件即自动提取本地磁盘绝对路径/文件链接并安全填入对话输入框，零卡死、零失焦。
 * =========================================================================
 */
function initFileDropEnhancer() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__antigravity_file_drop_enhancer_initialized) return;
  window.__antigravity_file_drop_enhancer_initialized = true;

  const NATIVE_OBSERVE_TIMEOUT_MS = 320;
  const NATIVE_POLL_INTERVALS_MS = [60, 150, 260, NATIVE_OBSERVE_TIMEOUT_MS];
  const ATTACHMENT_SELECTOR = [
    '[data-testid*="attachment" i]',
    '[data-testid*="file-chip" i]',
    '[class*="attachment" i]',
    'button[aria-label*="remove" i]',
    'button[aria-label*="delete" i]',
    'button[aria-label*="移除"]',
    'button[aria-label*="删除"]'
  ].join(', ');
  const LEXICAL_PILL_SELECTOR = [
    '[data-lexical-mention]',
    '[contenteditable="false"]',
    'span[class*="pill" i]',
    'span[class*="chip" i]'
  ].join(', ');
  const ERROR_TEXT_RE = /too large|exceeds|size limit|unsupported|failed to (?:attach|upload|add)|文件过大|超出.*限制|不支持/i;

  function getElectronInstance() {
    try {
      if (typeof electron_1 !== 'undefined' && electron_1) return electron_1;
      if (typeof electronInstance !== 'undefined' && electronInstance) return electronInstance;
      if (typeof electron !== 'undefined' && electron) return electron;
      if (typeof require !== 'undefined') return require('electron');
      if (window.electron) return window.electron;
    } catch (e) {}
    return null;
  }

  function getFilePath(file) {
    if (!file) return '';
    // 1. 优先通过 Electron 官方 webUtils 获取磁盘绝对路径（Chromium 120+ 标准 API）
    try {
      const el = getElectronInstance();
      if (el && el.webUtils && typeof el.webUtils.getPathForFile === 'function') {
        const p = el.webUtils.getPathForFile(file);
        if (p) return p;
      }
    } catch (e) {}
    // 2. 传统 Electron 路径属性
    try {
      if (file.path && typeof file.path === 'string') return file.path;
    } catch (e) {}
    // 3. 兜底回退文件名
    return file.name || '';
  }

  function formatPath(p) {
    if (!p) return '';
    // 如果路径包含空格且未被引号包裹，自动用双引号括起，方便后续终端与命令行工具识别
    if (p.includes(' ') && !p.startsWith('"') && !p.endsWith('"')) {
      return `"${p}"`;
    }
    return p;
  }

  function findChatInput() {
    const active = document.activeElement;
    if (active && (
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable ||
      active.getAttribute('role') === 'textbox' ||
      active.getAttribute('role') === 'combobox' ||
      (active.tagName === 'INPUT' && active.type === 'text')
    )) {
      return active;
    }

    const selectors = [
      'div[data-lexical-editor="true"]',
      'div[aria-label="消息输入框"]',
      'div[aria-label*="Message" i]',
      'div[aria-label*="Ask" i]',
      '[contenteditable="true"][role="combobox"]',
      '[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Message" i]',
      'textarea[placeholder*="问" i]',
      'textarea[placeholder*="输入" i]',
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"][placeholder*="Ask" i]',
      'div[role="textbox"]'
    ];

    for (const sel of selectors) {
      try {
        const elements = Array.from(document.querySelectorAll(sel));
        const visible = elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
        });
        if (visible.length > 0) {
          return visible[visible.length - 1];
        }
      } catch (err) {}
    }
    return null;
  }

  function findComposerRoot(inputEl) {
    const anchor = inputEl || document.querySelector('button[data-testid="model-selector-trigger"]');
    let cursor = anchor;
    for (let i = 0; i < 12 && cursor; i++) {
      const cls = typeof cursor.className === 'string' ? cursor.className : '';
      const rect = cursor.getBoundingClientRect ? cursor.getBoundingClientRect() : { height: 0, width: 0 };
      if (cls.includes('bg-card-border') || (cls.includes('rounded-2xl') && rect.height >= 60)) {
        return cursor;
      }
      cursor = cursor.parentElement;
    }
    if (inputEl && inputEl.parentElement) {
      return inputEl.parentElement.parentElement || inputEl.parentElement;
    }
    return document.body;
  }

  function getNonInputText(root, inputEl) {
    if (!root) return '';
    if (!inputEl || !root.contains(inputEl)) {
      return root.innerText || '';
    }
    const rootText = root.innerText || '';
    const inputText = inputEl.innerText || '';
    if (inputText && rootText.includes(inputText)) {
      return rootText.replace(inputText, '');
    }
    return rootText;
  }

  function captureComposerSnapshot(root, inputEl) {
    if (!root) {
      return { imgCount: 0, chipCount: 0, pillCount: 0, nonInputText: '' };
    }
    return {
      imgCount: root.querySelectorAll('img').length,
      chipCount: root.querySelectorAll(ATTACHMENT_SELECTOR).length,
      pillCount: inputEl ? inputEl.querySelectorAll(LEXICAL_PILL_SELECTOR).length : 0,
      nonInputText: getNonInputText(root, inputEl)
    };
  }

  function classifyNativeAcceptance(root, inputEl, baseline, fileMetaList) {
    if (!root) {
      return { acceptedFiles: [], rejectedFiles: fileMetaList };
    }
    const current = captureComposerSnapshot(root, inputEl);
    const imgDelta = Math.max(0, current.imgCount - baseline.imgCount);
    const chipDelta = Math.max(0, current.chipCount - baseline.chipCount);
    const pillDelta = Math.max(0, current.pillCount - baseline.pillCount);
    const addedAttachmentSignals = Math.max(imgDelta, chipDelta, pillDelta);

    // 提取非输入区新增文本，排除明确的超限/失败错误提示
    let deltaText = '';
    if (current.nonInputText && current.nonInputText !== baseline.nonInputText) {
      deltaText = current.nonInputText;
      if (baseline.nonInputText && deltaText.startsWith(baseline.nonInputText)) {
        deltaText = deltaText.slice(baseline.nonInputText.length);
      }
    }
    const hasErrorHint = ERROR_TEXT_RE.test(deltaText);

    // 若没有任何附件节点新增，则认为原生未接收
    if (addedAttachmentSignals === 0 && (hasErrorHint || !deltaText.trim())) {
      return { acceptedFiles: [], rejectedFiles: fileMetaList };
    }

    // 多文件或单文件按文件名精准匹配（排除错误提示里的文件名误判）
    const acceptedFiles = [];
    const rejectedFiles = [];
    if (!hasErrorHint && deltaText) {
      for (const meta of fileMetaList) {
        const name = meta.file.name || '';
        const stem = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
        if ((name && deltaText.includes(name)) || (stem && stem.length >= 3 && deltaText.includes(stem))) {
          acceptedFiles.push(meta);
        } else {
          rejectedFiles.push(meta);
        }
      }
      if (acceptedFiles.length > 0 && rejectedFiles.length === 0) {
        return { acceptedFiles, rejectedFiles };
      }
    }

    // 若原生只渲染了缩略图（如图片）未渲染文件名文本，按新增附件数判定
    if (addedAttachmentSignals >= fileMetaList.length) {
      return { acceptedFiles: fileMetaList, rejectedFiles: [] };
    }

    if (acceptedFiles.length > 0) {
      return { acceptedFiles, rejectedFiles };
    }

    // 有部分缩略图/chip新增但少于文件总数，或仅部分识别
    if (addedAttachmentSignals > 0 && fileMetaList.length === 1) {
      return { acceptedFiles: fileMetaList, rejectedFiles: [] };
    }

    return { acceptedFiles: [], rejectedFiles: fileMetaList };
  }

  function insertTextToInput(inputEl, text) {
    if (!inputEl) return false;

    // 针对 ContentEditable (如 Lexical 编辑器)
    if (inputEl.isContentEditable) {
      try {
        inputEl.focus();
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(inputEl);
          range.collapse(false); // 确保光标折叠在输入框已有内容的最末尾
          sel.removeAllRanges();
          sel.addRange(range);
        }

        // 如果已有文本且结尾无空白字符，自动补一个前置空格；尾部追加一个后置空格
        const curText = inputEl.innerText || '';
        const prefix = (curText.length > 0 && !/\s$/.test(curText)) ? ' ' : '';
        const insertContent = prefix + text + ' ';

        // 优先使用标准 execCommand，由 Lexical 原生转化为 Paragraph / TextNode
        let execOk = false;
        try {
          execOk = document.execCommand('insertText', false, insertContent);
        } catch(e) {}

        if (execOk) {
          inputEl.focus();
          return true;
        }

        // 备用：触发 beforeinput 事件
        const ev = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: insertContent
        });
        inputEl.dispatchEvent(ev);
        inputEl.focus();
        return true;
      } catch (err) {
        console.warn('[Antigravity-Drop] ContentEditable 文本注入异常:', err);
      }
    }

    // 针对标准 Textarea / Input 的 React 原型链注入
    if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
      try {
        inputEl.focus();
        let execSuccess = false;
        try {
          execSuccess = document.execCommand('insertText', false, text);
        } catch (e) {}
        if (execSuccess) return true;

        const start = typeof inputEl.selectionStart === 'number' ? inputEl.selectionStart : inputEl.value.length;
        const end = typeof inputEl.selectionEnd === 'number' ? inputEl.selectionEnd : inputEl.value.length;
        const val = inputEl.value || '';
        const prefix = (start > 0 && !/\s$/.test(val.substring(0, start))) ? ' ' : '';
        const suffix = (end < val.length && !/^\s/.test(val.substring(end))) ? ' ' : '';
        const insertStr = prefix + text + suffix;
        const newVal = val.substring(0, start) + insertStr + val.substring(end);

        const tracker = inputEl._valueTracker;
        if (tracker) tracker.setValue(val);

        const proto = inputEl.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(inputEl, newVal);
        } else {
          inputEl.value = newVal;
        }

        inputEl.selectionStart = inputEl.selectionEnd = start + insertStr.length;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } catch (e) {}
    }

    return false;
  }

  function showToast(msg) {
    try {
      let toast = document.getElementById('antigravity-drop-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'antigravity-drop-toast';
        toast.style.cssText = [
          'position: fixed',
          'bottom: 84px',
          'left: 50%',
          'transform: translateX(-50%) translateY(20px)',
          'background: rgba(24, 25, 28, 0.95)',
          'color: #f1f3f4',
          'border: 1px solid rgba(66, 133, 244, 0.4)',
          'backdrop-filter: blur(10px)',
          'padding: 8px 18px',
          'border-radius: 22px',
          'font-size: 13px',
          'font-weight: 500',
          'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 12px rgba(66, 133, 244, 0.25)',
          'z-index: 999999',
          'opacity: 0',
          'transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          'pointer-events: none',
          'display: flex',
          'align-items: center',
          'gap: 8px'
        ].join(';');
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><span>' + msg + '</span>';
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
      }, 2500);
    } catch (e) {}
  }

  // 清除原生页面因拖拽可能遗留的拖拽遮罩与锁定状态
  function cleanupDragState() {
    try {
      window.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));
      document.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));
      const lingeringOverlays = document.querySelectorAll('[class*="backdrop-blur-xs fixed inset-0"]');
      lingeringOverlays.forEach(node => {
        try { node.remove(); } catch(e) {}
      });
    } catch (e) {}
  }

  function injectPathsIntoChat(fileMetaList, toastPrefix) {
    const paths = fileMetaList.map(m => m.path).filter(Boolean);
    if (paths.length === 0) return;

    const textToInsert = paths.join('\n');
    const inputEl = findChatInput();
    if (inputEl) {
      const ok = insertTextToInput(inputEl, textToInsert);
      if (ok) {
        const fileNames = fileMetaList.map(m => m.file.name).join(', ');
        showToast(fileMetaList.length === 1 ? `${toastPrefix}: ${fileNames}` : `${toastPrefix} (${fileMetaList.length} 个文件)`);
      }
      setTimeout(() => {
        try {
          inputEl.focus();
        } catch (e) {}
      }, 30);
    } else {
      try {
        navigator.clipboard.writeText(textToInsert);
        showToast('已复制文件路径至剪贴板');
      } catch (err) {}
    }
  }

  let dragCounter = 0;

  // 1. DRAGENTER 阶段
  window.addEventListener('dragenter', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      dragCounter++;
      e.preventDefault();
    }
  }, true);

  // 2. DRAGOVER 阶段 - 防止出现 🚫 禁止图标
  window.addEventListener('dragover', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, true);

  // 3. DRAGLEAVE 阶段
  window.addEventListener('dragleave', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      dragCounter = Math.max(0, dragCounter - 1);
    }
  }, true);

  // 4. DROP 捕获阶段 - 修饰键强制只填路径；正常拖拽放行原生并动态观测是否挂载成功
  window.addEventListener('drop', (e) => {
    dragCounter = 0;
    setTimeout(cleanupDragState, 15);
    setTimeout(cleanupDragState, 80);

    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    // 同步提取所有绝对路径，避免异步回调时 DataTransfer/File 上下文失效
    const fileMetaList = files.map(file => ({
      file,
      path: formatPath(getFilePath(file))
    }));

    const isSpecialModifierPressed = e.shiftKey || e.ctrlKey || e.altKey;
    if (isSpecialModifierPressed) {
      // 按住 Shift/Ctrl/Alt 时彻底阻断原生附件上传，仅注入路径
      e.preventDefault();
      e.stopImmediatePropagation();
      injectPathsIntoChat(fileMetaList, '已强制填入文件路径');
      return;
    }

    // 正常拖拽：先放行给原生处理（不调用 preventDefault/stopPropagation），并采集投递前快照
    const inputEl = findChatInput();
    const composerRoot = findComposerRoot(inputEl);
    const baseline = captureComposerSnapshot(composerRoot, inputEl);

    let settled = false;
    let observer = null;
    const timers = [];

    const finish = () => {
      if (settled) return;
      settled = true;
      if (observer) {
        try { observer.disconnect(); } catch (err) {}
      }
      timers.forEach(t => clearTimeout(t));
    };

    const evaluate = (isFinal) => {
      if (settled) return;
      const { acceptedFiles, rejectedFiles } = classifyNativeAcceptance(composerRoot, inputEl, baseline, fileMetaList);

      // 全部被原生成功接管：静默退出，绝不重复注入路径
      if (rejectedFiles.length === 0 && acceptedFiles.length > 0) {
        finish();
        return;
      }

      if (!isFinal) return;

      finish();
      if (rejectedFiles.length > 0) {
        const prefix = acceptedFiles.length > 0
          ? '部分文件未被原生接收，已填入路径'
          : '已填入文件路径';
        injectPathsIntoChat(rejectedFiles, prefix);
      }
    };

    try {
      if (composerRoot && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => evaluate(false));
        observer.observe(composerRoot, { childList: true, subtree: true, characterData: true });
      }
    } catch (err) {}

    NATIVE_POLL_INTERVALS_MS.forEach((delay, idx) => {
      const isFinal = idx === NATIVE_POLL_INTERVALS_MS.length - 1;
      timers.push(setTimeout(() => evaluate(isFinal), delay));
    });
  }, true);

  // 5. DROP 冒泡阶段兜底 - 防止 Chromium 默认将未处理的拖入文件直接导航打开
  window.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
    }
  }, false);
}

// 立即自执行拖拽增强初始化
try {
  initFileDropEnhancer();
} catch (e) {
  console.warn('[Antigravity-Drop] 拖拽增强自启动异常:', e && e.message);
}

if (typeof exports !== 'undefined') {
  exports.initFileDropEnhancer = initFileDropEnhancer;
}

