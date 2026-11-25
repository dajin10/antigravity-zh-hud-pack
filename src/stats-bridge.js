/**
 * 原生对话日志统计桥接 (__agy_stats_bridge__)
 * 通过 contextBridge 暴露只读的本地 transcript.jsonl 统计接口
 */
function initStatsBridge(electronInstance, nodeFs, nodePath, nodeOs) {
  try {
    if (electronInstance && electronInstance.contextBridge && nodeFs && nodePath && nodeOs) {
      electronInstance.contextBridge.exposeInMainWorld('__agy_stats_bridge__', {
        getStats: (cascadeId) => {
          try {
            if (!cascadeId) return null;
            const logFile = nodePath.join(nodeOs.homedir(), '.gemini', 'antigravity', 'brain', cascadeId, '.system_generated', 'logs', 'transcript.jsonl');
            if (!nodeFs.existsSync(logFile)) return null;
            const raw = nodeFs.readFileSync(logFile, 'utf8');
            const lines = raw.trim().split('\n').filter(Boolean);
            let cjk = 0, nonCjk = 0;
            for (let i = 0; i < lines.length; i++) {
              try {
                const obj = JSON.parse(lines[i]);
                let s = (obj.content || '') + (obj.thinking || '');
                if (obj.tool_calls) s += JSON.stringify(obj.tool_calls);
                for (let j = 0; j < s.length; j++) {
                  const code = s.charCodeAt(j);
                  if (code >= 0x4e00 && code <= 0x9fa5) cjk++;
                  else nonCjk++;
                }
              } catch(e) {}
            }
            return { totalTokens: Math.round(cjk * 0.7 + nonCjk * 0.28), steps: lines.length };
          } catch(e) {
            return null;
          }
        }
      });
    }
  } catch (e) {
    console.warn('[Antigravity-Bridge] Bridge 注册异常:', e && e.message);
  }
}
