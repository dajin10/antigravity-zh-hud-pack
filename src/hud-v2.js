/**
 * Antigravity 实时算力、Token 与模型配额监控状态栏 V2.1
 *
 * 架构特性：
 * 1. 挂载于输入框圆角卡片外部正下方（Footer 双行极简底栏），彻底释放输入框内部工具栏空间。
 * 2. 第 1 行（DeepSeek Harness 风格四段式遥测）：
 *    [1] 会话统计（N 轮 M 步）
 *    [2] Token 生成速率（XX.X tok/s，流式态实时脉冲）
 *    [3] Token 累计用量与缓存命中（XX.XM tok · 缓存命中 XX%）
 *    [4] 上下文窗口圆环占比（XX%，点击展开原生二级树状消耗排行）
 * 3. 第 2 行（当前模型配额实时同步条）：
 *    - 自动监听对话窗口模型选择器，切模型 0 延迟切换对应配额池
 *    - 展示：当前模型名 + 彩色剩余进度条 + 剩余百分比 + 倒计时 + 精确重置时间 + 手动刷新按钮
 *    - 点击弹出「全模型配额总览」Popover 卡片（按共享配额池智能归组，高亮当前模型）
 *
 * Launcher Check Marker: antigravityDashboardPatch_v1
 */

function initAntigravityDashboard(injectedFs, injectedPath, injectedOs) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // ---------------------------------------------------------------------------
  // 1. 清理旧版 V1 及历史热注入残留 DOM / 定时器 / 事件监听
  // ---------------------------------------------------------------------------
  const obsoleteIds = [
    'agy-dashboard-toggle-badge',
    'agy-dashboard-drawer',
    'agy-dashboard-overlay',
    'agy-dashboard-styles',
    'agy-status-hud',
    'agy-hud-styles',
    'agy-footer-hud',
    'agy-hud-v2-styles',
    'agy-hud-v2-popover'
  ];
  obsoleteIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  if (window.__antigravity_hud_timers) {
    window.__antigravity_hud_timers.forEach((t) => clearInterval(t));
  }
  window.__antigravity_hud_timers = [];

  if (window.__antigravity_hud_cleanup && typeof window.__antigravity_hud_cleanup === 'function') {
    try {
      window.__antigravity_hud_cleanup();
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 2. 状态模型
  // ---------------------------------------------------------------------------
  const hudState = {
    cascadeId: null,
    isStreaming: false,
    hasServerData: false,

    // 段 1：会话统计
    turns: 0,
    stepsCount: 0,
    modelTimeSec: 0,
    toolTimeSec: 0,
    avgTtftSec: 0,
    avgTps: 0,

    // 段 2：生成速率（实时/末轮）
    currentTps: 0,
    lastOutput: 0,
    lastThinkingOutput: 0,
    lastResponseOutput: 0,
    lastDurationSec: 0,
    lastTtftSec: 0,

    // 段 3：Token 累计用量与缓存
    sumInput: 0,
    sumCacheRead: 0,
    sumOutput: 0,
    sumThinkingOutput: 0,
    sumTotalTokens: 0,
    avgCacheHitPct: 0,
    lastInput: 0,
    lastCacheRead: 0,
    lastCacheHitPct: 0,
    lastModelId: '',

    // 段 4：上下文窗口与分段明细
    contextTokens: 0,
    maxContextTokens: 0,
    contextPct: 0,
    breakdownGroups: [],

    // 第 2 行：模型配额同步（直连 RetrieveUserQuotaSummary）
    selectedModelRawText: '',
    quotaGroups: [],       // 官方 groups: [{ displayName, labelZh, description, models[], bucket5h, bucketWeekly, isCurrent }]
    activeQuotaGroup: null,// 当前选中模型命中的配额组
    activeModelShort: '',  // 当前模型高亮简名
    quotaLastFetch: 0,
    isRefreshingQuota: false
  };

  // UI 交互状态
  const uiState = {
    openPanel: null, // null | 'session' | 'speed' | 'tokens' | 'context' | 'quota'
    expandedGroups: {}
  };

  // 流式增量采样状态
  const streamTracker = {
    cascadeId: null,
    activeStepIdx: -1,
    lastChars: 0,
    lastTime: 0,
    startChars: 0,
    startTime: 0,
    deltaTokens: 0,
    emaTps: 0
  };

  let isFetchingTraj = false;
  let isFetchingQuota = false;
  let cachedCsrfToken = '';
  let mountObserver = null;
  let prevStreamingFlag = false;

  // ---------------------------------------------------------------------------
  // 3. 工具函数与格式化
  // ---------------------------------------------------------------------------
  function getCsrfToken() {
    if (cachedCsrfToken) return cachedCsrfToken;
    try {
      if (window.localStorage) {
        const lsToken = window.localStorage.getItem('agy_session_csrf_token');
        if (lsToken) {
          cachedCsrfToken = lsToken;
          return cachedCsrfToken;
        }
      }
      if (window.__APP_CONFIG__ && window.__APP_CONFIG__.csrfToken) {
        cachedCsrfToken = window.__APP_CONFIG__.csrfToken;
        return cachedCsrfToken;
      }
      if (window.__AGY_CACHED_CSRF__) {
        cachedCsrfToken = window.__AGY_CACHED_CSRF__;
        return cachedCsrfToken;
      }
      if (document && document.scripts) {
        for (let i = 0; i < document.scripts.length; i++) {
          const txt = document.scripts[i].textContent || '';
          if (txt.includes('csrfToken')) {
            const m = txt.match(/"csrfToken"\s*:\s*"([^"]+)"/);
            if (m && m[1]) {
              cachedCsrfToken = m[1];
              window.__AGY_CACHED_CSRF__ = m[1];
              return cachedCsrfToken;
            }
          }
        }
      }
    } catch (e) {}
    return '';
  }

  async function callLanguageServerRpc(method, payload) {
    const csrf = getCsrfToken();
    if (!csrf) return null;
    const jsonBytes = new TextEncoder().encode(JSON.stringify(payload || {}));
    const frame = new Uint8Array(5 + jsonBytes.length);
    frame[0] = 0;
    const len = jsonBytes.length;
    frame[1] = (len >> 24) & 0xff;
    frame[2] = (len >> 16) & 0xff;
    frame[3] = (len >> 8) & 0xff;
    frame[4] = len & 0xff;
    frame.set(jsonBytes, 5);

    const fetchFn = window.__ORIGINAL_FETCH__ || window.fetch;
    const res = await fetchFn(`/exa.language_server_pb.LanguageServerService/${method}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/grpc-web+json',
        'x-codeium-csrf-token': csrf,
        'x-grpc-web': '1'
      },
      body: frame
    });
    const grpcStatus = res.headers && res.headers.get ? res.headers.get('grpc-status') : null;
    if (!res.ok || grpcStatus === '16') {
      cachedCsrfToken = '';
      return null;
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length <= 5) return null;

    let txt = new TextDecoder().decode(buf.slice(5));
    const braceIdx = txt.lastIndexOf('}');
    if (braceIdx !== -1) txt = txt.slice(0, braceIdx + 1);
    return JSON.parse(txt);
  }

  function getActiveCascadeId() {
    try {
      const m = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      if (m && m[1]) return m[1];
      const sp = new URLSearchParams(window.location.search).get('cascadeId');
      if (sp) return sp;
      if (window.__TSR_ROUTER__ && window.__TSR_ROUTER__.state && window.__TSR_ROUTER__.state.matches) {
        for (const match of window.__TSR_ROUTER__.state.matches) {
          if (match.params && match.params.cascadeId) return match.params.cascadeId;
        }
      }
    } catch (e) {}
    return null;
  }

  function getSelectedModelButtonText() {
    const btn = document.querySelector('button[data-testid="model-selector-trigger"]');
    if (!btn) return '';
    return (btn.getAttribute('data-model-label') || btn.innerText || btn.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  }

  function getFallbackModelLimit() {
    const btn = document.querySelector('button[data-testid="model-selector-trigger"]');
    if (btn) {
      const cw = Number(btn.getAttribute('data-context-window'));
      if (Number.isFinite(cw) && cw > 0) return cw;
    }
    const text = getSelectedModelButtonText().toLowerCase();
    if (text.includes('hydrogen')) return 256000;
    if (text.includes('neon')) return 512000;
    if (text.includes('argon')) return 1000000;
    if (text.includes('claude') || text.includes('sonnet') || text.includes('opus')) return 200000;
    if (text.includes('pro')) return 2000000;
    if (text.includes('flash')) return 1000000;
    if (text.includes('gpt-4') || text.includes('o1') || text.includes('o3')) return 128000;
    return 1000000;
  }

  function isDomStreaming() {
    const stopBtn = document.querySelector(
      '[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="停止"], button[title*="Stop"], button[title*="停止"]'
    );
    if (stopBtn && !stopBtn.disabled) {
      const r = stopBtn.getBoundingClientRect();
      if (r.width > 5 && r.height > 5) return true;
    }
    return false;
  }

  function isLightTheme() {
    const b = document.body;
    const h = document.documentElement;
    if (b && (b.classList.contains('dark') || b.classList.contains('theme-dark') || b.classList.contains('vscode-dark'))) {
      return false;
    }
    if (h && (h.classList.contains('dark') || h.classList.contains('theme-dark'))) {
      return false;
    }
    try {
      const bg = getComputedStyle(b).backgroundColor;
      const m = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        const lum = 0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3]);
        return lum > 128;
      }
    } catch (e) {}
    return true;
  }

  function formatCompactTokens(num) {
    const n = Number(num || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 100000) return Math.round(n / 1000) + 'K';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(Math.round(n));
  }

  function formatCapTokens(num) {
    const n = Number(num || 0);
    if (n >= 1000000) {
      const m = n / 1000000;
      return (Number.isInteger(m) ? m.toString() : m.toFixed(1)) + 'M';
    }
    if (n >= 1000) return Math.round(n / 1000) + 'K';
    return String(Math.round(n));
  }

  function formatExactTokens(num) {
    return Math.round(Number(num || 0)).toLocaleString('en-US');
  }

  function formatDurationZh(sec) {
    const s = Math.max(0, Number(sec || 0));
    if (s < 0.05) return '0秒';
    if (s < 60) return s < 10 ? `${s.toFixed(1)}秒` : `${Math.round(s)}秒`;
    const mins = Math.floor(s / 60);
    const remSec = Math.round(s % 60);
    if (mins < 60) return remSec > 0 ? `${mins}分${remSec}秒` : `${mins}分`;
    const hrs = Math.floor(mins / 60);
    const remMin = mins % 60;
    return `${hrs}小时${remMin}分`;
  }

  function formatPercentInt(pct) {
    const v = Number(pct || 0);
    if (v <= 0) return '0%';
    if (v < 1) return `${v.toFixed(1)}%`;
    return `${Math.round(v)}%`;
  }

  function formatQuotaPct(fraction) {
    if (fraction === null || fraction === undefined || Number.isNaN(Number(fraction))) return '--';
    const pct = Math.max(0, Math.min(100, Number(fraction) * 100));
    if (pct >= 99.95) return '100%';
    if (pct <= 0.05) return '0%';
    return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
  }

  function formatResetInfo(resetIso) {
    if (!resetIso) return { countdown: '', clock: '', full: '' };
    const ts = Date.parse(resetIso);
    if (!Number.isFinite(ts)) return { countdown: '', clock: '', full: '' };
    const now = Date.now();
    const diffMs = Math.max(0, ts - now);
    const totalMin = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMin / 1440);
    const hours = Math.floor((totalMin % 1440) / 60);
    const mins = totalMin % 60;

    let countdown = '';
    if (diffMs <= 60000) {
      countdown = '<1m';
    } else if (days > 0) {
      countdown = `${days}d${hours}h`;
    } else if (hours > 0) {
      countdown = `${hours}h${mins}m`;
    } else {
      countdown = `${mins}m`;
    }

    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const today = new Date(now);
    const isSameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    const clock = isSameDay ? `重置于 ${hhmm}` : `重置于 ${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
    const full = `重置于 ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmm}:${pad(d.getSeconds())}`;
    return { countdown, clock, full, isWeekly: days >= 2 };
  }

  function parseProtoSec(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const n = parseFloat(String(val).replace(/s$/i, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function mapGroupMeta(group) {
    const type = String(group.type || '');
    const name = String(group.name || '');
    if (type === 'TOKEN_TYPE_SYSTEM_PROMPT' || /system\s*prompt/i.test(name)) {
      return { key: 'system', label: '系统提示词', color: '#94a3b8' };
    }
    if (type === 'TOKEN_TYPE_TOOLS' || /^tools$/i.test(name)) {
      return { key: 'tools', label: '工具定义', color: '#a78bfa' };
    }
    if (type === 'TOKEN_TYPE_CHAT_MESSAGES' || /chat\s*messages/i.test(name)) {
      return { key: 'chat', label: '对话消息', color: '#3b82f6' };
    }
    return { key: name.toLowerCase().replace(/\s+/g, '_') || 'other', label: name || '其他上下文', color: '#14b8a6' };
  }

  // ---------------------------------------------------------------------------
  // 4. 模型名称标准化与配额池归组匹配（兼容中文汉化思考量后缀）
  // ---------------------------------------------------------------------------
  function normalizeModelDescriptor(raw) {
    const s = String(raw || '').toLowerCase();
    let tier = '';
    if (/xhigh|极高|超高|最大/.test(s)) tier = 'xhigh';
    else if (/\(high\)|\bhigh\b|高思考/.test(s)) tier = 'high';
    else if (/\(medium\)|\bmedium\b|中思考/.test(s)) tier = 'medium';
    else if (/\(low\)|\blow\b|低思考/.test(s)) tier = 'low';

    const base = s
      .replace(/\((xhigh|high|medium|low)\)/g, '')
      .replace(/(极高|超高|高|中|低)思考量?/g, '')
      .replace(/\b(xhigh|high|medium|low)\b/g, '')
      .replace(/[^\w.\-\u4e00-\u9fa5]+/g, ' ')
      .trim();

    return { base, tier };
  }

  function stripTierFromLabel(label) {
    return String(label || '')
      .replace(/\s*\((XHigh|High|Medium|Low)\)\s*/gi, '')
      .trim();
  }

  function translateGroupName(name) {
    const n = String(name || '');
    if (/^gemini\s+models$/i.test(n)) return 'Gemini 模型';
    if (/claude\s+and\s+gpt/i.test(n)) return 'Claude 与 GPT 模型';
    return n;
  }

  function extractModelsFromGroup(g) {
    const desc = String(g.description || '');
    const m = desc.match(/Models within this group:\s*([^\n.]+)/i);
    if (m && m[1]) {
      return m[1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return g.displayName ? [g.displayName] : [];
  }

  function formatSelectedModelShort(rawText) {
    if (!rawText) return '';
    return rawText
      .replace(/\s*\((XHigh|High|Medium|Low)\)\s*/gi, '')
      .replace(/\s*(极高|超高|高|中|低)思考量?\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function resolveActiveQuotaGroup() {
    const groups = hudState.quotaGroups || [];
    const rawText = getSelectedModelButtonText();
    hudState.selectedModelRawText = rawText;
    const shortName = formatSelectedModelShort(rawText);
    hudState.activeModelShort = shortName;

    if (groups.length === 0) {
      hudState.activeQuotaGroup = null;
      return;
    }

    const targetBase = normalizeModelDescriptor(rawText || hudState.lastModelId || '').base;
    let matched = null;

    if (targetBase) {
      // 1) 优先精确匹配独立配额组标题（如 Gemini 4 Argon，防止误落入通用 Gemini Models）
      matched = groups.find((g) => {
        const gBase = normalizeModelDescriptor(g.displayName).base;
        return gBase && (targetBase === gBase || targetBase.includes(gBase) || gBase.includes(targetBase));
      });

      // 2) 其次匹配组内声明的模型列表 (Models within this group: ...)
      if (!matched) {
        matched = groups.find((g) =>
          (g.models || []).some((mName) => {
            const mBase = normalizeModelDescriptor(mName).base;
            return mBase && (targetBase === mBase || targetBase.includes(mBase) || mBase.includes(targetBase));
          })
        );
      }

      // 3) 兜底按模型家族关键词匹配
      if (!matched) {
        if (targetBase.includes('argon')) {
          matched = groups.find((g) => /argon/i.test(g.displayName));
        } else if (/claude|sonnet|opus|gpt/i.test(targetBase)) {
          matched = groups.find((g) => /claude|gpt/i.test(g.displayName));
        } else if (/gemini|neon|hydrogen|flash/i.test(targetBase)) {
          matched = groups.find((g) => /gemini\s*models/i.test(g.displayName)) || groups.find((g) => /gemini/i.test(g.displayName));
        }
      }
    }

    if (!matched) matched = groups[0];
    groups.forEach((g) => {
      g.isCurrent = g === matched;
    });
    hudState.activeQuotaGroup = matched;
  }

  function formatBucketShortLabel(b) {
    const w = String((b && b.window) || '').trim().toLowerCase();
    const id = String((b && b.bucketId) || '').trim().toLowerCase();
    if (w === '5h' || /5h/.test(id)) return '5h';
    if (w === 'weekly' || /weekly/.test(id)) return '每周';
    if (w === 'daily' || /daily/.test(id)) return '每日';
    if (/^\d+[smhd]$/.test(w)) return w;
    return (b && (b.displayName || b.window || b.bucketId)) || '限额';
  }

  function formatBucketLongLabel(b) {
    const w = String((b && b.window) || '').trim().toLowerCase();
    const id = String((b && b.bucketId) || '').trim().toLowerCase();
    if (w === '5h' || /5h/.test(id)) return '5 小时限额剩余';
    if (w === 'weekly' || /weekly/.test(id)) return '每周限额剩余';
    if (w === 'daily' || /daily/.test(id)) return '每日限额剩余';
    if (/^\d+[smhd]$/.test(w)) return `${w} 限额剩余`;
    return (b && b.displayName) || '配额剩余';
  }

  function normalizeQuotaBucket(b) {
    if (!b) return null;
    let frac = b.remainingFraction;
    if (frac === undefined && b.remaining && b.remaining.case === 'remainingFraction') {
      frac = b.remaining.value;
    }
    return {
      ...b,
      remainingFraction: frac,
      shortLabel: formatBucketShortLabel(b),
      longLabel: formatBucketLongLabel(b)
    };
  }

  async function syncModelQuotas(force) {
    if (isFetchingQuota) return;
    const now = Date.now();
    if (!force && hudState.quotaLastFetch > 0 && now - hudState.quotaLastFetch < 55000) {
      return;
    }

    isFetchingQuota = true;
    hudState.isRefreshingQuota = true;
    renderFooterSegments();
    try {
      const data = await callLanguageServerRpc('RetrieveUserQuotaSummary', {});
      const rawGroups = (data && data.response && data.response.groups) || (data && data.groups) || [];
      if (rawGroups.length > 0) {
        hudState.quotaGroups = rawGroups.map((g) => {
          const rawBuckets = Array.isArray(g.buckets) ? g.buckets : [];
          const enabledBuckets = rawBuckets.filter((b) => !b.disabled).map(normalizeQuotaBucket).filter(Boolean);
          const buckets = (enabledBuckets.length > 0 ? enabledBuckets : rawBuckets.map(normalizeQuotaBucket).filter(Boolean))
            .slice()
            .sort((a, b) => {
              const rank = (x) => (x.shortLabel === '5h' ? 0 : (x.shortLabel === '每周' ? 1 : 2));
              return rank(a) - rank(b);
            });
          const bucket5h = buckets.find((b) => b.shortLabel === '5h') || null;
          const bucketWeekly = buckets.find((b) => b.shortLabel === '每周') || null;
          return {
            displayName: g.displayName || '',
            labelZh: translateGroupName(g.displayName),
            description: g.description || '',
            models: extractModelsFromGroup(g),
            buckets,
            bucket5h,
            bucketWeekly,
            isCurrent: false
          };
        });
        hudState.quotaLastFetch = Date.now();
        resolveActiveQuotaGroup();
      }
    } catch (e) {
      // 静默容错
    } finally {
      isFetchingQuota = false;
      hudState.isRefreshingQuota = false;
      renderAll();
    }
  }

  function resetHudForNewSession(cid) {
    hudState.cascadeId = cid;
    hudState.isStreaming = false;
    hudState.hasServerData = false;
    hudState.turns = 0;
    hudState.stepsCount = 0;
    hudState.modelTimeSec = 0;
    hudState.toolTimeSec = 0;
    hudState.avgTtftSec = 0;
    hudState.avgTps = 0;
    hudState.currentTps = 0;
    hudState.lastOutput = 0;
    hudState.lastThinkingOutput = 0;
    hudState.lastResponseOutput = 0;
    hudState.lastDurationSec = 0;
    hudState.lastTtftSec = 0;
    hudState.sumInput = 0;
    hudState.sumCacheRead = 0;
    hudState.sumOutput = 0;
    hudState.sumThinkingOutput = 0;
    hudState.sumTotalTokens = 0;
    hudState.avgCacheHitPct = 0;
    hudState.lastInput = 0;
    hudState.lastCacheRead = 0;
    hudState.lastCacheHitPct = 0;
    hudState.lastModelId = '';
    hudState.contextTokens = 0;
    hudState.maxContextTokens = getFallbackModelLimit();
    hudState.contextPct = 0;
    hudState.breakdownGroups = [];

    uiState.expandedGroups = {};

    streamTracker.cascadeId = cid;
    streamTracker.activeStepIdx = -1;
    streamTracker.lastChars = 0;
    streamTracker.lastTime = 0;
    streamTracker.startChars = 0;
    streamTracker.startTime = 0;
    streamTracker.deltaTokens = 0;
    streamTracker.emaTps = 0;
  }

  // ---------------------------------------------------------------------------
  // 5. 直连 GetCascadeTrajectory 聚合全量遥测指标
  // ---------------------------------------------------------------------------
  async function syncTrajectoryMetrics() {
    if (isFetchingTraj) return;
    const cid = getActiveCascadeId();

    if (!cid) {
      if (hudState.cascadeId !== null) {
        resetHudForNewSession(null);
        renderAll();
      }
      return;
    }

    if (cid !== hudState.cascadeId) {
      resetHudForNewSession(cid);
      renderAll();
    }

    isFetchingTraj = true;
    try {
      const data = await callLanguageServerRpc('GetCascadeTrajectory', { cascadeId: cid });
      if (!data || getActiveCascadeId() !== cid) return;

      const traj = data.trajectory || {};
      const steps = traj.steps || [];
      const genMeta = traj.generatorMetadata || [];

      let turns = 0;
      let toolTimeSec = 0;
      let sumIn = 0;
      let sumCache = 0;
      let sumOut = 0;
      let sumThink = 0;
      let lastUsage = null;

      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        const stype = String(s.type || '');
        if (stype === 'CORTEX_STEP_TYPE_USER_INPUT') {
          turns++;
        } else if (
          stype &&
          stype !== 'CORTEX_STEP_TYPE_PLANNER_RESPONSE' &&
          stype !== 'CORTEX_STEP_TYPE_SYSTEM_MESSAGE' &&
          stype !== 'CORTEX_STEP_TYPE_CHECKPOINT'
        ) {
          const m = s.metadata || {};
          const startIso = m.startedAt || m.createdAt;
          const endIso = m.completedAt;
          if (startIso && endIso) {
            const dt = (Date.parse(endIso) - Date.parse(startIso)) / 1000;
            if (Number.isFinite(dt) && dt > 0 && dt < 7200) {
              toolTimeSec += dt;
            }
          }
        }

        const u = s.metadata && s.metadata.modelUsage;
        if (u) {
          sumIn += Number(u.inputTokens || 0);
          sumCache += Number(u.cacheReadTokens || 0);
          sumOut += Number(u.outputTokens || 0);
          sumThink += Number(u.thinkingOutputTokens || 0);
          lastUsage = u;
        }
      }

      let modelTimeSec = 0;
      let ttftSum = 0;
      let ttftCount = 0;
      let totalStreamSec = 0;
      let totalStreamOut = 0;
      let lastGenChat = null;
      let lastCompletedChat = null;

      for (let i = 0; i < genMeta.length; i++) {
        const cm = genMeta[i] && genMeta[i].chatModel;
        if (!cm) continue;
        lastGenChat = cm;
        if (!lastUsage && cm.usage) lastUsage = cm.usage;

        const dur = parseProtoSec(cm.streamingDuration);
        const ttft = parseProtoSec(cm.timeToFirstToken);
        const outTok = Number((cm.usage && cm.usage.outputTokens) || 0);

        if (dur > 0) modelTimeSec += dur;
        if (ttft > 0) {
          modelTimeSec += ttft;
          ttftSum += ttft;
          ttftCount++;
        }
        // 过滤网络缓冲突发（流式时间小于 0.25 秒且 token 较少时，网络单包瞬间交付会导致除法失真）
        if (dur >= 0.25 && outTok >= 30) {
          totalStreamSec += dur;
          totalStreamOut += outTok;
          lastCompletedChat = cm;
        } else if (!lastCompletedChat && outTok > 0) {
          lastCompletedChat = cm;
        }
      }

      if (sumIn === 0 && sumCache === 0 && sumOut === 0 && genMeta.length > 0) {
        for (let i = 0; i < genMeta.length; i++) {
          const u = genMeta[i] && genMeta[i].chatModel && genMeta[i].chatModel.usage;
          if (u) {
            sumIn += Number(u.inputTokens || 0);
            sumCache += Number(u.cacheReadTokens || 0);
            sumOut += Number(u.outputTokens || 0);
            sumThink += Number(u.thinkingOutputTokens || 0);
            lastUsage = u;
          }
        }
      }

      const lastStep = steps.length > 0 ? steps[steps.length - 1] : null;
      const lastStepRunning = !!(
        lastStep &&
        (lastStep.status === 'CORTEX_STEP_STATUS_RUNNING' ||
          lastStep.status === 'CORTEX_STEP_STATUS_PENDING' ||
          lastStep.status === 'CORTEX_STEP_STATUS_GENERATING')
      );
      const streamingNow = lastStepRunning || isDomStreaming();
      hudState.isStreaming = streamingNow;

      // 一轮对话刚结束时，自动刷新一次模型配额
      if (prevStreamingFlag && !streamingNow) {
        syncModelQuotas(true);
      }
      prevStreamingFlag = streamingNow;

      let liveDelta = 0;
      const now = Date.now();
      if (streamingNow && lastStep) {
        const activeIdx = steps.length - 1;
        const pr = lastStep.plannerResponse || {};
        const stepStr = (pr.thinking || '') + (pr.response || '') + (pr.modifiedResponse || '');
        const charLen = stepStr.length;

        if (
          streamTracker.cascadeId !== cid ||
          streamTracker.activeStepIdx !== activeIdx ||
          charLen < streamTracker.lastChars
        ) {
          streamTracker.cascadeId = cid;
          streamTracker.activeStepIdx = activeIdx;
          streamTracker.startChars = charLen;
          streamTracker.startTime = now;
          streamTracker.lastChars = charLen;
          streamTracker.lastTime = now;
          streamTracker.deltaTokens = Math.round(charLen * 0.45);
          streamTracker.emaTps = 0;
        } else {
          const dt = (now - streamTracker.lastTime) / 1000;
          const dChars = charLen - streamTracker.lastChars;
          if (dt >= 0.35 && dChars > 0) {
            const instTokens = dChars * 0.45;
            const instTps = instTokens / dt;
            streamTracker.emaTps =
              streamTracker.emaTps > 0 ? streamTracker.emaTps * 0.55 + instTps * 0.45 : instTps;
            streamTracker.lastChars = charLen;
            streamTracker.lastTime = now;
            streamTracker.deltaTokens = Math.round(charLen * 0.45);
            if (streamTracker.emaTps > 0) {
              hudState.currentTps = parseFloat(streamTracker.emaTps.toFixed(1));
            }
          }
        }
        liveDelta = streamTracker.deltaTokens;
      } else {
        streamTracker.activeStepIdx = -1;
        streamTracker.deltaTokens = 0;
        streamTracker.emaTps = 0;
      }

      hudState.turns = turns;
      hudState.stepsCount = steps.length;
      hudState.modelTimeSec = modelTimeSec;
      hudState.toolTimeSec = toolTimeSec;
      hudState.avgTtftSec = ttftCount > 0 ? ttftSum / ttftCount : 0;
      hudState.avgTps = totalStreamSec > 0.05 ? parseFloat((totalStreamOut / totalStreamSec).toFixed(1)) : 0;

      if (!streamingNow || hudState.currentTps <= 0) {
        if (lastCompletedChat) {
          const durSec = parseProtoSec(lastCompletedChat.streamingDuration);
          const outTok = Number((lastCompletedChat.usage && lastCompletedChat.usage.outputTokens) || 0);
          const ttftSec = parseProtoSec(lastCompletedChat.timeToFirstToken);
          hudState.lastDurationSec = durSec;
          hudState.lastTtftSec = ttftSec;
          hudState.lastOutput = outTok;
          hudState.lastThinkingOutput = Number((lastCompletedChat.usage && lastCompletedChat.usage.thinkingOutputTokens) || 0);
          hudState.lastResponseOutput = Number((lastCompletedChat.usage && lastCompletedChat.usage.responseOutputTokens) || 0);
          // 若流式耗时太短（<0.25s），单纯 outTok / durSec 会受网络缓冲突发影响产生数千 tok/s 的数学失真
          if (durSec >= 0.25 && outTok > 0) {
            hudState.currentTps = parseFloat((outTok / durSec).toFixed(1));
          } else if (durSec > 0 && ttftSec > 0 && outTok > 0) {
            // 端到端综合平滑速率：outTok / (ttft + durSec)
            hudState.currentTps = parseFloat((outTok / (ttftSec + durSec)).toFixed(1));
          } else if (durSec > 0.05 && outTok > 0) {
            hudState.currentTps = parseFloat(Math.min(240, outTok / durSec).toFixed(1));
          } else {
            hudState.currentTps = 0;
          }
        } else {
          hudState.lastDurationSec = 0;
          hudState.lastTtftSec = 0;
          hudState.currentTps = 0;
        }
      }

      hudState.sumInput = sumIn;
      hudState.sumCacheRead = sumCache;
      hudState.sumOutput = sumOut;
      hudState.sumThinkingOutput = sumThink;
      hudState.sumTotalTokens = sumIn + sumCache + sumOut;
      const sumPromptTotal = sumIn + sumCache;
      hudState.avgCacheHitPct =
        sumPromptTotal > 0 ? parseFloat(((sumCache / sumPromptTotal) * 100).toFixed(1)) : 0;

      if (lastUsage) {
        const lIn = Number(lastUsage.inputTokens || 0);
        const lCache = Number(lastUsage.cacheReadTokens || 0);
        const lPrompt = lIn + lCache;
        hudState.lastInput = lIn;
        hudState.lastCacheRead = lCache;
        hudState.lastCacheHitPct = lPrompt > 0 ? parseFloat(((lCache / lPrompt) * 100).toFixed(1)) : 0;
        hudState.lastModelId = String(lastUsage.model || '');
      } else {
        hudState.lastInput = 0;
        hudState.lastCacheRead = 0;
        hudState.lastCacheHitPct = 0;
      }

      const cwm = lastGenChat && lastGenChat.chatStartMetadata && lastGenChat.chatStartMetadata.contextWindowMetadata;
      const maxCtx = Number((cwm && cwm.maxContextTokens) || 0) || getFallbackModelLimit();
      const tb = cwm && cwm.tokenBreakdown;
      const cwmTokens = Number((tb && tb.totalTokens) || (cwm && cwm.estimatedTokensUsed) || 0);
      const lastTurnTotal = lastUsage
        ? Number(lastUsage.inputTokens || 0) + Number(lastUsage.cacheReadTokens || 0) + Number(lastUsage.outputTokens || 0)
        : 0;
      const baseContext = Math.max(cwmTokens, lastTurnTotal);
      const effectiveContext = streamingNow ? baseContext + liveDelta : baseContext;

      hudState.maxContextTokens = maxCtx;
      hudState.contextTokens = effectiveContext;
      hudState.contextPct =
        maxCtx > 0 && effectiveContext > 0
          ? Math.max(1, Math.min(100, Math.round((effectiveContext / maxCtx) * 100)))
          : 0;

      if (tb && Array.isArray(tb.groups) && tb.groups.length > 0) {
        hudState.breakdownGroups = tb.groups.map((g) => {
          const meta = mapGroupMeta(g);
          const rawChildren = Array.isArray(g.children) ? g.children : [];
          const sortedChildren = rawChildren
            .map((ch) => ({ name: String(ch.name || ''), numTokens: Number(ch.numTokens || 0) }))
            .filter((ch) => ch.numTokens > 0)
            .sort((a, b) => b.numTokens - a.numTokens);
          return {
            key: meta.key,
            label: meta.label,
            color: meta.color,
            numTokens: Number(g.numTokens || 0),
            children: sortedChildren
          };
        });
      } else if (effectiveContext > 0) {
        hudState.breakdownGroups = [
          { key: 'chat', label: '当前上下文（无分类明细）', color: '#3b82f6', numTokens: effectiveContext, children: [] }
        ];
      } else {
        hudState.breakdownGroups = [];
      }

      resolveActiveQuotaGroup();
      hudState.hasServerData = true;
      renderAll();
    } catch (e) {
      // 静默容错
    } finally {
      isFetchingTraj = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 6. 注入极简双行底栏 + Popover CSS
  // ---------------------------------------------------------------------------
  const styleEl = document.createElement('style');
  styleEl.id = 'agy-hud-v2-styles';
  styleEl.textContent = `
    #agy-status-hud {
      display: none !important;
    }
    #agy-footer-hud {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      width: 100%;
      padding: 4px 8px 0 8px;
      margin-top: 2px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif;
      font-size: 12px;
      line-height: 18px;
      user-select: none;
      box-sizing: border-box;
    }

    .agy-footer-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    #agy-footer-hud.agy-theme-light {
      --agy-text: #64748b;
      --agy-text-strong: #0f172a;
      --agy-icon: #64748b;
      --agy-hover-bg: rgba(15, 23, 42, 0.055);
      --agy-active-bg: rgba(15, 23, 42, 0.085);
      --agy-track: rgba(15, 23, 42, 0.12);
      --agy-accent-speed: #0284c7;
      --agy-quota-ok: #16a34a;
      --agy-quota-warn: #d97706;
      --agy-quota-low: #dc2626;
    }

    #agy-footer-hud.agy-theme-dark {
      --agy-text: #94a3b8;
      --agy-text-strong: #f1f5f9;
      --agy-icon: #94a3b8;
      --agy-hover-bg: rgba(255, 255, 255, 0.07);
      --agy-active-bg: rgba(255, 255, 255, 0.12);
      --agy-track: rgba(255, 255, 255, 0.14);
      --agy-accent-speed: #38bdf8;
      --agy-quota-ok: #22c55e;
      --agy-quota-warn: #f59e0b;
      --agy-quota-low: #ef4444;
    }

    .agy-seg-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--agy-text);
      font-size: 12px;
      font-weight: 450;
      line-height: 18px;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background-color 0.14s ease, color 0.14s ease;
      font-variant-numeric: tabular-nums;
      outline: none;
    }
    .agy-seg-btn:hover {
      background: var(--agy-hover-bg);
      color: var(--agy-text-strong);
    }
    .agy-seg-btn.agy-active {
      background: var(--agy-active-bg);
      color: var(--agy-text-strong);
    }
    .agy-seg-btn svg {
      flex-shrink: 0;
      color: var(--agy-icon);
    }
    .agy-seg-btn.agy-streaming .agy-speed-icon {
      color: var(--agy-accent-speed);
      animation: agy-v2-pulse 1.1s ease-in-out infinite;
    }
    .agy-seg-btn.agy-streaming .agy-speed-val {
      color: var(--agy-accent-speed);
      font-weight: 600;
    }
    @keyframes agy-v2-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    @keyframes agy-v2-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .agy-dot-sep {
      opacity: 0.5;
      margin: 0 1px;
    }

    /* 第 2 行：模型配额双周期联动条 */
    .agy-quota-row {
      gap: 6px;
    }
    .agy-quota-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 2px 10px;
      border-radius: 999px;
      border: 1px solid var(--agy-track);
      background: transparent;
      color: var(--agy-text);
      font-size: 11.5px;
      line-height: 17px;
      cursor: pointer;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
      transition: background-color 0.14s ease, color 0.14s ease, border-color 0.14s ease;
      outline: none;
    }
    .agy-quota-pill:hover {
      background: var(--agy-hover-bg);
      color: var(--agy-text-strong);
    }
    .agy-quota-pill.agy-active {
      background: var(--agy-active-bg);
      color: var(--agy-text-strong);
    }
    .agy-quota-model-tag {
      display: inline-flex;
      align-items: center;
      padding: 0 7px;
      height: 17px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: var(--agy-accent-speed);
      background: rgba(2, 132, 199, 0.11);
      letter-spacing: -0.1px;
    }
    #agy-footer-hud.agy-theme-dark .agy-quota-model-tag {
      background: rgba(56, 189, 248, 0.15);
    }
    .agy-quota-slot {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .agy-quota-slot-label {
      color: var(--agy-text);
      font-weight: 500;
    }
    .agy-quota-slot-val {
      color: var(--agy-text-strong);
      font-weight: 600;
    }
    .agy-quota-slot-cd {
      color: var(--agy-text);
      font-weight: 400;
    }
    .agy-quota-bar-track {
      display: inline-block;
      width: 68px;
      height: 6px;
      border-radius: 999px;
      background: var(--agy-track);
      overflow: hidden;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .agy-quota-bar-fill {
      display: block;
      height: 100%;
      border-radius: 999px;
      transition: width 0.25s ease, background-color 0.2s ease;
    }
    .agy-quota-refresh-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      border-radius: 5px;
      background: transparent;
      color: var(--agy-icon);
      cursor: pointer;
      transition: background-color 0.14s ease, color 0.14s ease;
      outline: none;
    }
    .agy-quota-refresh-btn:hover {
      background: var(--agy-hover-bg);
      color: var(--agy-text-strong);
    }
    .agy-quota-refresh-btn.agy-spinning svg {
      animation: agy-v2-spin 0.8s linear infinite;
    }

    /* Popover 弹层（挂载在 body 顶层，避免 overflow 裁切） */
    #agy-hud-v2-popover {
      position: fixed;
      z-index: 99999;
      min-width: 276px;
      max-width: 360px;
      border-radius: 12px;
      padding: 14px 16px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif;
      font-size: 13px;
      line-height: 20px;
      font-variant-numeric: tabular-nums;
      opacity: 0;
      transform: translateY(4px);
      pointer-events: none;
      transition: opacity 0.14s ease, transform 0.14s ease;
    }
    #agy-hud-v2-popover.agy-open {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    #agy-hud-v2-popover.agy-theme-light {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid rgba(15, 23, 42, 0.09);
      box-shadow: 0 10px 30px -6px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(15, 23, 42, 0.06);
      --agy-muted: #64748b;
      --agy-strong: #0f172a;
      --agy-div: rgba(15, 23, 42, 0.08);
      --agy-track: rgba(15, 23, 42, 0.09);
      --agy-sub-bg: rgba(15, 23, 42, 0.035);
      --agy-row-hover: rgba(15, 23, 42, 0.04);
      --agy-warn: #d97706;
      --agy-cur-bg: rgba(2, 132, 199, 0.07);
      --agy-cur-border: rgba(2, 132, 199, 0.22);
      --agy-cur-tag: #0284c7;
    }
    #agy-hud-v2-popover.agy-theme-dark {
      background: #1e2028;
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.55);
      --agy-muted: #94a3b8;
      --agy-strong: #f1f5f9;
      --agy-div: rgba(255, 255, 255, 0.08);
      --agy-track: rgba(255, 255, 255, 0.12);
      --agy-sub-bg: rgba(255, 255, 255, 0.045);
      --agy-row-hover: rgba(255, 255, 255, 0.06);
      --agy-warn: #f59e0b;
      --agy-cur-bg: rgba(56, 189, 248, 0.1);
      --agy-cur-border: rgba(56, 189, 248, 0.25);
      --agy-cur-tag: #38bdf8;
    }

    .agy-pop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--agy-div);
    }
    .agy-pop-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--agy-strong);
    }
    .agy-pop-title-muted {
      color: var(--agy-muted);
      font-weight: 450;
    }
    .agy-pop-head-val {
      font-size: 13px;
      font-weight: 600;
      color: var(--agy-strong);
      white-space: nowrap;
    }

    .agy-pop-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .agy-pop-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-size: 13px;
    }
    .agy-pop-label {
      color: var(--agy-muted);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .agy-pop-val {
      color: var(--agy-strong);
      font-weight: 500;
      text-align: right;
      white-space: nowrap;
    }
    .agy-pop-val.agy-val-warn {
      color: var(--agy-warn);
      font-weight: 600;
    }
    .agy-pop-subnote {
      font-size: 11px;
      color: var(--agy-muted);
      margin-left: 4px;
      font-weight: 400;
    }

    /* 上下文堆叠进度条与二级树 */
    .agy-stack-bar {
      display: flex;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: var(--agy-track);
      overflow: hidden;
      gap: 2px;
      margin: 2px 0 12px 0;
    }
    .agy-stack-seg {
      height: 100%;
      border-radius: 999px;
      min-width: 3px;
      transition: width 0.2s ease;
    }

    .agy-group-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 6px;
      margin: 0 -6px;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.12s ease;
    }
    .agy-group-row:hover {
      background: var(--agy-row-hover);
    }
    .agy-group-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .agy-group-chevron {
      font-size: 10px;
      color: var(--agy-muted);
      transition: transform 0.14s ease;
      margin-left: 2px;
    }
    .agy-group-chevron.agy-expanded {
      transform: rotate(90deg);
    }

    .agy-children-box {
      margin: 2px 0 6px 14px;
      padding: 6px 8px;
      border-radius: 6px;
      background: var(--agy-sub-bg);
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 150px;
      overflow-y: auto;
    }
    .agy-child-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 11.5px;
      line-height: 16px;
    }
    .agy-child-name {
      color: var(--agy-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 195px;
    }
    .agy-child-val {
      color: var(--agy-strong);
      font-weight: 500;
      flex-shrink: 0;
    }

    /* 配额池总览卡片项 */
    .agy-pool-card {
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--agy-sub-bg);
      border: 1px solid transparent;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .agy-pool-card.agy-pool-current {
      background: var(--agy-cur-bg);
      border-color: var(--agy-cur-border);
    }
    .agy-pool-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .agy-pool-names {
      font-size: 12px;
      font-weight: 500;
      color: var(--agy-strong);
      line-height: 16px;
    }
    .agy-pool-cur-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      color: var(--agy-cur-tag);
      margin-left: 4px;
    }
    .agy-pool-pct {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--agy-strong);
      flex-shrink: 0;
    }
    .agy-pool-bar {
      width: 100%;
      height: 5px;
      border-radius: 999px;
      background: var(--agy-track);
      overflow: hidden;
    }
    .agy-pool-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--agy-muted);
    }
  `;
  function ensureStyleInjected() {
    if (document.getElementById('agy-hud-v2-styles')) return;
    const target = document.head || document.documentElement || document.body;
    if (target) target.appendChild(styleEl);
  }
  if (document.head || document.documentElement) {
    ensureStyleInjected();
  }

  // ---------------------------------------------------------------------------
  // 7. 图标与渲染逻辑
  // ---------------------------------------------------------------------------
  const ICONS = {
    gauge: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
    zap: `<svg class="agy-speed-icon" width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    db: `<svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>`,
    battery: `<svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>`,
    refresh: `<svg width="12.5" height="12.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><polyline points="21 3 21 8 16 8"/></svg>`
  };

  function getContextRingColor(pct, light) {
    if (pct >= 80) return light ? '#dc2626' : '#ef4444';
    if (pct >= 60) return light ? '#d97706' : '#f59e0b';
    return light ? '#64748b' : '#94a3b8';
  }

  function getQuotaBarColor(fraction, light) {
    const f = Number(fraction || 0);
    if (f <= 0.2) return light ? '#dc2626' : '#ef4444';
    if (f <= 0.5) return light ? '#d97706' : '#f59e0b';
    return light ? '#16a34a' : '#22c55e';
  }

  function renderRingSvg(pct, light) {
    const track = light ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.16)';
    const bar = getContextRingColor(pct, light);
    const dash = `${Math.max(0, Math.min(100, pct))}, 100`;
    return `<svg width="14" height="14" viewBox="0 0 36 36">
      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${track}" stroke-width="4" />
      <path class="agy-ring-bar" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${bar}" stroke-dasharray="${dash}" stroke-width="4" stroke-linecap="round" />
    </svg>`;
  }

  function ensureFooterBar() {
    const modelBtn = document.querySelector('button[data-testid="model-selector-trigger"]');
    if (!modelBtn) return null;

    let cardEl = null;
    let cursor = modelBtn;
    for (let i = 0; i < 12 && cursor; i++) {
      const cls = typeof cursor.className === 'string' ? cursor.className : '';
      const rect = cursor.getBoundingClientRect ? cursor.getBoundingClientRect() : { height: 0, width: 0 };
      if (cls.includes('bg-card-border') || (cls.includes('rounded-2xl') && rect.height >= 60)) {
        cardEl = cursor;
        break;
      }
      cursor = cursor.parentElement;
    }
    if (!cardEl) {
      cursor = modelBtn;
      for (let i = 0; i < 12 && cursor; i++) {
        const cls = typeof cursor.className === 'string' ? cursor.className : '';
        const rect = cursor.getBoundingClientRect ? cursor.getBoundingClientRect() : { height: 0, width: 0 };
        if (rect.height >= 60 && rect.height <= 420 && rect.width >= 240 && (cls.includes('rounded-') || cursor.querySelector('textarea, [contenteditable="true"]'))) {
          cardEl = cursor;
        }
        cursor = cursor.parentElement;
      }
    }
    if (!cardEl || !cardEl.parentElement) return null;

    let hud = document.getElementById('agy-footer-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'agy-footer-hud';
      hud.setAttribute('data-agy-i18n', '1');
      hud.innerHTML = `
        <div class="agy-footer-row agy-metrics-row">
          <button type="button" class="agy-seg-btn" data-seg="session"></button>
          <button type="button" class="agy-seg-btn" data-seg="speed"></button>
          <button type="button" class="agy-seg-btn" data-seg="tokens"></button>
          <button type="button" class="agy-seg-btn" data-seg="context"></button>
        </div>
        <div class="agy-footer-row agy-quota-row">
          <button type="button" class="agy-quota-pill" data-seg="quota"></button>
          <button type="button" class="agy-quota-refresh-btn" data-action="refresh-quota" title="刷新模型配额">${ICONS.refresh}</button>
        </div>
      `;
      hud.addEventListener('click', (e) => {
        const refreshBtn = e.target.closest('[data-action="refresh-quota"]');
        if (refreshBtn) {
          e.stopPropagation();
          syncModelQuotas(true);
          return;
        }
        const btn = e.target.closest('[data-seg]');
        if (!btn) return;
        e.stopPropagation();
        const seg = btn.getAttribute('data-seg');
        if (uiState.openPanel === seg) {
          closePopover();
        } else {
          uiState.openPanel = seg;
          if (seg === 'quota') {
            syncModelQuotas(true);
          } else {
            syncTrajectoryMetrics();
          }
          renderAll();
        }
      });
    }

    if (hud.previousElementSibling !== cardEl) {
      cardEl.insertAdjacentElement('afterend', hud);
    }

    return hud;
  }

  function ensurePopover() {
    let pop = document.getElementById('agy-hud-v2-popover');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'agy-hud-v2-popover';
      pop.setAttribute('data-agy-i18n', '1');
      pop.addEventListener('click', (e) => {
        e.stopPropagation();
        const groupRow = e.target.closest('.agy-group-row[data-group-key]');
        if (groupRow) {
          const gk = groupRow.getAttribute('data-group-key');
          uiState.expandedGroups[gk] = !uiState.expandedGroups[gk];
          renderPopover();
        }
      });
      document.body.appendChild(pop);
    }
    return pop;
  }

  function closePopover() {
    uiState.openPanel = null;
    const pop = document.getElementById('agy-hud-v2-popover');
    if (pop) pop.classList.remove('agy-open');
    const hud = document.getElementById('agy-footer-hud');
    if (hud) {
      hud.querySelectorAll('.agy-active').forEach((b) => b.classList.remove('agy-active'));
    }
  }

  function renderFooterSegments() {
    const hud = ensureFooterBar();
    if (!hud) return;

    const light = isLightTheme();
    hud.classList.toggle('agy-theme-light', light);
    hud.classList.toggle('agy-theme-dark', !light);

    const segSession = hud.querySelector('[data-seg="session"]');
    const segSpeed = hud.querySelector('[data-seg="speed"]');
    const segTokens = hud.querySelector('[data-seg="tokens"]');
    const segContext = hud.querySelector('[data-seg="context"]');
    const segQuota = hud.querySelector('[data-seg="quota"]');
    const refreshBtn = hud.querySelector('[data-action="refresh-quota"]');

    // 第 1 行：四段式遥测
    segSession.classList.toggle('agy-active', uiState.openPanel === 'session');
    segSession.innerHTML = `${ICONS.gauge}<span>${hudState.turns} 轮 ${hudState.stepsCount} 步</span>`;

    const tpsVal = hudState.currentTps > 0 ? hudState.currentTps.toFixed(1) : '0.0';
    segSpeed.classList.toggle('agy-active', uiState.openPanel === 'speed');
    segSpeed.classList.toggle('agy-streaming', hudState.isStreaming);
    segSpeed.innerHTML = `${ICONS.zap}<span class="agy-speed-val">${tpsVal}</span><span>tok/s</span>`;

    const totalCompact = formatCompactTokens(hudState.sumTotalTokens);
    const hitPctStr = formatPercentInt(hudState.avgCacheHitPct);
    segTokens.classList.toggle('agy-active', uiState.openPanel === 'tokens');
    segTokens.innerHTML = `${ICONS.db}<span>${totalCompact} tok</span><span class="agy-dot-sep">·</span><span>缓存命中 ${hitPctStr}</span>`;

    segContext.classList.toggle('agy-active', uiState.openPanel === 'context');
    segContext.innerHTML = `${renderRingSvg(hudState.contextPct, light)}<span>${hudState.contextPct}%</span>`;

    // 第 2 行：当前模型配额实时同步条
    segQuota.classList.toggle('agy-active', uiState.openPanel === 'quota');
    if (refreshBtn) {
      refreshBtn.classList.toggle('agy-spinning', hudState.isRefreshingQuota);
    }

    const grp = hudState.activeQuotaGroup;
    const activeBuckets = (grp && Array.isArray(grp.buckets) && grp.buckets.length > 0)
      ? grp.buckets
      : (grp ? [grp.bucket5h, grp.bucketWeekly].filter(Boolean) : []);
    if (grp && activeBuckets.length > 0) {
      const renderSlotHtml = (slotLabel, bucket) => {
        if (!bucket) return '';
        const f = bucket.remainingFraction !== undefined && bucket.remainingFraction !== null
          ? Number(bucket.remainingFraction)
          : 0;
        const pctStr = formatQuotaPct(f);
        const fillWidth = Math.max(0, Math.min(100, f * 100));
        const barColor = getQuotaBarColor(f, light);
        const rInfo = formatResetInfo(bucket.resetTime);
        const tip = [grp.labelZh, bucket.displayName || slotLabel, rInfo.full || rInfo.clock].filter(Boolean).join(' · ');
        // 满额 100% 时仅在存在倒计时且小于阈值时附带括号，保持紧凑干净
        const showCd = rInfo.countdown && f < 0.9995;
        return `
          <span class="agy-quota-slot" title="${escapeHtml(tip)}">
            <span class="agy-quota-slot-label">${escapeHtml(slotLabel)}</span>
            <span class="agy-quota-bar-track"><span class="agy-quota-bar-fill" style="width:${fillWidth.toFixed(1)}%;background:${barColor};"></span></span>
            <span class="agy-quota-slot-val">${pctStr}</span>
            ${showCd ? `<span class="agy-quota-slot-cd">(${rInfo.countdown})</span>` : ''}
          </span>
        `;
      };

      const modelShort = hudState.activeModelShort || grp.labelZh;
      const slotsHtml = activeBuckets
        .slice(0, 3)
        .map((b) => renderSlotHtml(b.shortLabel || formatBucketShortLabel(b), b))
        .join('');

      segQuota.title = `${grp.labelZh}（点击查看全部模型配额总览）`;
      segQuota.innerHTML = `
        <span class="agy-quota-model-tag">${escapeHtml(modelShort)}</span>
        ${slotsHtml}
      `;
    } else if (hudState.quotaGroups.length > 0) {
      const fallbackName = hudState.activeModelShort || hudState.selectedModelRawText || '当前模型';
      segQuota.title = '点击查看全部模型配额';
      segQuota.innerHTML = `
        <span class="agy-quota-model-tag">${escapeHtml(fallbackName)}</span>
        <span>暂无独立配额信息 · 点击查看总览</span>
      `;
    } else {
      segQuota.title = '正在同步模型配额';
      segQuota.innerHTML = `<span>正在同步模型配额...</span>`;
    }
  }

  function buildPopoverHtml(panel) {
    const light = isLightTheme();

    if (panel === 'session') {
      return `
        <div class="agy-pop-header">
          <div class="agy-pop-title">${ICONS.gauge}<span>会话统计</span></div>
          <div class="agy-pop-head-val">${hudState.turns} 轮 ${hudState.stepsCount} 步</div>
        </div>
        <div class="agy-pop-rows">
          <div class="agy-pop-row">
            <span class="agy-pop-label">模型用时</span>
            <span class="agy-pop-val">${formatDurationZh(hudState.modelTimeSec)}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">工具调用用时</span>
            <span class="agy-pop-val">${formatDurationZh(hudState.toolTimeSec)}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">首 token 平均（TTFT）</span>
            <span class="agy-pop-val">${hudState.avgTtftSec > 0 ? hudState.avgTtftSec.toFixed(1) + '秒' : '--'}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">会话平均速度（TPS）</span>
            <span class="agy-pop-val">${hudState.avgTps > 0 ? hudState.avgTps.toFixed(1) + ' tok/s' : '--'}</span>
          </div>
        </div>
      `;
    }

    if (panel === 'speed') {
      const isActuallyStreaming = hudState.isStreaming && streamTracker.activeStepIdx !== -1 && hudState.currentTps > 0;
      const statusBadge = isActuallyStreaming
        ? '<span class="agy-pop-subnote">实时生成中</span>'
        : (hudState.isStreaming ? '<span class="agy-pop-subnote">工具/步骤执行中</span>' : '');
      const e2eTps = (hudState.lastDurationSec > 0 && hudState.lastTtftSec > 0 && hudState.lastOutput > 0)
        ? (hudState.lastOutput / (hudState.lastDurationSec + hudState.lastTtftSec)).toFixed(1)
        : null;
      return `
        <div class="agy-pop-header">
          <div class="agy-pop-title">${ICONS.zap}<span>生成速率${statusBadge}</span></div>
          <div class="agy-pop-head-val">${hudState.currentTps > 0 ? hudState.currentTps.toFixed(1) : '0.0'} tok/s</div>
        </div>
        <div class="agy-pop-rows">
          <div class="agy-pop-row">
            <span class="agy-pop-label">会话平均速率（TPS）</span>
            <span class="agy-pop-val">${hudState.avgTps > 0 ? hudState.avgTps.toFixed(1) + ' tok/s' : '--'}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">最近一轮输出</span>
            <span class="agy-pop-val">${formatExactTokens(hudState.lastOutput)} tok</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">最近一轮流式耗时</span>
            <span class="agy-pop-val">${hudState.lastDurationSec > 0 ? hudState.lastDurationSec.toFixed(2) + '秒' : '--'}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">最近一轮首字（TTFT）</span>
            <span class="agy-pop-val">${hudState.lastTtftSec > 0 ? hudState.lastTtftSec.toFixed(2) + '秒' : '--'}</span>
          </div>
          ${e2eTps ? `
          <div class="agy-pop-row" style="border-top:1px dashed var(--agy-track);padding-top:4px;margin-top:2px;">
            <span class="agy-pop-label" title="含首字等待的端到端真实速率: 输出 / (TTFT + 流式耗时)">端到端综合速率</span>
            <span class="agy-pop-val">${e2eTps} tok/s</span>
          </div>` : ''}
        </div>
      `;
    }

    if (panel === 'tokens') {
      const cacheDropWarn = hudState.avgCacheHitPct >= 60 && hudState.lastCacheHitPct > 0 && hudState.lastCacheHitPct < 50;
      const thinkSub =
        hudState.sumThinkingOutput > 0
          ? `<span class="agy-pop-subnote">(含思考 ${formatCompactTokens(hudState.sumThinkingOutput)})</span>`
          : '';
      return `
        <div class="agy-pop-header">
          <div class="agy-pop-title">${ICONS.db}<span>Token 用量</span></div>
          <div class="agy-pop-head-val">${formatExactTokens(hudState.sumTotalTokens)} tok</div>
        </div>
        <div class="agy-pop-rows">
          <div class="agy-pop-row">
            <span class="agy-pop-label">缓存命中（累计）</span>
            <span class="agy-pop-val">${formatPercentInt(hudState.avgCacheHitPct)}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">最近一轮命中</span>
            <span class="agy-pop-val ${cacheDropWarn ? 'agy-val-warn' : ''}">${hudState.lastCacheHitPct.toFixed(1)}%${cacheDropWarn ? ' ⚠' : ''}</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">未缓存输入</span>
            <span class="agy-pop-val">${formatExactTokens(hudState.sumInput)} tok</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">缓存读取</span>
            <span class="agy-pop-val">${formatExactTokens(hudState.sumCacheRead)} tok</span>
          </div>
          <div class="agy-pop-row">
            <span class="agy-pop-label">输出</span>
            <span class="agy-pop-val">${formatExactTokens(hudState.sumOutput)} tok${thinkSub}</span>
          </div>
        </div>
      `;
    }

    if (panel === 'context') {
      const maxCtx = Math.max(1, hudState.maxContextTokens || 1000000);
      const stackSegs = hudState.breakdownGroups
        .filter((g) => g.numTokens > 0)
        .map((g) => {
          const pct = Math.min(100, (g.numTokens / maxCtx) * 100);
          return `<div class="agy-stack-seg" style="width:${pct.toFixed(2)}%;background:${g.color};"></div>`;
        })
        .join('');

      const groupRows = hudState.breakdownGroups
        .map((g) => {
          const hasKids = g.children && g.children.length > 0;
          const isExp = !!uiState.expandedGroups[g.key];
          const chevron = hasKids
            ? `<span class="agy-group-chevron ${isExp ? 'agy-expanded' : ''}">▶</span>`
            : '';
          let kidsHtml = '';
          if (hasKids && isExp) {
            const topKids = g.children.slice(0, 12);
            const moreCount = g.children.length - topKids.length;
            kidsHtml = `
              <div class="agy-children-box">
                ${topKids
                  .map(
                    (c) => `
                  <div class="agy-child-row">
                    <span class="agy-child-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
                    <span class="agy-child-val">~${formatCompactTokens(c.numTokens)}</span>
                  </div>
                `
                  )
                  .join('')}
                ${moreCount > 0 ? `<div class="agy-child-row"><span class="agy-child-name">其余 ${moreCount} 项...</span><span class="agy-child-val"></span></div>` : ''}
              </div>
            `;
          }
          return `
            <div class="agy-group-row" data-group-key="${escapeHtml(g.key)}">
              <span class="agy-pop-label">
                <span class="agy-group-dot" style="background:${g.color};"></span>
                <span>${escapeHtml(g.label)}</span>
                ${chevron}
              </span>
              <span class="agy-pop-val">~${formatCompactTokens(g.numTokens)}</span>
            </div>
            ${kidsHtml}
          `;
        })
        .join('');

      return `
        <div class="agy-pop-header" style="border-bottom:none;padding-bottom:6px;margin-bottom:2px;">
          <div class="agy-pop-title">
            <span class="agy-pop-title-muted">上下文已用</span>
            <span style="font-weight:600;">${hudState.contextPct}%</span>
          </div>
          <div class="agy-pop-head-val">~${formatCompactTokens(hudState.contextTokens)} / ${formatCapTokens(maxCtx)}</div>
        </div>
        <div class="agy-stack-bar">${stackSegs}</div>
        <div class="agy-pop-rows" style="gap:4px;">
          ${groupRows || '<div class="agy-pop-row"><span class="agy-pop-label">暂无上下文数据</span><span class="agy-pop-val">--</span></div>'}
        </div>
      `;
    }

    if (panel === 'quota') {
      const groups = hudState.quotaGroups || [];
      const renderBucketLine = (label, bucket) => {
        if (!bucket) return '';
        const f = bucket.remainingFraction !== undefined && bucket.remainingFraction !== null
          ? Number(bucket.remainingFraction)
          : 0;
        const pctStr = formatQuotaPct(f);
        const fillW = Math.max(0, Math.min(100, f * 100));
        const color = getQuotaBarColor(f, light);
        const rInfo = formatResetInfo(bucket.resetTime);
        const resetText = f < 0.9995 && rInfo.countdown ? `${rInfo.clock} (${rInfo.countdown})` : '满额';
        return `
          <div style="display:flex;flex-direction:column;gap:3px;margin-top:4px;">
            <div class="agy-pool-meta" style="color:var(--agy-strong);font-size:11.5px;">
              <span>${escapeHtml(label)}</span>
              <span style="font-weight:600;">${pctStr}</span>
            </div>
            <div class="agy-pool-bar">
              <div class="agy-quota-bar-fill" style="width:${fillW.toFixed(1)}%;background:${color};"></div>
            </div>
            <div class="agy-pool-meta">
              <span></span>
              <span title="${escapeHtml(rInfo.full)}">${escapeHtml(resetText)}</span>
            </div>
          </div>
        `;
      };

      const cardsHtml = groups
        .map((g) => {
          const modelsHint = g.models && g.models.length > 0 && g.models[0] !== g.displayName
            ? `<div style="font-size:10.5px;color:var(--agy-muted);margin-top:-2px;">${escapeHtml(g.models.join(' · '))}</div>`
            : '';
          const gBuckets = Array.isArray(g.buckets) && g.buckets.length > 0
            ? g.buckets
            : [g.bucket5h, g.bucketWeekly].filter(Boolean);
          const bucketsHtml = gBuckets
            .map((b) => renderBucketLine(b.longLabel || formatBucketLongLabel(b), b))
            .join('');
          return `
            <div class="agy-pool-card ${g.isCurrent ? 'agy-pool-current' : ''}">
              <div class="agy-pool-top">
                <span class="agy-pool-names">${escapeHtml(g.labelZh)}${g.isCurrent ? '<span class="agy-pool-cur-badge">当前</span>' : ''}</span>
              </div>
              ${modelsHint}
              ${bucketsHtml}
            </div>
          `;
        })
        .join('');

      return `
        <div class="agy-pop-header">
          <div class="agy-pop-title">${ICONS.battery}<span>模型配额总览</span></div>
          <div class="agy-pop-head-val">${groups.length} 个配额组</div>
        </div>
        <div class="agy-pop-rows" style="gap:7px;">
          ${cardsHtml || '<div class="agy-pop-row"><span class="agy-pop-label">暂无配额数据</span><span class="agy-pop-val">--</span></div>'}
        </div>
      `;
    }

    return '';
  }

  function positionPopover(pop, segName) {
    const hud = document.getElementById('agy-footer-hud');
    if (!hud) return;
    const trigger = hud.querySelector(`[data-seg="${segName}"]`);
    if (!trigger) return;

    const r = trigger.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    const vw = window.innerWidth;

    let left = r.left + r.width / 2 - popRect.width / 2;
    left = Math.max(12, Math.min(vw - popRect.width - 12, left));
    const bottom = Math.max(12, window.innerHeight - r.top + 8);

    pop.style.left = `${Math.round(left)}px`;
    pop.style.bottom = `${Math.round(bottom)}px`;
    pop.style.top = 'auto';
  }

  function renderPopover() {
    const pop = ensurePopover();
    const light = isLightTheme();
    pop.classList.toggle('agy-theme-light', light);
    pop.classList.toggle('agy-theme-dark', !light);

    if (!uiState.openPanel) {
      pop.classList.remove('agy-open');
      return;
    }

    pop.innerHTML = buildPopoverHtml(uiState.openPanel);
    pop.classList.add('agy-open');
    positionPopover(pop, uiState.openPanel);
  }

  function renderAll() {
    renderFooterSegments();
    if (uiState.openPanel) {
      renderPopover();
    }
  }

  // ---------------------------------------------------------------------------
  // 8. 全局交互关闭监听 & 模型切换 0 延迟感知 & 周期同步
  // ---------------------------------------------------------------------------
  const onDocClick = () => {
    if (uiState.openPanel) closePopover();
  };
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && uiState.openPanel) closePopover();
  };
  const onResize = () => {
    if (uiState.openPanel) {
      const pop = document.getElementById('agy-hud-v2-popover');
      if (pop) positionPopover(pop, uiState.openPanel);
    }
  };

  function startHudLoop() {
    if (!document.body) {
      setTimeout(startHudLoop, 80);
      return;
    }
    ensureStyleInjected();

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    // MutationObserver：同时监听底栏节点存活与模型选择器切换（0 延迟同步配额显示）
    mountObserver = new MutationObserver(() => {
      if (!document.getElementById('agy-footer-hud')) {
        renderFooterSegments();
      }
      const currentModelText = getSelectedModelButtonText();
      if (currentModelText && currentModelText !== hudState.selectedModelRawText) {
        hudState.selectedModelRawText = currentModelText;
        resolveActiveQuotaGroup();
        renderAll();
      }
    });
    mountObserver.observe(document.body, { childList: true, subtree: true, characterData: true });

    window.__antigravity_hud_cleanup = () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      if (mountObserver) mountObserver.disconnect();
    };

    renderAll();
    syncTrajectoryMetrics();
    syncModelQuotas(true);

    let fastTickCount = 0;
    const tSync = setInterval(() => {
      fastTickCount++;
      const cid = getActiveCascadeId();
      if (cid !== hudState.cascadeId || hudState.isStreaming || isDomStreaming() || fastTickCount % 4 === 0) {
        syncTrajectoryMetrics();
      }
      // 若尚未拿到配额数据（如启动时 /auth 尚未写入 localStorage），每 2 秒快速重试；拿到后每 60 秒自动刷新
      if (hudState.quotaGroups.length === 0 && fastTickCount % 4 === 0) {
        syncModelQuotas(true);
      } else if (fastTickCount % 120 === 0) {
        syncModelQuotas(true);
      } else if (fastTickCount % 60 === 0) {
        // 每 30 秒本地重算一次倒计时分钟数
        renderFooterSegments();
      }
      if (!document.getElementById('agy-footer-hud')) {
        renderFooterSegments();
      }
    }, 500);

    window.__antigravity_hud_timers.push(tSync);
    console.log('[Antigravity-HUD V2.1] 四段式底栏 + 模型配额联动同步条已装载');
  }

  if (document.readyState === 'loading' && !document.body) {
    document.addEventListener('DOMContentLoaded', startHudLoop, { once: true });
  } else {
    startHudLoop();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initAntigravityDashboard };
}
