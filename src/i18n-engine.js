/**
 * Antigravity 界面全量简体中文本地化与效率增强核心引擎 (Loop-safe, Reversible)
 * 版本: v2.2.0
 * 
 * 核心升级与迭代特性:
 * 1. 深度汉化模型用量与配额: 支持 5 小时限额、每周限额的动态时间倒计时解析（天/小时/分/秒多级智能换算），全面覆盖 AI 积分与账单；
 * 2. 完善项目全生命周期管理: 新建项目、复制/打开/删除项目、对话移入/移出项目及重名检测；
 * 3. 增强对话置顶与归档系统: Pin/Unpin 置顶、Archive/Restore 归档与取消归档、删除确认弹窗；
 * 4. 模型管理与上下文优化: 自定义模型配置、Claude/GPT/Gemini 标签、上下文窗口压缩缩容提示；
 * 5. 防死循环与性能保护: 维持严格的 loop-safe MutationObserver，杜绝内存与 GPU 占用泄漏；
 * 6. 代码区与终端严苛防误翻: 保护用户输入、代码高亮区域与终端不被误翻；
 * 7. 全局文件拖拽与路径自动注入: 突破原生仅支持媒体/Excel的限制，支持 .txt、代码文件及各类文档拖入秒级提取并填入绝对路径。
 */
const fs = (typeof require !== 'undefined') ? (() => { try { return require('fs'); } catch(e) { return null; } })() : null;
const path = (typeof require !== 'undefined') ? (() => { try { return require('path'); } catch(e) { return null; } })() : null;
const cp = (typeof require !== 'undefined') ? (() => { try { return require('child_process'); } catch(e) { return null; } })() : null;

const DICTIONARY = {
  "Settings": "设置",
  "General": "常规设置",
  "Models": "模型",
  "Editor": "代码编辑器",
  "Appearance": "外观偏好",
  "Account": "账号与协作",
  "Developer": "开发者选项",
  "Feedback": "反馈与建议",
  "Notifications": "通知",
  "Plugins": "插件",
  "Skills": "技能",
  "Rules": "规则",
  "Hooks": "钩子",
  "Commands": "命令",
  "Agents": "智能体",
  "Automations": "自动化",
  "Marketplace": "插件市场",
  "Installed": "已安装",
  "Setup": "设置向导",
  "Local": "本地",
  "Global": "全局",
  "Workspace": "工作区",
  "Application": "应用程序",
  "Email": "邮箱",
  "Plan": "套餐",
  "Usage": "用量",
  "Quota": "配额",
  "Advanced": "高级",
  "Execution": "执行策略",
  "Suggestions": "智能补全",
  "Navigation": "导航",
  "Context": "上下文",
  "Conversation": "对话",
  "Conversations": "对话",
  "Files": "文件",
  "Search": "搜索",
  "Filter": "筛选",
  "Refresh": "刷新",
  "Cancel": "取消",
  "Save": "保存",
  "Delete": "删除",
  "Edit": "编辑",
  "Copy": "复制",
  "Close": "关闭",
  "Stop": "停止",
  "Start": "开始",
  "Pause": "暂停",
  "Resume": "恢复",
  "Retry": "重试",
  "Apply": "应用",
  "Reset": "重置",
  "Confirm": "确认",
  "Yes": "是",
  "No": "否",
  "OK": "确定",
  "Error": "错误",
  "Warning": "警告",
  "Info": "信息",
  "Success": "成功",
  "Loading": "加载中",
  "Enable": "启用",
  "Disable": "禁用",
  "Enabled": "已启用",
  "Disabled": "已禁用",
  "On": "开",
  "Off": "关",
  "None": "无",
  "Auto": "自动",
  "Manual": "手动",
  "Custom": "自定义",
  "Default": "默认",
  "Advanced Settings": "高级与实验性设置",
  "More options": "更多选项",
  "More actions": "更多操作",
  "Learn more": "了解详情",
  "Show more": "显示更多",
  "Show less": "收起",
  "Expand": "展开",
  "Collapse": "折叠",
  "Open": "打开",
  "Back": "返回",
  "Next": "下一个",
  "Previous": "上一个",
  "Continue": "继续",
  "Finish": "完成",
  "Skip": "跳过",
  "Help": "帮助",
  "About": "关于",
  "Version": "版本",
  "Name": "名称",
  "Description": "描述",
  "Path": "路径",
  "URL": "URL",
  "Port": "端口",
  "Host": "主机",
  "Timeout": "超时",
  "Retries": "重试次数",
  "Log level": "日志级别",
  "Theme": "主题",
  "Language": "语言",
  "Font size": "字号",
  "Density": "密度",
  "Sidebar": "侧边栏",
  "Panel": "面板",
  "Tabs": "标签页",
  "Terminal": "终端",
  "Browser": "浏览器自动化",
  "Project": "项目",
  "Projects": "项目列表",
  "Task": "任务",
  "Tasks": "任务",
  "Subagent": "子智能体",
  "Subagents": "子智能体",
  "Artifact": "制品",
  "Artifacts": "制品",
  "Upload": "上传",
  "Uploads": "上传",
  "Download": "下载",
  "Export": "导出",
  "Import": "导入",
  "Sync": "同步",
  "Logout": "退出登录",
  "Login": "登录",
  "Sign in": "登录",
  "Sign out": "退出登录",
  "Profile": "个人资料",
  "Preferences": "偏好设置",
  "Privacy": "隐私",
  "Security": "安全",
  "Permissions": "权限",
  "Tools": "工具",
  "Extensions": "扩展",
  "Updates": "更新",
  "Report a bug": "报告缺陷",
  "Feature request": "功能建议",
  "Documentation": "文档",
  "Community": "社区",
  "Support": "支持",
  "License": "许可协议",
  "Source": "源码",
  "Credits": "积分",
  "Billing": "计费",
  "Subscription": "订阅",
  "Free plan": "免费套餐",
  "Pro plan": "专业套餐",
  "Ultra plan": "Ultra 套餐",
  "Workspace File Access": "工作区文件访问",
  "Read Files": "读取文件",
  "Write Files": "写入文件",
  "Workspace Command Access": "工作区命令权限",
  "Terminal Commands": "终端命令",
  "MCP Tools": "MCP 工具",
  "Workspace Web Access": "工作区网络访问",
  "Read URLs": "读取 URL",
  "Write URLs": "写入 URL",
  "File Reads": "文件读取",
  "File Writes": "文件写入",
  "File Access Rules": "文件访问规则",
  "Network Access Rules": "网络访问规则",
  "Tool Permissions": "工具权限",
  "Security Preset": "安全预设",
  "Permission Preset": "权限预设",
  "Agent Behavior": "智能体行为",
  "Artifact Review Policy": "制品审核策略",
  "Always Ask": "总是询问",
  "Always Proceed": "总是自动执行",
  "Request Review": "请求审核",
  "Vetted (Preview)": "审核模式（预览）",
  "Turbo": "Turbo",
  "Every terminal command requires approval.": "每条终端命令都需要批准。",
  "Ask for permission for sensitive operations.": "敏感操作前请求授权。",
  "A Gemini-powered security agent decides if commands should be auto-approved.": "由 Gemini 安全智能体判断命令是否可自动批准。",
  "Allow the agent to run without restrictions.": "允许智能体无限制运行。",
  "Show suggestions when typing in the editor": "在编辑器输入时显示建议",
  "Predict the location of your next edit and navigate you there with a tab keypress.": "预测下一个编辑位置，按 Tab 一键跳转。",
  "Quickly add and update imports with a tab keypress.": "按 Tab 快速添加或更新 import。",
  "Set the speed of tab suggestions": "设置 Tab 建议速度",
  "Highlight newly inserted text after accepting a Tab completion.": "接受 Tab 补全后高亮新插入文本。",
  "Port number for Chrome DevTools Protocol remote debugging. Leave empty for default (9222).": "Chrome DevTools 远程调试端口。留空则默认 9222。",
  "Include default customizations, such as default skills.": "包含默认定制，例如默认技能。",
  "A nickname for identifying this application in the companion website. Changing this will restart the connection.": "在配套网站中标识本应用的昵称。修改后将重启连接。",
  "VCS used when creating a new CitC workspace, including workspaces generated based off your initial prompt.": "新建 CitC 工作区时使用的 VCS（含根据初始提示生成的工作区）。",
  "Paths the agent can read inside this workspace.": "智能体在本工作区内可读取的路径。",
  "Paths the agent can modify inside this workspace.": "智能体在本工作区内可修改的路径。",
  "Terminal commands the agent can execute in this workspace.": "智能体在本工作区内可执行的终端命令。",
  "Commands the agent can run outside the sandbox in this workspace.": "智能体在本工作区沙箱外可运行的命令。",
  "External tools the agent can call via Model Context Protocol.": "智能体可通过 MCP 调用的外部工具。",
  "URLs the agent can read or open in this workspace.": "智能体在本工作区内可读取或打开的 URL。",
  "URLs the agent can actuate on in this workspace.": "智能体在本工作区内可操作的 URL。",
  "Configure allowed and denied paths for file reads and writes.": "配置允许/禁止的文件读写路径。",
  "Configure allowed terminal commands.": "配置允许的终端命令。",
  "Outside of folders file access policy": "工作文件夹外的文件访问策略",
  "Configures how the agent tries to access files outside of its working folders.": "配置智能体访问工作文件夹之外文件的方式。",
  "Controls whether terminal commands require your approval before running.": "控制终端命令运行前是否需要你批准。",
  "Enable Sandbox Mode (Preview)": "启用沙箱模式（预览）",
  "Restricts agent tools to a secure, isolated local sandbox.": "将智能体工具限制在安全隔离的本地沙箱中。",
  "When enabled, sandboxed commands are allowed to make network requests.": "开启后，沙箱内命令允许发起网络请求。",
  "When enabled, Agent will use IDE's shell integration to detect and report terminal command execution.": "开启后，智能体将使用 IDE Shell 集成检测并上报终端命令执行。",
  "Allows the agent to access files outside of your current workspace.": "允许智能体访问当前工作区之外的文件。",
  "Open files in the background if Agent creates or edits them": "智能体创建或编辑文件时在后台打开",
  "When enabled, the agent will be able to access past conversations to inform its responses.": "开启后，智能体可访问历史对话以辅助回复。",
  "When enabled, 'Explain and Fix' actions will continue in the current conversation instead of starting a new one.": "开启后，「解释并修复」将在当前对话继续，而不是新开对话。",
  "Open Agent panel on window reload": "窗口重载时打开智能体面板",
  "When enabled, Antigravity will play a sound when Agent finishes generating a response.": "开启后，智能体完成回复时播放提示音。",
  "When enabled, the Changes Overview toolbar will automatically expand when Agent finishes generating a response.": "开启后，智能体完成回复时自动展开变更总览。",
  "Paths the agent can read.": "智能体可读取的路径。",
  "Paths the agent can modify.": "智能体可修改的路径。",
  "Terminal commands the agent can execute.": "智能体可执行的终端命令。",
  "Commands the agent can run outside the sandbox.": "智能体可在沙箱外运行的命令。",
  "URLs the agent can read or open in the browser.": "智能体可在浏览器中读取或打开的 URL。",
  "URLs the agent can actuate on using the browser.": "智能体可通过浏览器操作的 URL。",
  "Give the agent awareness of lint errors created by its edits so it can fix them without explicit prompting.": "让智能体感知其编辑产生的 lint 错误，并可自动修复。",
  "A shell setup script run before every command the agent executes.": "智能体每次执行命令前运行的 Shell 初始化脚本。",
  "The agent auto-executes commands matched by an allow list entry.": "命中允许名单的命令将自动执行。",
  "The agent asks for permission before executing commands matched by a deny list entry.": "命中拒绝名单的命令执行前需请求授权。",
  "Play a sound when the agent finishes generating a response.": "智能体完成回复时播放声音。",
  "Show browser notifications when your action is needed or execution finishes.": "需要你操作或执行完成时显示浏览器通知。",
  "Automatically expand the Changes Overview toolbar when the agent finishes generating a response.": "智能体完成回复后自动展开变更总览。",
  "Let the agent access past conversations to inform its responses.": "允许智能体访问历史对话以辅助回复。",
  "Agent always asks for review.": "智能体始终请求审阅。",
  "Manage your notification preferences.": "管理你的通知偏好。",
  "Open File Search": "打开全局文件搜索",
  "Provide Feedback": "提交反馈",
  "Send feedback as ": "反馈发送账号：",
  "Open System Preferences": "打开系统偏好设置",
  "Go to General settings": "前往常规设置",
  "Open Editor Settings": "打开编辑器设置",
  "Open MCP Config": "打开 MCP 配置",
  "Not in Project": "不在项目中",
  "Best of N": "Best of N",
  "Labs": "实验室",
  "Jetski Chat": "Jetski 聊天",
  "CitC Settings": "CitC 工作区设置",
  "Models & Usage": "模型与配额用量",
  "Google AI Pro": "Google AI Pro",
  "Walkthrough of Antigravity Chinese localization plugin implementation and verification results.": "Antigravity 中文本地化插件实现与验证结果说明。",
  "Comprehensive guide and reference for the Antigravity Customization System. Use to explain how customizations work, their loading priority, discovery mechanisms, and to guide the creation of skills, rules, plugins, hooks, and MCP servers.": "Antigravity 定制系统综合指南。用于说明定制如何工作、加载优先级、发现机制，并指导技能/规则/插件/钩子/MCP 服务器的创建。",
  "Guidelines for interacting with GitHub and request permissions from the user when commands fail due to restrictions in the agent environment.": "与 GitHub 交互的指南；当命令因智能体环境限制失败时，向用户请求权限。",
  "How to render rich interactive HTML widgets inline in the chat or as standalone artifacts. Use this skill when you want to show the user diagrams, data visualizations, interactive controls, educational walkthroughs, or any rich visual content beyond plain text and markdown.": "如何在对话中内联或作为独立制品渲染富交互 HTML 组件。需要展示图表、数据可视化、交互控件、教学演示等超出纯文本/Markdown 的内容时使用。",
  "Automatically migrate legacy workflows to modern skills across global and workspace configurations. Scans for existing workflows, creates target SKILL.md files, and safely archives old workflow files.": "自动将全局与工作区配置中的旧版工作流迁移到现代技能。扫描现有工作流，创建目标 SKILL.md，并安全归档旧文件。",
  "When enabled, the values below replace the auto-detected OS, host, and user type used for feature gating.": "开启后，下方取值将覆盖用于功能门控的自动检测系统/宿主/用户类型。",
  "Simulate running on a different OS.": "模拟在不同操作系统上运行。",
  "Simulate a different host (Electron, desktop or mobile Web, Extension, remote control, or installed PWA).": "模拟不同宿主（Electron、桌面/移动 Web、扩展、远程控制或已安装 PWA）。",
  "Simulate a different user cohort (Google, External, Enterprise).": "模拟不同用户群（Google / 外部 / 企业）。",
  "Workspace URI query parameter": "工作区 URI 查询参数",
  "Don't show this for 2 days": "2 天内不再显示",
  "This prompt is straightforward and does not need alternative comparisons.": "该提示较直接，无需多方案对比。",
  "This request is not well-suited for parallel Best-of-N generation.": "该请求不适合并行 Best-of-N 生成。",
  "I prefer an immediate single response to prioritize productivity right now.": "我现在更希望优先获得即时单次回复。",
  "The current trigger rate is too high.": "当前触发频率过高。",
  "No model specified for Battle Mode, falling back to use current selected model": "对战模式未指定模型，回退使用当前所选模型",
  "Failed to create worktree": "创建 worktree 失败",
  "Failed to create CitC clone workspace": "创建 CitC 克隆工作区失败",
  "Failed to unarchive project: project management feature not available": "取消归档项目失败：项目管理功能不可用",
  "Failed to rename conversation": "重命名对话失败",
  "Failed to delete conversation": "删除对话失败",
  "Failed to stop conversation": "停止对话失败",
  "Failed to create workspace.": "创建工作区失败。",
  "Failed to Generate Commit Message": "生成提交信息失败",
  "Commit succeeded": "提交成功",
  "Failed to Commit": "提交失败",
  "Amend succeeded": "修正提交成功",
  "Failed to Amend": "修正提交失败",
  "Push succeeded": "推送成功",
  "Failed to Push": "推送失败",
  "MCP Install Error:": "MCP 安装错误：",
  "MCP Configuration Error:": "MCP 配置错误：",
  "MCP Authentication Error:": "MCP 认证错误：",
  "Custom Agent Error:": "自定义智能体错误：",
  "Plugin Operation Error:": "插件操作错误：",
  "Skills Configuration Error:": "技能配置错误：",
  "Error fetching MCP prompt": "获取 MCP 提示失败",
  "View Debug": "查看调试信息",
  "Generations": "生成记录",
  "Drag to resize the gutter; double-click to fit it automatically": "拖动调整栏宽；双击自动适配",
  "Click to go there, drag to select a range, drag an edge to resize": "点击跳转，拖动选择范围，拖动边缘调整大小",
  "By phase": "按阶段",
  "By step type": "按步骤类型",
  "One row per step, in order — scroll to move through the run": "每步一行、按顺序排列 — 滚动查看执行过程",
  "Every step packed into a lane per kind — no rows, no scrolling": "同类步骤合并为一条泳道 — 无行、无需滚动",
  "How long a quiet interval must be before it collapses": "静默区间折叠前需持续多久",
  "What the step bars are coloured by": "步骤条颜色依据",
  "One lane per kind of step, or one per step type": "同类步骤一条泳道，或每种步骤类型一条",
  "Steps and containers shorter than this fade back": "短于该时长的步骤与容器将淡化",
  "Search conversations (by name or Cascade ID)": "搜索对话（按名称或 Cascade ID）",
  "[ProjectUpdates]": "[项目更新]",
  "[AppState]": "[应用状态]",
  "[ExtensibilityPlugins]": "[扩展插件]",
  "[TrajectorySummaries]": "[轨迹摘要]",
  "Fitting the whole trajectory": "适配完整轨迹",
  "outer App Version | Inner App Version": "外层应用版本 | 内层应用版本",
  "opens in the in-app preview pane. Some sites don't support iframe embedding and may not load.": "在应用内预览面板打开。部分站点不支持 iframe 嵌入，可能无法加载。",
  "Opens in the in-app preview pane. Some sites don't support iframe embedding and may not load.": "在应用内预览面板打开。部分站点不支持 iframe 嵌入，可能无法加载。",
  "Ask a quick question without interrupting the main conversation.": "在不打断主对话的前提下快速提问。",
  "The browser subagent can be invoked by typing /browser in the conversation input box.": "可在对话输入框输入 /browser 调用浏览器子智能体。",
  "Configure the browser subagent. It requires": "配置浏览器子智能体。它需要",
  "to be installed.": "已安装。",
  "Browse and enable plugins from the Build With Google catalog.": "浏览并启用 Build With Google 目录中的插件。",
  "Access grants": "访问授权",
  "Folders the automation agents can access.": "自动化智能体可访问的文件夹。",
  "Command and file access granted to the automation agents.": "授予自动化智能体的命令与文件访问权限。",
  "Describe a plugin and the agent builds it": "描述插件，由智能体帮你构建",
  "UI Plugins": "界面插件",
  "Delete Task": "删除任务",
  "Delete MCP Server": "删除 MCP 服务器",
  "Delete Skill": "删除技能",
  "Welcome to Cider with Jetski": "欢迎使用 Cider with Jetski",
  "Core AI Systems is hiring!": "Core AI Systems 正在招聘！",
  "Import AI Studio Project": "导入 AI Studio 项目",
  "description": "描述",
  "Inline Widget": "内联组件",
  "Full Error": "完整错误信息",
  "Segment Metrics": "分段指标",
  "Trajectory Metrics": "轨迹指标",
  "Always Allow": "始终允许",
  "Allow Once": "允许一次",
  "Allow options": "允许选项",
  "Click to copy full command": "点击复制完整命令",
  "view full search results": "查看完整搜索结果",
  "View Page": "查看页面",
  "Create fork in current workspace": "在当前工作区创建派生对话",
  "Team of subagents to do long running work": "用于长时间任务的子智能体团队",
  "Google Personal Access Token": "Google 个人访问令牌",
  "GitHub Personal Access Token": "GitHub 个人访问令牌",
  "Antigravity": "Antigravity",
  "File": "文件",
  "View": "视图",
  "Window": "窗口",
  "New Conversation": "新建对话",
  "Conversation History": "对话历史",
  "Scheduled Tasks": "计划任务",
  "Install IDE": "安装 IDE 插件",
  "Display Options": "显示选项",
  "Create New Project": "新建项目",
  "Project options": "项目选项",
  "New Conversation in Project": "在项目中新建对话",
  "More Actions": "更多操作",
  "Pin conversation": "置顶对话",
  "Unpin conversation": "取消置顶对话",
  "Stop execution": "停止执行",
  "Conversation Log": "对话日志",
  "Scroll to Bottom": "滚动到底部",
  "Add context": "添加上下文",
  "Record voice memo": "录制语音备忘录",
  "Toggle Sidebar": "切换侧边栏",
  "Toggle Auxiliary Pane": "切换辅助面板",
  "Go Back": "返回",
  "Go Forward": "前进",
  "No more older messages": "没有更早的历史消息了",
  "Load older messages": "加载更早的消息",
  "Open Settings": "打开设置",
  "Close Settings": "关闭设置",
  "Keyboard shortcuts": "键盘快捷键",
  "Open Conversation Picker": "打开对话选择器",
  "Focus Input": "快速聚焦输入框",
  "Toggle Model Selector": "呼出/关闭模型选择器",
  "Toggle Voice Recording": "开启/停止语音录音",
  "Toggle Terminal": "呼出/隐藏终端",
  "Find in Pane": "在当前面板中搜索",
  "Add to Chat/Quote": "添加到对话/引用",
  "Add to Chat": "添加到对话",
  "Quote Selection": "引用选中文本",
  "Previous Pane Tab": "切换到上一个面板标签",
  "Next Pane Tab": "切换到下一个面板标签",
  "Select Previous Conversation": "选择上一个对话",
  "Select Next Conversation": "选择下一个对话",
  "Open Command Palette": "打开命令面板",
  "Open Workspace": "打开工作区",
  "Open Workspace Selector": "打开工作区选择器",
  "New Editor Window": "新建编辑器窗口",
  "File Picker": "文件选择器",
  "Continue Response": "继续生成响应",
  "Split Terminal": "拆分终端",
  "New Terminal Tab": "新建终端标签",
  "Close Terminal Tab": "关闭终端标签",
  "Provide feedback": "提交反馈",
  "Copy conversation markdown": "复制对话 Markdown",
  "Copy Path": "复制路径",
  "Copy File Path": "复制文件路径",
  "Copy File Name": "复制文件名",
  "Archive this conversation": "归档此对话",
  "Find in conversation": "在对话中查找",
  "Pin this conversation": "置顶此对话",
  "Unpin this conversation": "取消置顶此对话",
  "Rename this conversation": "重命名当前对话",
  "Remove from Group": "移出分组",
  "Accept Step": "采纳该步骤",
  "Reject Step": "拒绝该步骤",
  "Fullscreen": "全屏",
  "Maximize": "最大化",
  "Minimize": "最小化",
  "Reload": "重新加载",
  "Cut": "剪切",
  "Paste": "粘贴",
  "Select All": "全选",
  "Rename": "重命名",
  "Share": "分享",
  "Archive": "归档",
  "Restore": "恢复",
  "Fork": "派生对话",
  "Split": "分屏",
  "Upgrade": "升级",
  "Sign Out": "退出登录",
  "Learn more about": "了解更多关于",
  "For help, visit": "获取帮助，请访问",
  "Follow the guide at": "请参考指引：",
  "here": "此处",
  "Dismiss": "忽略",
  "Got it": "知道了",
  "Check for Updates": "检查更新",
  "New Window": "新建窗口",
  "Docs": "官方文档",
  "Undo": "撤销",
  "Redo": "重做",
  "Force Reload": "强制重新加载",
  "Toggle Full Screen": "切换全屏",
  "Toggle Fullscreen": "切换全屏",
  "Actual Size": "实际大小",
  "Zoom In": "放大",
  "Zoom Out": "缩小",
  "Zoom": "缩放",
  "Loading...": "加载中...",
  "Ask anything, @ to mention, / for actions": "询问任何问题，输入 @ 引用，输入 / 执行操作...",
  "Ask anything, @ to mention, / for workflows...": "询问任何问题，输入 @ 引用，输入 / 使用工作流...",
  "What do you want to build?": "你想构建什么？",
  "Cancel (Ctrl+D)": "取消 (Ctrl+D)",
  "Send message": "发送消息",
  "Send": "发送",
  "Working": "运行中",
  "Thinking": "思考中",
  "Generating": "生成中",
  "Idle": "空闲",
  "Completed": "已完成",
  "Done": "已完成",
  "Failed": "已失败",
  "Cancelled": "已取消",
  "Blocked": "已阻塞",
  "In Progress": "进行中",
  "Running": "运行中",
  "Stopped": "已停止",
  "Starting": "启动中",
  "Status": "状态",
  "Proceed": "继续执行",
  "Proceed in sandbox": "在沙箱中执行",
  "Proceed in Sandbox": "在沙箱中自动执行",
  "Reject": "拒绝",
  "Approve": "批准",
  "Approve all": "全部批准",
  "Applied": "已应用",
  "Discard": "放弃更改",
  "Discard changes": "放弃更改",
  "Save changes": "保存更改",
  "Select model": "选择模型",
  "Select Model": "选择模型",
  "Select Model to Send Message": "选择用于发送消息的模型",
  "No Model Selected": "未选择模型",
  "No Models Available": "暂无可用模型",
  "Error Loading Models": "模型加载失败",
  "Model quota reached": "模型配额已用完",
  "Baseline model quota reached": "基础模型配额已用完",
  "Select another model": "请选择其他模型",
  "Enable Overages": "允许超额使用",
  "Insufficient AI Credits": "AI 积分不足",
  "Purchase Credits": "购买积分",
  "See Plans": "查看套餐",
  "Fast": "快速模式",
  "Planning": "规划模式",
  "Normal": "常规模式",
  "Agent": "智能体模式",
  "High": "高思考量",
  "Medium": "中思考量",
  "Low": "低思考量",
  "Minimal": "极简思考量",
  "Model Selection": "模型选择",
  "Your Plan:": "当前套餐：",
  "You can upgrade to a Google AI Ultra plan to receive higher rate limits.": "可升级到 Google AI Ultra 套餐以获得更高调用限额。",
  "Always allow": "始终允许",
  "Allow once": "允许一次",
  "Allow": "允许",
  "Deny": "拒绝",
  "Block": "阻止",
  "Ask first": "先询问",
  "Ask every time": "每次询问",
  "Always run": "始终运行",
  "Require Approval": "每次均需审批",
  "Strict": "严格审批模式",
  "Approval": "审批",
  "Input required": "需要你的输入",
  "Action required": "需要处理",
  "Verification required": "需要验证",
  "Complete verification": "完成验证",
  "Run command": "执行命令",
  "Administrator access (UAC)": "管理员权限 (UAC)",
  "Grant administrator access for": "授予管理员权限：",
  "File access": "文件访问",
  "Open URL": "打开 URL",
  "Read URL": "读取 URL",
  "MCP tool": "MCP 工具",
  "Run JS": "运行 JS",
  "Read": "读取",
  "Write": "写入",
  "Run": "运行",
  "Run (unsandboxed)": "运行（非沙箱）",
  "Use": "使用",
  "Output": "输出",
  "Logs": "日志",
  "Errors": "错误",
  "Copy debug info": "复制调试信息",
  "Copy error to clipboard": "复制错误到剪贴板",
  "Agent terminated due to error": "智能体因错误已终止",
  "Failed to stop agent": "停止智能体失败",
  "Send Now": "立即发送",
  "Send Immediately": "立即发送",
  "Queue": "排队",
  "Queued Messages": "排队消息",
  "Background Tasks": "后台任务",
  "Background Tasks0": "后台任务",
  "Files Changed": "文件变更",
  "Files Changed0": "文件变更",
  "Skills Used": "已用技能",
  "Skills Used2": "已用技能",
  "Skills5": "技能",
  "Terminals": "终端",
  "Terminals0": "终端",
  "Uploads0": "上传",
  "Uncommitted": "未提交",
  "Stop All Subagents": "停止全部子智能体",
  "Stop Subagent": "终止子智能体",
  "Cancel All Tasks": "取消全部任务",
  "Implementation Plan": "实施计划",
  "Walkthrough": "操作 walkthrough",
  "Create repository": "创建仓库",
  "Documents": "文档",
  "MCP Servers": "MCP 服务器",
  "MCP servers": "MCP 服务器",
  "Installed MCP Servers": "已安装 MCP 服务器",
  "No MCP servers installed": "未安装 MCP 服务器",
  "Add MCP": "添加 MCP",
  "Add MCP Server": "添加 MCP 服务器",
  "Add MCP server": "添加 MCP 服务器",
  "Installed Skills": "已安装技能",
  "Customizations": "定制与扩展",
  "Customize": "自定义",
  "Builtin": "内置",
  "Recent Files": "最近文件",
  "Folders": "文件夹",
  "Model Credits": "模型积分",
  "Model Quota": "模型配额",
  "Enable AI Credit Overages": "允许 AI 积分超额抵扣",
  "Token Usage": "Token 用量",
  "Notification Settings": "通知设置",
  "Notification Preferences": "通知偏好",
  "Enable Notifications": "启用通知",
  "Open Preferences": "打开偏好设置",
  "Prevent Sleep": "阻止系统休眠",
  "Keep In Menu Bar": "关闭窗口后在菜单栏保持运行",
  "Enable Telemetry": "启用使用情况统计",
  "Marketing Emails": "营销邮件",
  "Remote Control": "远程控制",
  "Enable Remote Control": "启用远程控制",
  "Remote Control Issue": "远程控制问题",
  "Work with local agents from another device.": "在另一台设备上继续使用本地智能体。",
  "Open in Remote Control": "在远程控制中打开",
  "Device Name": "设备名称",
  "Editor Settings": "编辑器设置",
  "Browser Settings": "浏览器设置",
  "App": "应用全局配置",
  "Shortcuts": "键盘快捷键",
  "Tab": "Tab 智能补全",
  "Chat Settings": "对话设置",
  "Tables": "表格",
  "Updater": "更新器",
  "UI extensions": "界面扩展",
  "UI Extensions": "界面扩展",
  "Overview": "概览",
  "MCP": "MCP",
  "Skills & Rules": "技能与规则",
  "Skills & rules settings": "技能与规则设置",
  "Permission Settings": "权限设置",
  "Global Permissions": "全局权限",
  "Local Permissions": "本地权限",
  "File Permissions": "文件权限",
  "Network Permissions": "网络权限",
  "Terminal & Tooling Permissions": "终端与工具权限",
  "Review Policy": "审核策略",
  "Project Settings": "项目设置",
  "Open project settings": "打开项目设置",
  "Manage Antigravity app settings.": "管理 Antigravity 应用设置。",
  "Manage your plan, credentials, and general preferences.": "管理套餐、凭据与通用偏好。",
  "Manage your model quota and credits.": "管理模型配额与积分。",
  "Configure default behaviors, skills, and MCP servers.": "配置默认行为、技能与 MCP 服务器。",
  "Configure editor-specific behaviors and shortcuts.": "配置编辑器专属行为与快捷键。",
  "Configure tab completion, suggestions, and navigation behavior.": "配置 Tab 补全、建议与导航行为。",
  "Configure the agent's visual theme and display preferences.": "配置智能体视觉主题与显示偏好。",
  "Configure agent execution, queued message delivery, and permissions.": "配置智能体执行、排队消息投递与权限。",
  "Configure when follow-up messages are sent.": "配置跟进消息的发送时机。",
  "Configure the maximum width of the conversation panel.": "配置对话面板最大宽度。",
  "Controls the actions the agent can take.": "控制智能体可执行的操作。",
  "Controls whether the agent can run custom JavaScript to automate complex browser actions.": "控制智能体是否可运行自定义 JavaScript 完成复杂浏览器操作。",
  "Whether the agent asks you to review its documents.": "智能体是否要求你审阅其文档。",
  "Display and preserve intermediate thinking steps.": "显示并保留中间思考步骤。",
  "Verbose Agent Chat": "详细智能体对话",
  "Show Selection Actions": "显示选中操作",
  "Show \"Edit\" and \"Chat\" buttons when selecting text in the editor.": "在编辑器中选中文本时显示「编辑」与「对话」按钮。",
  "Selection Actions": "选中操作",
  "Browser Actuation Rules": "浏览器操作规则",
  "Commands Outside Sandbox": "沙箱外命令",
  "Browser Javascript Execution Policy": "浏览器 JS 执行策略",
  "Browser Actuation Permissions": "浏览器操作权限",
  "Execute URLs": "执行 URL",
  "Marketplace Item URL": "市场条目 URL",
  "Marketplace Gallery URL": "市场画廊 URL",
  "Changes the base URL for marketplace search results. You must restart Antigravity to use the new marketplace after changing this value.": "修改市场搜索结果的基础 URL。更改后需重启 Antigravity 才能使用新市场。",
  "Changes the base URL on each extension page. You must restart Antigravity to use the new marketplace after changing this value.": "修改各扩展页基础 URL。更改后需重启 Antigravity 才能使用新市场。",
  "Avatar URL": "头像 URL",
  "Bot Name": "机器人名称",
  "Build With Google Plugins": "使用 Google 插件构建",
  "Setup Jetski Chat": "配置 Jetski Chat",
  "Configure a chat bot so you can use Jetski directly from Google Chat.": "配置聊天机器人，以便在 Google Chat 中直接使用 Jetski。",
  "There are no customizations enabled.": "当前未启用任何定制项。",
  "Use Add MCP to browse the store, or add a custom server via the MCP config.": "使用「添加 MCP」浏览商店，或通过 MCP 配置添加自定义服务器。",
  "The breakdown below shows token usage from customizations like skills, rules, and MCP. If the budget is exceeded, large customizations will be truncated automatically.": "下方展示技能、规则、MCP 等定制项的 Token 用量。超出预算后，过大的定制内容会被自动截断。",
  "To modify editor settings, open Settings within the editor window.": "如需修改编辑器设置，请在编辑器窗口内打开设置。",
  "To modify notification settings, open your operating system's system preferences.": "如需修改通知设置，请打开操作系统偏好设置。",
  "Keep the app accessible from the menu bar and running in the background when all windows are closed.": "所有窗口关闭后，应用仍可在菜单栏后台运行。",
  "Prevent the computer from sleeping while the app is running.": "应用运行期间阻止计算机进入休眠。",
  "When toggled on, Antigravity collects usage data to help Google enhance performance and features.": "开启后，Antigravity 会收集使用数据以帮助 Google 改进性能与功能。",
  "When toggled on, Antigravity will use your AI credits to fulfill model requests once you're out of model quota. Antigravity will always use your model quota first before using AI credits.": "开启后，免费模型配额用尽时将使用 AI 积分继续处理请求，并始终优先消耗免费配额。",
  "Receive product updates, tips, and promotions from Google Antigravity via email.": "通过邮件接收 Google Antigravity 的产品更新、技巧与促销信息。",
  "Developer-only tools. These settings are stored locally in this browser and do not affect other users.": "仅供开发者使用的工具。这些设置仅保存在本地浏览器，不影响其他用户。",
  "Please describe the issue in detail. The more actionable your feedback, the quicker our team can address your request. Some helpful information includes:": "请详细描述问题。反馈越具体可执行，团队处理越快。建议包括：",
  "We recommend attaching logs. Attaching logs will help the Antigravity team act on and prioritize your feedback.": "建议附带日志，有助于 Antigravity 团队处理并优先跟进你的反馈。",
  "Steps to reproduce the issue": "问题复现步骤",
  "Steps to Reproduce": "复现步骤",
  "Expected behavior": "预期行为",
  "Actual behavior": "实际行为",
  "Any error messages": "相关报错信息",
  "Any relevant information": "其他相关信息",
  "Attach a screenshot (optional)": "附带截图（可选）",
  "Attach Antigravity server logs": "附带 Antigravity 服务端日志",
  "Auth and Billing": "账号与计费",
  "General Feedback": "一般反馈",
  "Feedback Type": "反馈类型",
  "Bug Report": "缺陷报告",
  "Feature Request": "功能建议",
  "Submit": "提交",
  "App version": "应用版本",
  "Terms of Service": "服务条款",
  "By using this app, you agree to its": "使用本应用即表示你同意其",
  "or join the": "或加入",
  "chat space": "聊天空间",
  "Labs settings have moved": "实验室设置已迁移",
  "Labs settings have moved to the Advanced section of General settings.": "实验室设置已迁移至「常规设置」的「高级」分区。",
  "CitC settings have moved": "CitC 设置已迁移",
  "CitC settings have moved to the Advanced section of General settings.": "CitC 设置已迁移至「常规设置」的「高级」分区。",
  "Best of N settings have moved": "Best of N 设置已迁移",
  "Best of N settings have moved to the Advanced section of General settings.": "Best of N 设置已迁移至「常规设置」的「高级」分区。",
  "Browser settings have moved": "浏览器设置已迁移",
  "Browser settings have moved to the Browser section of General settings.": "浏览器设置已迁移至「常规设置」的「浏览器」分区。",
  "Google3 chats will be regrouped into their workspaces in the sidebar.": "Google3 聊天将按工作区重新归类到侧边栏。",
  "Regroup Google3 Chats": "重新归类 Google3 对话",
  "This migration may mess up your settings, chats, and sidebar.": "此迁移可能会重置部分设置、对话与侧边栏。",
  "to back up your data and run the migration.": "备份数据后再执行迁移。",
  "System": "跟随系统",
  "Light": "浅色",
  "Dark": "深色",
  "Light Theme": "浅色主题",
  "Dark Theme": "深色主题",
  "Default Light": "默认浅色",
  "Default Dark": "默认深色",
  "Background": "背景色",
  "Foreground": "前景色",
  "Accent": "强调色",
  "Preset": "预设",
  "Narrow": "较窄",
  "Wide": "较宽",
  "Comfortable": "标准舒适",
  "Compact": "紧凑",
  "Create fork in shared workspace": "在共享工作区创建派生对话",
  "Create fork in new workspace": "在新工作区创建派生对话",
  "Failed to fork conversation": "派生对话失败",
  "Conversation unavailable": "对话不可用",
  "Mark all as read": "全部标为已读",
  "New Group": "新建分组",
  "Move to Group": "移动到分组",
  "Split Right": "向右分屏",
  "Split Down": "向下分屏",
  "Replace With New": "替换为新对话",
  "Remove From Split": "移出分屏",
  "Conversation Name": "对话名称",
  "Conversation ID": "对话 ID",
  "Project Name": "项目名称",
  "Share Conversation (Preview)": "分享对话（预览）",
  "Conversation Archived": "对话已归档",
  "Delete Permanently": "永久删除",
  "Copy full URL to clipboard": "复制完整 URL 到剪贴板",
  "Click to copy URL": "点击复制 URL",
  "Click to copy path": "点击复制路径",
  "Open Folder": "打开文件夹",
  "Open Folder (Interactive)": "打开文件夹（交互）",
  "Open in new tab": "在新标签页打开",
  "Open Preview": "打开预览",
  "Open in Preview Pane": "在预览面板中打开",
  "Open with External Browser": "用外部浏览器打开",
  "Download PDF": "下载 PDF",
  "Previous Page": "上一页",
  "Next Page": "下一页",
  "First": "第一个",
  "Last": "最后一个",
  "All": "全部",
  "More": "更多",
  "Clear": "清空",
  "Clear Search": "清除搜索",
  "Open Search": "打开搜索",
  "Copy Content": "复制内容",
  "Copy value": "复制值",
  "Copy thinking": "复制思考内容",
  "Copy output": "复制输出",
  "Copy section content": "复制章节内容",
  "Copy email address": "复制邮箱地址",
  "Copy config file path": "复制配置文件路径",
  "Stream": "流式",
  "Activity": "活动",
  "Steps": "步骤",
  "Step": "步骤",
  "Tokens": "Token",
  "Model": "模型",
  "System Prompt": "系统提示词",
  "System Instruction": "系统指令",
  "Execution ID": "执行 ID",
  "Trajectory ID": "轨迹 ID",
  "Terminate": "终止",
  "Termination": "终止",
  "USER": "用户",
  "MODEL": "模型",
  "TOOL": "工具",
  "SYSTEM": "系统",
  "UNKNOWN": "未知",
  "CHECKPOINT": "检查点",
  "Media": "媒体",
  "Mentions": "引用",
  "Actions": "操作",
  "Screen Recording": "屏幕录制",
  "Agent Script": "智能体脚本",
  "New Agent Script": "新建智能体脚本",
  "Invalid Media": "无效媒体",
  "Couldn't load Google Drive link title": "无法加载 Google Drive 链接标题",
  "Getting scripts...": "正在获取脚本...",
  "Copilot voice mode is active": "语音助手模式已激活",
  "Copilot voice message failed": "语音消息发送失败",
  "Copilot voice mode stopped": "语音助手模式已停止",
  "Sent to Copilot": "已发送至助手",
  "Dismiss announcement": "关闭公告",
  "Failed to create terminal": "创建终端失败",
  "Failed to create project": "创建项目失败",
  "Could not create project": "无法创建项目",
  "Failed to save project": "保存项目失败",
  "Current Workspace": "当前工作区",
  "Same Project": "同一项目",
  "No conversations yet": "暂无对话",
  "Pinned Conversations": "已置顶对话",
  "Standalone Conversations": "独立对话",
  "Confirm Undo": "确认撤销",
  "Updated sidebar grouping": "侧边栏分组已更新",
  "Sidebar grouped by workspace": "侧边栏按工作区分组",
  "Sidebar grouped by project": "侧边栏按项目分组",
  "Group By Workspace": "按工作区分组",
  "Group By Project": "按项目分组",
  "Workspaces": "工作区",
  "New Workspace": "新建工作区",
  "Add Workspace": "添加工作区",
  "Create Project": "创建项目",
  "New Project": "新建项目",
  "Quick Start": "快速开始",
  "CitC Workspace": "CitC 工作区",
  "Danger Zone": "危险操作",
  "Standalone Terminals": "独立终端",
  "Command Center": "命令中心",
  "Trajectory Debug View": "轨迹调试视图",
  "Embedded web preview": "内嵌网页预览",
  "Android (main)": "Android (main)",
  "Chromium": "Chromium",
  "Google Chrome": "Google Chrome",
  "Electron (Desktop)": "Electron（桌面）",
  "Windows": "Windows",
  "MacOS": "MacOS",
  "Linux": "Linux",
  "Unknown": "未知",
  "Auto (detected)": "自动检测",
  "Override feature environment": "覆盖功能环境",
  "Operating System": "操作系统",
  "Host Environment": "宿主环境",
  "User Type": "用户类型",
  "Organization Allowed Domains (Read-Only)": "组织允许域名（只读）",
  "No matching flags": "无匹配标志",
  "Refresh quota and credits data": "刷新配额与积分数据",
  "Recommended": "推荐",
  "Keyboard shortcuts for quick navigation and control.": "用于快速导航与控制的键盘快捷键。",
  "Layout Controls": "布局控制",
  "Modify permissions for file, terminal, and MCP tools.": "修改文件、终端与 MCP 工具的权限。",
  "Configure allowed and denied URLs for reading.": "配置允许/禁止读取的 URL。",
  "Configure allowed and denied URLs for browser actuation.": "配置允许/禁止浏览器操作的 URL。",
  "Configure allowed commands outside the sandbox.": "配置沙箱外允许执行的命令。",
  "Configure external tools via Model Context Protocol.": "通过 Model Context Protocol 配置外部工具。",
  "GitHub": "GitHub",
  "GitHub Policies": "GitHub 策略",
  "GitHub Permissions": "GitHub 权限",
  "Manage fine-grained permissions for GitHub.": "管理 GitHub 细粒度权限。",
  "Turbo Mode": "Turbo 模式",
  "Turbo mode": "Turbo 模式",
  "Enable Shell Integration": "启用 Shell 集成",
  "Enable Terminal Sandbox": "启用终端沙箱",
  "Enable Demo Mode (Beta)": "启用演示模式（测试版）",
  "Strict Mode": "严格安全模式",
  "Agent Non-Workspace File Access": "智能体工作区外文件访问",
  "Command Setup Script": "命令初始化脚本",
  "Allow List Terminal Commands": "终端命令允许名单",
  "Deny List Terminal Commands": "终端命令拒绝名单",
  "Agent Auto-Fix Lints": "智能体自动修复 Lint",
  "Confirm Window Reload": "重载窗口前确认",
  "Auto-Expand Changes Overview": "自动展开变更总览",
  "Enable Sounds for Agent": "任务完成播放音效",
  "Enable Notifications for Agent": "任务需确认时弹出通知",
  "Knowledge": "知识库",
  "Auto-Open Edited Files": "自动打开已编辑文件",
  "Open Agent on Reload": "重载时打开智能体面板",
  "Conversation Width": "对话宽度",
  "Markdown Artifact Width": "Markdown 制品宽度",
  "Table Width": "表格宽度",
  "Suggestions in Editor": "编辑器建议",
  "Tab to Jump": "Tab 跳转",
  "Tab to Import": "Tab 导包",
  "Tab Speed": "Tab 补全速度",
  "Highlight After Accept": "采纳后高亮",
  "Enable Browser Tools": "启用浏览器工具",
  "Chrome Binary Path": "Chrome 可执行路径",
  "Browser User Profile Path": "浏览器用户配置路径",
  "Browser CDP Port": "浏览器 CDP 端口",
  "Include Jetski Default Customizations": "包含 Jetski 默认定制",
  "Automatic Check for Updates": "自动检查更新",
  "Nickname": "昵称",
  "CitC Workspace VCS": "CitC 工作区 VCS",
  "Use full VCS clones for Best of N": "Best of N 使用完整 VCS 克隆",
  "Use full Git clones for Best of N": "Best of N 使用完整 Git 克隆",
  "Default Customizations": "默认定制",
  "Customize Global Skills": "自定义全局技能",
  "Custom Agents": "自定义智能体",
  "Refresh MCP servers": "刷新 MCP 服务器",
  "Manage Skills": "管理技能",
  "Refresh skills paths": "刷新技能路径",
  "Skill Custom Paths": "技能自定义路径",
  "Add MCP Servers": "添加 MCP 服务器",
  "Manage Hooks": "管理钩子",
  "Delete Hook": "删除钩子",
  "Add Hook Card": "添加钩子卡片",
  "Delete Handler": "删除处理器",
  "Options": "选项",
  "All tools (*)": "全部工具 (*)",
  "run_command": "run_command",
  "Setup required": "需要配置",
  "Plugin details": "插件详情",
  "Show more results": "显示更多结果",
  "Amend": "修正提交",
  "Commit": "提交",
  "Push": "推送",
  "Include unstaged changes": "包含未暂存更改",
  "Unstage change": "取消暂存",
  "Stage change": "暂存更改",
  "Added (Staged)": "已添加（已暂存）",
  "Untracked (Unstaged)": "未跟踪（未暂存）",
  "Modified": "已修改",
  "Deleted": "已删除",
  "Renamed": "已重命名",
  "Copied": "已复制",
  "Branch": "分支",
  "Changes": "变更",
  "Staged Changes": "已暂存变更",
  "Branch Changes": "分支变更",
  "Manifest Changes": "清单变更",
  "Agent Edits": "智能体编辑",
  "Worktree": "工作树",
  "New worktree": "新建工作树",
  "New Worktree": "新建工作树",
  "Configure Branches": "配置分支",
  "Configure Worktree Branches": "配置工作树分支",
  "Run in your current workspace": "在当前工作区运行",
  "Run in a new worktree": "在新工作树中运行",
  "CitC Clone": "CitC 克隆",
  "Clone current workspace into a new independent workspace": "将当前工作区克隆为新的独立工作区",
  "Create or select a CitC workspace to use in this conversation": "为本对话创建或选择 CitC 工作区",
  "Unmount workspace": "卸载工作区",
  "Delete workspace": "删除工作区",
  "Archive project": "归档项目",
  "Archive Workspace": "归档工作区",
  "Google3 projects are deprecated. Learn more": "Google3 项目已弃用。了解更多",
  "Failed to archive workspace": "归档工作区失败",
  "Workspace archived successfully": "工作区归档成功",
  "Rename Group": "重命名分组",
  "Best-of-N Started": "Best-of-N 已开始",
  "Best-of-N Ended": "Best-of-N 已结束",
  "Proceed with Plan": "按计划继续",
  "Open side-by-side view": "打开并排视图",
  "Review pending conversations": "查看待处理对话",
  "Address CLs needing attention": "处理需要关注的 CL",
  "Generate personalized rules": "生成个性化规则",
  "Discover helpful skills & plugins": "发现有用的技能与插件",
  "Workspace setup warning": "工作区配置警告",
  "Conversation copied as Markdown to clipboard": "对话已以 Markdown 复制到剪贴板",
  "Drag to resize, double-click to reset": "拖动调整大小，双击重置",
  "Previous question": "上一问题",
  "Next question": "下一问题",
  "Too many surveys": "问卷过多",
  "In a rush": "赶时间",
  "Switch Roles": "切换角色",
  "Reset State": "重置状态",
  "Antigravity Interactive HTML": "Antigravity 交互式 HTML",
  "Failed to start conversation": "启动对话失败",
  "Failed to start Best of N mode": "启动 Best of N 模式失败",
  "Failed to proceed": "继续失败",
  "Failed to continue": "继续失败",
  "Custom agents are not available in Best of N mode.": "Best of N 模式下不可用自定义智能体。",
  "Update Available": "有可用更新",
  "Hourly": "每小时",
  "Daily": "每日",
  "Weekly": "每周",
  "Monday": "周一",
  "Tuesday": "周二",
  "Wednesday": "周三",
  "Thursday": "周四",
  "Friday": "周五",
  "Saturday": "周六",
  "Sunday": "周日",
  "Type": "类型",
  "Command": "命令",
  "Uptime": "运行时长",
  "Backoff": "退避重试",
  "Alt": "Alt",
  "Ctrl": "Ctrl",
  "Shift": "Shift",
  "Const": "const",
  "return": "return",
  "string": "string",
  "name": "name",
  "greet": "greet",
  "Add": "添加",
  "Explore the plugin marketplace": "浏览插件市场",
  "Tip": "提示",
  "Last 7 days": "最近 7 天",
  "Before": "之前",
  "After": "之后",
  "Capture screenshot": "捕获截图",
  "Capture console logs": "捕获控制台日志",
  "Screenshot": "截图",
  "Console logs": "控制台日志",
  "Mention Page": "引用页面",
  "Mention": "引用",
  "View child subagents": "查看子智能体",
  "Side-by-side layout": "并排布局",
  "Stacked layout": "堆叠布局",
  "Double-click to reset panel sizes": "双击重置面板尺寸",
  "Fit the whole trajectory": "适配完整轨迹",
  "Open in Trajectory Dashboard": "在轨迹看板中打开",
  "Time to First Token (TTFT)": "首 Token 时间 (TTFT)",
  "Streaming Generation": "流式生成",
  "Tool Call Generation": "工具调用生成",
  "Queue Wait": "排队等待",
  "Tool Execution": "工具执行",
  "Generator Metadata": "生成器元数据",
  "Invocation": "调用",
  "Cascade Config": "Cascade 配置",
  "Cascade ID": "Cascade ID",
  "Trajectory Metadata": "轨迹元数据",
  "Execution Metadata": "执行元数据",
  "Start Snapshot": "开始快照",
  "End Snapshot": "结束快照",
  "Step Type": "步骤类型",
  "Step Details": "步骤详情",
  "Outer App Version | Inner App Version": "外层应用版本 | 内层应用版本",
  "Copy this subtree JSON": "复制该子树 JSON",
  "Copy raw string value": "复制原始字符串",
  "Copy schema JSON": "复制 Schema JSON",
  "Copy trajectory ID": "复制轨迹 ID",
  "Copy description": "复制描述",
  "Previous match (Shift+Enter)": "上一个匹配 (Shift+Enter)",
  "Next match (Enter)": "下一个匹配 (Enter)",
  "Clear search (Esc)": "清除搜索 (Esc)",
  "Previous match": "上一个匹配",
  "Next match": "下一个匹配",
  "Toggle Thumbnails": "切换缩略图",
  "Open in Notebook View": "在 Notebook 视图打开",
  "Custom View": "自定义视图",
  "Sample GDoc": "示例 Google 文档",
  "Google Docs": "Google 文档",
  "Google Sheets": "Google 表格",
  "Google Slides": "Google 幻灯片",
  "Google Drive": "Google 云端硬盘",
  "Buganizer": "Buganizer",
  "Critique": "评审意见",
  "United States": "美国",
  "Europe": "欧洲",
  "Dev mode: Localhost server automatically detected": "开发模式：已自动检测本地服务器",
  "This sidecar runs from a path that is not officially supported. Make sure your code is in a trusted location in google3.": "此 sidecar 运行在非官方支持路径。请确保代码位于 google3 中受信任的位置。",
  "Updates to your sidebar": "侧边栏更新",
  "Current workspace": "当前工作区",
  "Standalone": "独立",
  "Request review": "请求审核",
  "（Account）": "（账号）",
  "（Appearance）": "（外观）",
  "（App）": "（应用）",
  "（Browser）": "（浏览器）",
  "（Customizations）": "（定制）",
  "（Developer）": "（开发者）",
  "（Editor）": "（编辑器）",
  "（Feedback）": "（反馈）",
  "（General）": "（常规）",
  "（Models & Usage）": "（模型与用量）",
  "（Shortcuts）": "（快捷键）",
  "（Tab）": "（Tab）",
  "(Account)": "(账号)",
  "(Appearance)": "(外观)",
  "(App)": "(应用)",
  "(Browser)": "(浏览器)",
  "(Customizations)": "(定制)",
  "(Developer)": "(开发者)",
  "(Editor)": "(编辑器)",
  "(Feedback)": "(反馈)",
  "(General)": "(常规)",
  "(Models & Usage)": "(模型与用量)",
  "(Shortcuts)": "(快捷键)",
  "(Tab)": "(Tab)",
  "Start Voice Recording": "开始语音录制",
  "Stop Voice Recording": "停止语音录制",
  "Toggle File Viewer": "打开/隐藏文件查看器",
  "Toggle Editor": "打开/隐藏编辑器",
  "Open Launchpad": "打开启动台",
  "Toggle Project Selector": "切换项目选择器",
  "Toggle Environment Selector": "切换环境选择器",
  "Close Tab": "关闭标签页",
  "Split Conversation Vertically": "垂直分屏对话",
  "Split Conversation Horizontally": "水平分屏对话",
  "Equalize Split Panes": "等宽分屏",
  "Open in Code Search": "在代码搜索中打开",
  "Comment on Selection": "为选中内容批注",
  "Reset Zoom": "重置缩放",
  "Go Back in Pane": "在面板中后退",
  "Go Forward in Pane": "在面板中前进",
  "Complete Onboarding Step": "完成引导步骤",
  "Code Search": "代码搜索",
  "Open Commit Graph": "打开提交图",
  "Open Conversation History": "打开对话历史",
  "Open Keyboard Shortcuts": "打开键盘快捷键",
  "Open Conversation": "打开对话",
  "Mark as Read": "标为已读",
  "Mark as Unread": "标为未读",
  "Delete Conversation": "删除对话",
  "Terminal: Add to Chat": "终端：添加到对话",
  "Refresh gcert credentials": "刷新 gcert 凭据",
  "Restart Main Language Server": "重启主语言服务",
  "Download Diagnostics": "下载诊断信息",
  "Previous Aux Pane Tab": "上一个辅助面板标签",
  "Next Aux Pane Tab": "下一个辅助面板标签",
  "Collapse All Folders": "折叠全部文件夹",
  "Expand All Folders": "展开全部文件夹",
  "Conversation Sharing": "对话分享",
  "Inline Actions": "内联操作",
  "Add inline comment": "添加内联批注",
  "Edit comment": "编辑批注",
  "Delete comment": "删除批注",
  "Copy Image": "复制图片",
  "Save Image": "保存图片",
  "Explain and Fix in Current Conversation": "在当前对话中解释并修复",
  "Run terminal commands with sandbox restrictions.": "在沙箱限制下运行终端命令。",
  "Sandbox Allow Network": "允许沙箱访问网络",
  "Allow sandboxed commands to make network requests.": "允许沙箱内命令发起网络请求。",
  "Terminal Command Auto Execution": "终端命令自动执行",
  "Agent Host Address": "智能体主机地址",
  "Configure the default width of markdown artifacts.": "配置 Markdown 制品默认宽度。",
  "Configure the default width of tables.": "配置表格默认宽度。",
  "Tab Gitignore Access": "Tab 忽略文件访问",
  "Manage your conversations from the companion website.": "通过配套网站管理你的对话。",
  "Not Signed In": "未登录",
  "A label for this computer when you connect from another device. Changing it reconnects.": "从其他设备连接时显示的本机名称。修改后会重新连接。",
  "Continue your work from another device with Remote Control. Scan the QR code or open the link below.": "使用远程控制在其他设备继续工作。扫描二维码或打开下方链接。",
  "Open files in the background if the agent creates or edits them": "智能体创建或编辑文件时在后台打开",
  "Open the agent panel on window reload": "窗口重载时打开智能体面板",
  "Antigravity Chinese Localization Plugin": "Antigravity 中文本地化插件",
  "Discard unstaged changes": "放弃未暂存更改",
  "Use theme to be imported with settings": "使用随设置导入的主题",
  "Select your license": "选择你的许可证",
  "Electron (Gemini App)": "Electron（Gemini 应用）",
  "Web (desktop)": "Web（桌面）",
  "Web (desktop, PWA)": "Web（桌面 PWA）",
  "Worked for": "已工作",
  "Manage project folders, agent settings, and permissions.": "管理项目文件夹、智能体设置与权限。",
  "Add Folder": "添加文件夹",
  "Agent Settings": "智能体设置",
  "Inherit Global": "继承全局",
  "Also includes 全局权限 when working in this project. 了解详情.": "在本项目中工作时也会应用全局权限。了解详情。",
  "Also includes": "同时包含",
  "when working in this project.": "在本项目中工作时。",
  "Project folders": "项目文件夹",
  "Project permissions": "项目权限",
  "Local permissions": "本地权限",
  "File access rules": "文件访问规则",
  "Network access rules": "网络访问规则",
  "Terminal commands": "终端命令",
  "Show 2 breakdowns": "显示 2 项明细",
  "Show 1 breakdown": "显示 1 项明细",
  "Show 3 breakdowns": "显示 3 项明细",
  "% of the customization budget is available.": "定制预算剩余百分比。",
  "tokens)": "tokens)",
  "user_global": "user_global",
  "Rules: ": "规则：",
  "Archive conversation": "归档对话",
  "Copy path": "复制路径",
  "Describe the bug you encountered...": "描述你遇到的问题...",
  "Enter avatar URL (optional)": "输入头像 URL（可选）",
  "Enter bot name (optional)": "输入机器人名称（可选）",
  "Interrupt the agent and send immediately.": "打断智能体并立即发送。",
  "Message input": "消息输入框",
  "Please list the steps to reproduce the issue": "请列出问题的复现步骤",
  "Queue until after the current turn.": "排队到当前回合结束后发送。",
  "Select Environment": "选择环境",
  "Typeahead menu": "联想输入菜单",
  "Archived": "已归档",
  "Unarchive": "取消归档",
  "Archive / Restore": "归档 / 恢复",
  "Archive Conversation": "归档对话",
  "Archive Project": "归档项目",
  "Archive Environment": "归档环境",
  "Unarchive project": "取消归档项目",
  "Pin": "置顶",
  "Unpin": "取消置顶",
  "Pinned": "已置顶",
  "Pinned Chats Only": "仅显示已置顶对话",
  "All conversations": "全部对话",
  "Are you sure you want to archive the": "确定要归档",
  "Are you sure you want to delete this conversation? This action cannot be undone.": "确定要删除此对话吗？此操作无法撤销。",
  "Are you sure you want to mark all": "确定要将全部",
  "conversations as read? This action cannot be undone.": "个对话标为已读吗？此操作无法撤销。",
  "Copy project": "复制项目",
  "Open project": "打开项目",
  "Delete project": "删除项目",
  "Create a Project": "创建项目",
  "Create project from scratch": "从零创建项目",
  "A project with this name already exists.": "同名项目已存在。",
  "Move to project": "移动到项目",
  "Remove from project": "从项目移除",
  "Switch project": "切换项目",
  "1 active conversation": "1 个进行中对话",
  "1 archived conversation": "1 个已归档对话",
  "AI Credits": "AI 积分",
  "AI credits": "AI 积分",
  "AI Credit": "AI 积分",
  "credits": "积分",
  "Credit": "积分",
  "quota": "配额",
  "Remaining": "剩余",
  "remaining": "剩余",
  "usage": "用量",
  "Context usage": "上下文用量",
  "tokens": "tokens",
  "Get More AI Credits": "获取更多 AI 积分",
  "Your Plan": "当前套餐",
  "quota reached": "配额已用完",
  "AI Credits Used to Generate Response": "生成回复所用 AI 积分",
  "AI Credits are used when you've exceeded your model quota. Keep track of your current AI Credits in the": "超出模型配额后将使用 AI 积分。可在下方查看当前 AI 积分：",
  "To continue using this model now, enable AI Credit overages.": "若要继续使用当前模型，请启用 AI 积分超额抵扣。",
  "Your AI credits balance is too low to continue.": "AI 积分余额不足，无法继续。",
  "Your quota for this model is running low.": "当前模型配额即将用尽。",
  "No quota information available.": "暂无配额信息。",
  "Upgrade plan": "升级套餐",
  "Change plan": "变更套餐",
  "Current plan": "当前套餐",
  "Manage billing": "管理计费",
  "View usage": "查看用量",
  "rate limit": "速率限制",
  "Rate limit": "速率限制",
  "limit reached": "已达上限",
  "Limit reached": "已达上限",
  "Exceeded": "已超出",
  "exceeded": "已超出",
  "Out of quota": "配额已用尽",
  "Out of credits": "积分已用尽",
  "tokens left": "剩余 tokens",
  "requests left": "剩余请求次数",
  "Monthly quota": "月度配额",
  "Daily quota": "每日配额",
  "Permission:": "权限：",
  "Review": "审核",
  "Good response": "回复有帮助",
  "Bad response": "回复无帮助",
  "Copy code": "复制代码",
  "At mention code block": "@ 引用代码块",
  "User message": "用户消息",
  "Agent response": "智能体回复",
  "Undo changes up to this point": "撤销到此处的更改",
  "Review changes": "审阅变更",
  "files changed": "个文件变更",
  "file changed": "个文件变更",
  "Allow in Conversation": "在对话中允许",
  "Add to allowlist": "加入允许名单",
  "Added to allowlist": "已加入允许名单",
  "Add Custom Model": "添加自定义模型",
  "Add Model": "添加模型",
  "Best of N Models": "Best of N 模型",
  "Agent Settings (For Project)": "智能体设置（项目级）",
  "Agent will always ask to review in strict mode.": "严格模式下智能体将始终请求审阅。",
  "Active Tasks & Conversations:": "进行中的任务与对话：",
  "Collapse queued messages": "收起排队消息",
  "Concierge conversation is unavailable": "助手对话不可用",
  "Creating projects for your conversations": "正在为对话创建项目",
  "Record Audio": "录制音频",
  "Record Audio Ctrl+M": "录制音频 Ctrl+M",
  "高思考量": "高思考量",
  "View Usage": "查看用量",
  "Models Tab": "「模型」页",
  "Context Window": "上下文窗口",
  "Context window": "上下文窗口",
  "Gemini Models": "Gemini 模型",
  "Claude and GPT models": "Claude 与 GPT 模型",
  "Weekly Limit Remaining": "每周限额剩余",
  "Five Hour Limit Remaining": "5 小时限额剩余",
  "5-hour limit": "5 小时限额",
  "weekly limit": "每周限额",
  "Weekly Limit": "每周限额",
  "Five Hour Limit": "5 小时限额",
  "You have used some of your weekly limit, it will fully refresh in 6 days, 22 hours.": "你已使用部分每周限额，将在 6 天 22 小时后完全恢复。",
  "You have used some of your 5-hour limit, it will fully refresh in 3 hours, 9 minutes.": "你已使用部分 5 小时限额，将在 3 小时 9 分钟后完全恢复。",
  "You have used some of your weekly limit": "你已使用部分每周限额",
  "You have used some of your 5-hour limit": "你已使用部分 5 小时限额",
  "it will fully refresh in": "，将在",
  "Resets in": "重置于",
  "resets in": "重置于",
  "Resets": "重置",
  "requests": "次请求",
  "Requests": "请求次数",
  "Used": "已使用",
  "used": "已使用",
  "Limit": "限额",
  "limit": "限额",
  "Limits": "限额",
  "Monthly": "每月",
  "Last 30 days": "最近 30 天",
  "This month": "本月",
  "Upgrade to": "升级到",
  "Credits Used": "已用积分",
  "Credits Remaining": "剩余积分",
  "Edit Model": "编辑模型",
  "Edit Custom Model": "编辑自定义模型",
  "My Custom Gemini Model": "我的自定义 Gemini 模型",
  "Custom models": "自定义模型",
  "Custom models are only supported on Linux machines.": "自定义模型目前仅支持 Linux。",
  "Google AI Ultra": "Google AI Ultra",
  "fast": "快速",
  "thinking": "思考",
  "Context Summarization": "上下文摘要",
  "Active Context Start": "活动上下文起点",
  "Add Context": "添加上下文",
  "Code Context Items": "代码上下文条目",
  "The conversation was compacted to fit within the context window.": "对话已压缩以适配上下文窗口。",

  // === Antigravity 2.35.0 (44.9.1) 新增设置与功能汉化 ===
  "Chat": "对话",
  "Chat Layout": "对话布局",
  "Accessibility": "辅助功能",
  "Input Box": "输入框",
  "Built-in Browser": "内置浏览器",
  "Browser Subagent": "浏览器子智能体",
  "Sound": "提示音",
  "Queued messages": "排队消息",
  "Enter to send": "按 Enter 发送",
  "Send messages with the keyboard": "使用键盘发送消息",
  "Choose which key sends a message in the chat composer.": "选择在对话输入框中用于发送消息的按键。",
  "Command setup script": "命令初始化脚本",
  "Enable terminal sandbox": "启用终端沙盒",
  "Terminal command auto execution": "终端命令自动执行",
  "Enable sounds for agent": "启用智能体提示音",
  "Play a sound when your action is needed or the agent finishes.": "当需要你操作或智能体完成任务时播放提示音。",
  "Set the volume of agent sounds.": "设置智能体提示音音量。",
  "Enable notifications for agent": "启用智能体通知",
  "Show system notifications when your action is needed or the agent finishes.": "当需要你操作或智能体完成任务时显示系统通知。",
  "Conversation steps": "对话步骤详情",
  "Choose how much detail is shown during a conversation.": "选择对话过程中展示的详细程度。",
  "Custom context menus": "自定义右键菜单",
  "Replace the default browser right-click menu with quick actions.": "使用快捷操作菜单替换浏览器默认右键菜单。",
  "Screen reader mode": "屏幕阅读器模式",
  "Optimize the interface and terminal output for screen readers.": "为屏幕阅读器优化界面和终端输出。",
  "Conversation width": "对话区域宽度",
  "Terminal placement": "终端显示位置",
  "Choose where terminal sessions appear.": "选择终端会话的显示位置。",
  "Markdown artifact width": "Markdown 产物宽度",
  "Context and quota indicator": "上下文与配额指示器",
  "Show how full the context window is next to the send button. Click it for a breakdown and to see your model quota.": "在发送按钮旁显示上下文窗口占用情况，点击可查看明细与模型配额。",
  "Open links in": "链接打开方式",
  "Choose where links open by default when clicked.": "选择点击链接时的默认打开位置。",
  "Download location": "下载保存位置",
  "Enable browser agent": "启用浏览器智能体",
  "Browser JavaScript execution policy": "浏览器 JavaScript 执行策略",
  "Configure built-in browser, link opening, and browser subagent preferences.": "配置内置浏览器、链接打开方式与浏览器子智能体偏好。",
  "Browsing data": "浏览数据",
  "Clear history, cookies and site data from the built-in browser, or manage cookies for each site.": "清除内置浏览器的历史记录、Cookie 与站点数据，或按站点管理 Cookie。",
  "Cookies by Site": "按站点管理 Cookie",
  "Clear Browsing Data?": "清除浏览数据？",
  "Search sites...": "搜索站点...",
  "Allow/deny agent browser actuation access to specific URLs.": "允许或拒绝智能体对特定 URL 执行浏览器操作。",
  "Download files": "下载文件",
  "Allow/deny agent browser file downloads from specific sites.": "允许或拒绝智能体从特定站点下载文件。",
  "Browsing history": "浏览历史",
  "Browser actuation rules": "浏览器操作规则",
  "Prevent sleep": "防止系统休眠",
  "Keep in menu bar": "保留在菜单栏",
  "Automatic check for updates": "自动检查更新",
  "Default workspace VCS": "默认工作区版本控制",
  "VCS used when creating a new workspace, including workspaces generated based off your initial prompt.": "创建新工作区（含基于初始提示词自动生成的工作区）时使用的版本控制工具。",
  "Environments": "运行环境",
  "Pay As You Go": "按量付费",
  "Remote Agents Data": "远程智能体数据",
  "Delete all Remote Agents data": "删除所有远程智能体数据",
  "Delete All Remote Agents Data?": "确认删除所有远程智能体数据？",
  "Enable telemetry": "启用遥测数据",
  "Telemetry": "遥测",
  "Telemetry is disabled in Settings": "已在设置中禁用遥测",
  "Marketing emails": "营销邮件",
  "Google One referral": "Google One 推荐",
  "Share your referral link with friends": "与好友分享你的推荐链接",
  "Managed by Enterprise Gateway": "由企业网关托管",
  "Not signed in": "未登录",
  "Device name": "设备名称",
  "Enter device name...": "输入设备名称...",
  "Local Windows environment": "本地 Windows 环境",
  "Configure the agent": "配置智能体",
  "Orchestrator Settings": "编排器设置",
  "Model selection": "模型选择",
  "Default uses server-managed routing and Orchestrator quota. Custom pins specific models for orchestration and execution.": "默认模式使用服务端托管路由与编排器配额；自定义模式可分别指定编排与执行模型。",
  "Orchestrator Model": "编排模型",
  "Executor Model": "执行模型",
  "Carries out the plan: searches, edits, builds, and tests. Pick a faster, cheaper model.": "负责执行计划（搜索、编辑、构建与测试），建议选择更快、成本更低的模型。",
  "Enable AI credit overages": "允许 AI 积分超额使用",
  "VS Code Default": "VS Code 默认方案",
  "Antigravity (AGY) Style": "Antigravity (AGY) 风格",
  "Manage your keybinding scheme and customize shortcuts in VS Code.": "管理快捷键方案并在 VS Code 中自定义快捷键。",
  "Keybinding Scheme": "快捷键方案",
  "Choose between non-colliding VS Code defaults or standalone Antigravity chords.": "在无冲突的 VS Code 默认方案与独立 Antigravity 组合键之间选择。",
  "Customize Shortcuts": "自定义快捷键",
  "All active Antigravity shortcuts and user keybinding overrides are managed directly by VS Code.": "所有生效中的 Antigravity 快捷键与自定义键位均由 VS Code 直接管理。",
  "Stop Editing": "停止编辑",
  "Edit Shortcut": "编辑快捷键",
  "Add Shortcut": "添加快捷键",
  "Remove Shortcut": "移除快捷键",
  "Reset to Default": "恢复默认",
  "Reset All to Defaults": "全部恢复默认",
  "Enter always submits. This adds a second shortcut.": "Enter 始终用于发送，此项用于添加第二组快捷键。",
  "Configure workspace-specific permissions, resources, and customizations.": "配置工作区专属的权限、资源与自定义项。",
  "System default": "系统默认",
  "Voice": "语音",
  "Microphone": "麦克风",
  "Input device for voice mode and dictation.": "语音模式与听写的输入设备。",
  "Save audio recordings": "保存语音录音",
  "Only stored on your machine.": "仅保存在你的本地设备上。",
  "Recordings": "录音文件",
  "Delete all recordings?": "删除所有录音？",
  "This Computer": "本机",
  "This computer": "本机",
  "Remote": "远程",
  "File reads": "文件读取",
  "Allow/deny agent read access to specific files or directories.": "允许或拒绝智能体读取特定文件或目录。",
  "File writes": "文件写入",
  "Allow/deny agent write access to specific files or directories.": "允许或拒绝智能体写入特定文件或目录。",
  "Allow/deny agent read access to specific URLs or domains.": "允许或拒绝智能体访问特定 URL 或域名。",
  "Allow/deny specific terminal commands.": "允许或拒绝特定终端命令。",
  "Commands outside sandbox": "沙盒外命令",
  "Allow/deny agent command execution outside the sandbox.": "允许或拒绝智能体在沙盒外执行命令。",
  "MCP tools": "MCP 工具",
  "Enter tool name or server...": "输入工具或服务器名称...",
  "Plugin permissions": "插件权限",
  "Changes plugins can make without asking.": "插件无需询问即可执行的更改。",
  "Configure GitHub access policies.": "配置 GitHub 访问策略。",
  "Tool permissions": "工具权限",
  "Enable sandbox mode": "启用沙盒模式",
  "Security preset": "安全预设",
  "Controls permissions for remote conversations.": "控制远程对话的权限策略。",
  "Permission preset": "权限预设",
  "Permission Details": "权限详情",
  "New conversation button": "新建对话按钮",
  "Which workspace the New Conversation button and keyboard shortcut start you in.": "指定点击“新建对话”按钮或快捷键时默认进入的工作区。",
  "Interface Layout": "界面布局",
  "Manage hooks": "管理钩子",
  "Configure hooks that run on agent lifecycle events.": "配置在智能体生命周期事件触发时运行的钩子。",
  "Search MCP servers by name": "按名称搜索 MCP 服务器",
  "Build With Google plugins": "Build With Google 插件",
  "Include Jetski default customizations": "包含默认内置自定义配置",
  "When enabled, the agent will include default customizations, including default skills.": "启用后，智能体将自动加载默认自定义配置与内置技能。",
  "New Tab": "新建标签页",
  "Reopen Closed Tab": "重新打开已关闭的标签页",
  "Search Conversations": "搜索对话",
  "Toggle Side Panel": "切换侧边栏",
  "Toggle Maximize Side Panel": "切换最大化侧边栏",
  "Toggle Overview Panel": "切换概览面板",
  "Toggle Word Wrap": "切换自动换行",
  "Toggle Between Light/Dark Themes": "切换浅色/深色主题",
  "Mute Voice Mic": "麦克风静音",
  "Mute Voice Speaker": "扬声器静音",
  "New Side Question": "新建侧边提问",
  "Side Questions": "侧边提问",
  "Side Question": "侧边提问",
  "Delete Side Question": "删除侧边提问",
  "Failed to delete side question": "删除侧边提问失败",
  "Open in side pane": "在侧边栏打开",
  "Open in Side Panel": "在侧边面板打开",
  "Open in New Window": "在新窗口打开",
  "Open in New Tab": "在新标签页打开",
  "Open in Tab": "在标签页打开",
  "Open in external browser": "在外部浏览器打开",
  "Open in External Browser": "在外部浏览器打开",
  "Open in Built-in Browser": "在内置浏览器打开",
  "Open Link in New Tab": "在新标签页打开链接",
  "Open Link in External Browser": "在外部浏览器打开链接",
  "Copy Link Address": "复制链接地址",
  "Open Image in New Tab": "在新标签页打开图片",
  "Copy Image Address": "复制图片地址",
  "Open Conversation in New Tab": "在新标签页打开对话",
  "Archive This Conversation": "归档此对话",
  "Pin This Conversation": "置顶此对话",
  "Unpin This Conversation": "取消置顶此对话",
  "Pin / Unpin Conversation": "置顶 / 取消置顶对话",
  "Rename This Conversation": "重命名此对话",
  "Rename Conversation": "重命名对话",
  "Mark All as Read": "全部标为已读",
  "Mark This Conversation as Read": "标为已读",
  "Mark This Conversation as Unread": "标为未读",
  "Find in Conversation": "在对话中查找",
  "Jump to Previous Prompt": "跳转到上一条提问",
  "Jump to Next Prompt": "跳转到下一条提问",
  "Copy Conversation ID": "复制对话 ID",
  "Copy Conversation Markdown": "复制对话 Markdown",
  "Move to New Group": "移动到新分组",
  "Remove from Recent": "从最近列表中移除",
  "Cancel Generation": "停止生成",
  "Interrupt Agent": "中断智能体",
  "Command Palette": "命令面板",
  "Background Task Output": "后台任务输出",
  "File explorer": "文件浏览器",
  "Recent files": "最近文件",
  "Search file contents...": "搜索文件内容...",
  "Search for commands...": "搜索命令...",
  "Search for conversations...": "搜索对话...",
  "Search conversations...": "搜索对话...",
  "Search projects...": "搜索项目...",
  "Search customizations...": "搜索自定义项...",
  "Loading installed plugins...": "正在加载已安装插件...",
  "Loading subagent...": "正在加载子智能体...",
  "Subagent ended": "子智能体已结束",
  "Active Skills": "已启用技能",
  "UI plugins": "界面插件",
  "Context Providers": "上下文提供器",
  "Connectors": "连接器",
  "Search connectors": "搜索连接器",
  "Remote Control Instances": "远程控制实例",
  "Open on phone": "在手机上打开",
  "Open on another device": "在其他设备上打开",
  "Pick up this remote conversation on your phone or in any browser. Scan the QR code or open the link below.": "在手机或任意浏览器中继续此远程对话。请扫描二维码或打开下方链接。",
  "Close Other Tabs": "关闭其他标签页",
  "Close Tabs to the Left": "关闭左侧标签页",
  "Close Tabs to the Right": "关闭右侧标签页",
  "Keep Open": "保持打开",
  "Group By": "分组方式",
  "Sort Conversations": "排序对话",
  "Sort By": "排序依据",
  "Display": "显示",
  "Last Updated": "最后更新",
  "Last Prompt": "最后提问",
  "Last Activity": "最近活动",
  "Custom Order": "自定义顺序",
  "Manual Order": "手动排序",
  "Filters": "筛选",
  "Needs Input": "等待输入",
  "Needs attention": "需要关注",
  "Unread": "未读",
  "Inbox": "收件箱",
  "Resolved": "已解决",
  "Stalled": "已停滞",
  "Online": "在线",
  "Offline": "离线",
  "Ready": "就绪",
  "Pending": "待处理",
  "Active": "运行中",
  "Provisioning": "正在准备环境",
  "Updating": "正在更新",
  "Unauthenticated": "未认证",
  "Sign-in required": "需要登录",
  "Sign in again": "重新登录",
  "Log back in": "重新登录",
  "Try again": "重试",
  "Authenticate": "认证",
  "Set up authentication": "配置认证",
  "Connect": "连接",
  "Disconnect": "断开连接",
  "Connect GitHub": "连接 GitHub",
  "Accounts": "账号",
  "Go to Accounts": "前往账号设置",
  "View MCP servers": "查看 MCP 服务器",
  "Browse the Marketplace": "浏览插件市场",
  "Explore other marketplace customizations": "探索更多市场插件与技能",
  "Create a Plugin with the Agent": "使用智能体创建插件",
  "Copy Config File Path": "复制配置文件路径",
  "Copy command": "复制命令",
  "Copy Message": "复制消息",
  "Reply": "回复",
  "Send reply": "发送回复",
  "Cancel Sending Message": "取消发送消息",
  "Revert file changes": "还原文件更改",
  "Undo to Here": "撤销到此处",
  "Fork in Shared Workspace": "在共享工作区创建分支对话",
  "Fork in New Workspace": "在新工作区创建分支对话",
  "Fork conversation in this folder": "在此文件夹中分叉对话",
  "Keeps working in this folder. Nothing is copied.": "继续在此文件夹中工作，不会复制文件。",
  "Good Response": "回复有帮助",
  "Bad Response": "回复不佳",
  "Pause this agent; it keeps its place and streams. Resume to continue.": "暂停此智能体，保留当前进度与输出流，恢复后可继续。",
  "Resume this agent where it paused": "从暂停处恢复此智能体",
  "Stop this agent": "停止此智能体",
  "Kill Terminal": "终止终端",
  "Export as PDF": "导出为 PDF",
  "Capture Screenshot": "截取屏幕截图",
  "Capture Console Logs": "捕获控制台日志",
  "Add screenshot to conversation": "将截图添加到对话",
  "Modified Files": "已修改文件",
  "Files modified by the agent in this conversation": "智能体在当前对话中修改的文件",
  "Untracked": "未跟踪",
  "Added": "已新增",
  "Details": "详情",
  "Show Details": "显示详情",
  "Preview": "预览",
  "Contrast": "对比度",
  "Font": "字体",
  "Themes": "主题",
  "Every hour": "每小时",
  "Every day": "每天",
  "Every weekday": "每个工作日",
  "Every week": "每周",
  "On a schedule": "按计划定时",
  "When something happens": "当特定事件触发时",
  "New automation": "新建自动化",
  "Change schedule": "更改计划",
  "Change model": "更改模型",
  "Schedule": "计划",
  "Main Agent": "主智能体",
  "Coordinator settings": "协调器设置",
  "Every command requires approval.": "每条命令都需要审批。",
  "Ask before sensitive operations.": "敏感操作前询问。",
  "Automatically decide if commands run.": "自动判断命令是否执行。",
  "Run all commands without restrictions.": "无限制执行所有命令。",
  "Unsandboxed commands": "沙盒外命令",
  "Read files": "读取文件",
  "Write files": "写入文件",
  "Browser actions": "浏览器操作",
  "Browser downloads": "浏览器下载",
  "Admin escalation": "管理员提权",
  "Folders these agents can access.": "这些智能体可访问的文件夹。",
  "Commands and files these agents can use.": "这些智能体可使用的命令与文件。",
  "The conversation was compacted while generating this response.": "生成此回复期间已压缩对话上下文。",
  "Choose the models Orchestrator uses. A larger, smarter orchestrator model with a faster, cheaper executor gives high quality for fewer tokens.": "选择编排器（Orchestrator）使用的模型。使用更大型、更智能的编排模型搭配更快速、更经济的执行器，可在消耗更少 Token 的同时获得更高质量。",
  "Plans the work, makes design decisions, and reviews the result. Pick a top-tier model. You can also pick one per conversation from the Orchestrator row in the model menu.": "负责规划任务、制定设计决策并审查结果。建议选择顶级模型，也可在模型菜单的 Orchestrator 行中为单个对话单独指定。",
  "Executor Model": "执行器模型",
  "Runs the planned steps and tool calls. Pick a fast, economical model.": "负责执行已规划的步骤与工具调用。建议选择快速且经济的模型。",
  "Knowledge Work": "知识工作模式",
  "Simplified interface for research, writing, and everyday tasks.": "面向研究、写作与日常任务的精简界面。",
  "Software Engineering": "软件工程模式",
  "Full interface for coding, developer tools, and managing agents.": "面向编程、开发者工具与智能体管理的完整界面。",
  "The breakdown below shows token usage from customizations like rules, skills, and MCP. If a budget is exceeded, large rules are demoted to path pointers and large customizations are excluded automatically.": "下方明细展示了规则（Rules）、技能（Skills）与 MCP 等自定义配置的 Token 占用。若超出预算，大型规则将降级为路径指针，大型自定义项将被自动排除。"
};

// 动态结构化模式匹配（支持多级时间倒计时转换、工作统计、文件变更与用量额度）
const REGEX_PATTERNS = [
  { reg: /^Ran\s+(\d+)\s+commands?$/i, rep: '已执行 $1 个命令' },
  { reg: /^Explored\s+(\d+)\s+files?$/i, rep: '已浏览 $1 个文件' },
  { reg: /^Edited\s+(\d+)\s+files?$/i, rep: '已编辑 $1 个文件' },
  { reg: /^Thought for\s+(\d+(?:ms|s|m))$/i, rep: '已深度思考 $1' },
  { reg: /^Worked for\s+(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/i, rep: (m,h,mi,s) => '已工作 ' + (h?h+'小时':'') + (mi?mi+'分':'') + (s?s+'秒':'') },
  { reg: /^(\d+)\s+files? changed$/i, rep: '$1 个文件变更' },
  { reg: /^No more older messages, showing\s+(\d+)\s+of\s+(\d+)$/i, rep: '没有更早的历史消息了（已显示 $1 / $2）' },
  { reg: /^You have used some of your weekly limit,\s*it will fully refresh in (.+)\.$/i,
    rep: (m, rest) => '你已使用部分每周限额，将在 ' + String(rest)
      .replace(/\b(\d+)\s*days?\b/gi,'$1 天')
      .replace(/\b(\d+)\s*hours?\b/gi,'$1 小时')
      .replace(/\b(\d+)\s*minutes?\b/gi,'$1 分钟')
      .replace(/\b(\d+)\s*seconds?\b/gi,'$1 秒')
      .replace(/,\s*/g,' ') + ' 后完全恢复。' },
  { reg: /^You have used some of your 5-hour limit,\s*it will fully refresh in (.+)\.$/i,
    rep: (m, rest) => '你已使用部分 5 小时限额，将在 ' + String(rest)
      .replace(/\b(\d+)\s*days?\b/gi,'$1 天')
      .replace(/\b(\d+)\s*hours?\b/gi,'$1 小时')
      .replace(/\b(\d+)\s*minutes?\b/gi,'$1 分钟')
      .replace(/\b(\d+)\s*seconds?\b/gi,'$1 秒')
      .replace(/,\s*/g,' ') + ' 后完全恢复。' },
  { reg: /^Resets in\s+(.+)$/i,
    rep: (m, rest) => '将在 ' + String(rest)
      .replace(/\b(\d+)\s*days?\b/gi,'$1 天')
      .replace(/\b(\d+)\s*hours?\b/gi,'$1 小时')
      .replace(/\b(\d+)\s*minutes?\b/gi,'$1 分钟')
      .replace(/\b(\d+)\s*seconds?\b/gi,'$1 秒')
      .replace(/,\s*/g,' ') + ' 后重置' },
  { reg: /^(\d+(?:\.\d+)?)% of the customization budget is available\.$/i, rep: '定制预算剩余 $1%。' },
  { reg: /^Rules:\s*(\d+)\s*tokens?$/i, rep: '规则：$1 tokens' },
  { reg: /^(Background Tasks|Files Changed|Skills Used|Terminals|Uploads)\s*\d*$/i, rep: (m, label) => {
      const map = {'Background Tasks':'后台任务','Files Changed':'文件变更','Skills Used':'已用技能','Terminals':'终端','Uploads':'上传'};
      return map[label] || label;
    }
  },
  { reg: /^Permission:\s*(.+)$/i, rep: '权限：$1' }
];

function getAntigravityConfigDir() {
  try {
    if (typeof process === 'undefined' || !process.env || !path) return '';
    const home = process.env.USERPROFILE || process.env.HOME || '';
    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || (home ? path.join(home, 'AppData', 'Roaming') : '');
      return appData ? path.join(appData, 'Antigravity') : '';
    }
    if (process.platform === 'darwin') {
      return home ? path.join(home, 'Library', 'Application Support', 'Antigravity') : '';
    }
    const xdg = process.env.XDG_CONFIG_HOME || (home ? path.join(home, '.config') : '');
    return xdg ? path.join(xdg, 'Antigravity') : '';
  } catch (e) {
    return '';
  }
}

function loadCustomDictionary() {
  try {
    const cfgDir = getAntigravityConfigDir();
    const customPath = (path && cfgDir) ? path.join(cfgDir, 'i18n-custom.json') : null;
    if (fs && customPath && fs.existsSync(customPath)) {
      const data = JSON.parse(fs.readFileSync(customPath, 'utf8'));
      Object.keys(data).forEach((k) => {
        if (k && k !== '_comment' && typeof data[k] === 'string') DICTIONARY[k] = data[k];
      });
    }
  } catch (err) { /* ignore */ }
}

function initI18nEngine() {
  if (typeof document === 'undefined') return;
  if (window.__agy_i18n_booted) return;
  window.__agy_i18n_booted = true;

  loadCustomDictionary();

  let langMode = 'zh'; // 默认启动模式为仅中文 ('zh')
  try {
    const savedMode = localStorage.getItem('agy_i18n_mode');
    if (savedMode === 'zh' || savedMode === 'en') {
      langMode = savedMode;
    } else if (savedMode === 'bilingual_explicit') {
      langMode = 'bilingual';
    } else if (localStorage.getItem('agy_chinese_plugin_enabled') === 'false') {
      langMode = 'en';
    } else {
      // 无论之前是旧版默认值 'bilingual' 还是首次启动，均默认强制显示仅中文
      langMode = 'zh';
      localStorage.setItem('agy_i18n_mode', 'zh');
    }
  } catch (e) {}

  // applying=true while WE mutate DOM; observer must ignore our own writes
  let applying = false;
  let badge = null;
  let vaultBadge = null;
  let controlDock = null;
  let dockHasMoved = false;

  // 配额嗅探与持久化引擎
  const quotaState = {
    fiveHourLimit: '',
    fiveHourReset: '',
    fiveHourPct: -2,
    weeklyLimit: '',
    weeklyReset: '',
    weeklyPct: -2,
    updatedAt: 0
  };
  let quotaSaveTimer = null;

  function sniffQuota(text) {
    if (!text || typeof text !== 'string') return;
    let changed = false;

    // ── 仅统计 Gemini 自己的限额 ──────────────────────────────────────
    // 排除 Claude / GPT / Opus / o1 / Sonnet 等非 Gemini 模型的限额提示
    const isNonGemini = /claude|gpt|opus|sonnet|haiku|o1|o3|deepseek/i.test(text);
    if (isNonGemini) return;

    // ── Gemini 5 小时限额 ─────────────────────────────────────────────
    // 1) 百分比剩余: "Five Hour Limit Remaining: 85%"
    const m5pct = text.match(/(?:Five.?Hour.?Limit.?Remaining|Gemini\s+5.?Hour|5\s*小时限额剩余)[:\s]*([0-9]+)%/i);
    if (m5pct && m5pct[1]) {
      const pct = m5pct[1] + '%';
      if (quotaState.fiveHourLimit !== pct) {
        quotaState.fiveHourLimit = pct;
        quotaState.fiveHourPct   = parseInt(m5pct[1], 10);
        changed = true;
      }
    }
    // 2) 已用尽: "five hour limit reached / exhausted"
    if (!m5pct && /(?:five.?hour|5.?hour)\s+limit\s*(?:reached|exhausted|used up)/i.test(text)) {
      if (quotaState.fiveHourLimit !== '0%') {
        quotaState.fiveHourLimit = '0%'; quotaState.fiveHourPct = 0; changed = true;
      }
    }
    // 3) "已使用部分 5 小时限额"但无百分比 → 标记"使用中"
    if (!m5pct && !quotaState.fiveHourLimit && /used\s+some\s+of\s+your\s+5.?hour\s+limit/i.test(text)) {
      quotaState.fiveHourLimit = '使用中'; quotaState.fiveHourPct = -1; changed = true;
    }
    // 4) 恢复时间
    const m5r = text.match(/(?:5.?hour\s+limit[^.]*?(?:refresh|reset)\s+in|5\s*小时限额[^。]*?将在)\s*([^。.]+?)(?:\s*后[完全]*恢复|\s*\.|$)/i);
    if (m5r && m5r[1]) {
      const v = m5r[1].trim();
      if (quotaState.fiveHourReset !== v) { quotaState.fiveHourReset = v; changed = true; }
    }

    // ── Gemini 每周限额 ───────────────────────────────────────────────
    // 1) 百分比剩余: "Weekly Limit Remaining: 92%"
    const mwpct = text.match(/(?:Weekly\s*Limit\s*Remaining|Gemini\s+Weekly|每周限额剩余)[:\s]*([0-9]+)%/i);
    if (mwpct && mwpct[1]) {
      const pct = mwpct[1] + '%';
      if (quotaState.weeklyLimit !== pct) {
        quotaState.weeklyLimit = pct;
        quotaState.weeklyPct   = parseInt(mwpct[1], 10);
        changed = true;
      }
    }
    // 2) 已用尽
    if (!mwpct && /weekly\s+limit\s*(?:reached|exhausted|used up)/i.test(text)) {
      if (quotaState.weeklyLimit !== '0%') {
        quotaState.weeklyLimit = '0%'; quotaState.weeklyPct = 0; changed = true;
      }
    }
    // 3) 使用中但无百分比
    if (!mwpct && !quotaState.weeklyLimit && /used\s+some\s+of\s+your\s+weekly\s+limit/i.test(text)) {
      quotaState.weeklyLimit = '使用中'; quotaState.weeklyPct = -1; changed = true;
    }
    // 4) 恢复时间
    const mwr = text.match(/(?:weekly\s+limit[^.]*?(?:refresh|reset)\s+in|每周限额[^。]*?将在)\s*([^。.]+?)(?:\s*后[完全]*恢复|\s*\.|$)/i);
    if (mwr && mwr[1]) {
      const v = mwr[1].trim();
      if (quotaState.weeklyReset !== v) { quotaState.weeklyReset = v; changed = true; }
    }

    // ── Gemini 模型级限额兜底 ─────────────────────────────────────────
    if (/gemini.*(?:quota|limit)\s+reached|gemini.*配额已用尽/i.test(text)) {
      if (quotaState.fiveHourLimit !== '0%') {
        quotaState.fiveHourLimit = '0%'; quotaState.fiveHourPct = 0; changed = true;
      }
    }

    if (changed) { persistQuota(); }
  }

  function getAppCsrfToken() {
    try {
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          const lsToken = window.localStorage.getItem('agy_session_csrf_token');
          if (lsToken) return lsToken;
        }
        if (window.__APP_CONFIG__ && window.__APP_CONFIG__.csrfToken) {
          return window.__APP_CONFIG__.csrfToken;
        }
        if (window.__AGY_CACHED_CSRF__) {
          return window.__AGY_CACHED_CSRF__;
        }
      }
      if (typeof document !== 'undefined' && document.scripts) {
        for (let i = 0; i < document.scripts.length; i++) {
          const txt = document.scripts[i].textContent || '';
          if (txt.includes('csrfToken')) {
            const m = txt.match(/"csrfToken"\s*:\s*"([^"]+)"/);
            if (m && m[1]) {
              if (typeof window !== 'undefined') window.__AGY_CACHED_CSRF__ = m[1];
              return m[1];
            }
          }
        }
      }
    } catch (e) {}
    return '';
  }

  // 主动获取底层语言服务配额（grpc-web 接口）与跨进程触发同步
  let isFetchingQuota = false;
  async function fetchAndPersistQuota(forceRefresh = false) {
    if (isFetchingQuota) return;
    isFetchingQuota = true;
    try {
      const csrf = getAppCsrfToken();
      if (!csrf) return;

      const jsonBody = JSON.stringify({ forceRefresh: !!forceRefresh });
      const jsonBytes = new TextEncoder().encode(jsonBody);
      const frame = new Uint8Array(5 + jsonBytes.length);
      frame[0] = 0;
      const len = jsonBytes.length;
      frame[1] = (len >> 24) & 0xff;
      frame[2] = (len >> 16) & 0xff;
      frame[3] = (len >> 8) & 0xff;
      frame[4] = len & 0xff;
      frame.set(jsonBytes, 5);

      const fetchFn = (typeof window !== 'undefined' && (window.__ORIGINAL_FETCH__ || window.fetch)) || fetch;
      const res = await fetchFn('/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary', {
        method: 'POST',
        headers: {
          'content-type': 'application/grpc-web+json',
          'x-codeium-csrf-token': csrf,
          'x-grpc-web': '1'
        },
        body: frame
      });
      if (!res.ok) return;

      const arrayBuf = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      if (bytes.length <= 5) return;

      let text = new TextDecoder().decode(bytes.slice(5));
      const braceIdx = text.lastIndexOf('}');
      if (braceIdx !== -1) {
        text = text.slice(0, braceIdx + 1);
      }
      const data = JSON.parse(text);
      const groups = data.response?.groups || [];

      // 提取 Gemini 模型的配额
      const geminiGroup = groups.find(g => /gemini/i.test(g.displayName || ''));
      if (geminiGroup && geminiGroup.buckets) {
        for (const bucket of geminiGroup.buckets) {
          const frac = bucket.remainingFraction;
          const pctVal = typeof frac === 'number' ? Math.round(frac * 100) : -1;
          let resetDesc = bucket.description || '';
          const mTime = resetDesc.match(/in\s+([^.]+?)\./i);
          if (mTime) {
            resetDesc = mTime[1].replace(/days?/i, '天').replace(/hours?/i, '小时').replace(/minutes?/i, '分').replace(/,\s*/g, '').trim();
          }

          if (bucket.window === '5h' || bucket.bucketId === 'gemini-5h') {
            quotaState.fiveHourPct = pctVal;
            quotaState.fiveHourLimit = pctVal >= 0 ? pctVal + '%' : '使用中';
            if (resetDesc) quotaState.fiveHourReset = resetDesc;
          } else if (bucket.window === 'weekly' || bucket.bucketId === 'gemini-weekly') {
            quotaState.weeklyPct = pctVal;
            quotaState.weeklyLimit = pctVal >= 0 ? pctVal + '%' : '使用中';
            if (resetDesc) quotaState.weeklyReset = resetDesc;
          }
        }
      }

      quotaState.updatedAt = Date.now();
      persistQuotaImmediate();
    } catch (e) {
      console.warn('[Antigravity-Quota] 主动拉取配额异常:', e);
    } finally {
      isFetchingQuota = false;
    }
  }

  function persistQuotaImmediate() {
    try {
      const homeDir = (typeof process !== 'undefined' && process.env && (process.env.USERPROFILE || process.env.HOME)) || '';
      if (!homeDir || !fs || !path) return;
      const pDir = path.join(homeDir, '.gemini', 'antigravity', 'profiles');
      if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
      const curFile = path.join(pDir, 'quota_current.json');
      fs.writeFileSync(curFile, JSON.stringify(quotaState, null, 2), 'utf8');

      // 获取当前活跃 slot：优先从 vault_status_cache.json 读取（由 Companion 写入），
      // 兜底从 companion_sync.json（旧字段），最后尝试调用 AntigravityVault.exe
      let activeSlot = '';

      // 1) 尝试读 vault_status_cache.json（Companion 定期写入）
      const cacheFile = path.join(pDir, 'vault_status_cache.json');
      if (fs.existsSync(cacheFile)) {
        try {
          const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          activeSlot = cacheData.activeSlot || '';
        } catch (e) {}
      }

      // 2) 兜底：companion_sync.json
      if (!activeSlot) {
        const syncFile = path.join(pDir, 'companion_sync.json');
        if (fs.existsSync(syncFile)) {
          try {
            const syncData = JSON.parse(fs.readFileSync(syncFile, 'utf8'));
            activeSlot = syncData.activeSlot || '';
          } catch (e) {}
        }
      }

      // 3) 兜底：同步调用 AntigravityVault.exe status（最多等 800ms）
      if (!activeSlot && cp && typeof cp.spawnSync === 'function') {
        try {
          const binDir = path.join(homeDir, '.gemini', 'antigravity', 'bin');
          const vaultExe = path.join(binDir, 'AntigravityVault.exe');
          if (fs.existsSync(vaultExe)) {
            const result = cp.spawnSync(vaultExe, ['status'], { encoding: 'utf8', timeout: 800, windowsHide: true });
            if (result.stdout) {
              const m = result.stdout.match(/"activeSlot"\s*:\s*"([A-Da-d])"/);
              if (m) activeSlot = m[1].toUpperCase();
            }
          }
        } catch (e) {}
      }

      // 写入对应 slot 的快照文件（支持动态 N 仓与旧版 A/B/C/D）
      const safeSlot = String(activeSlot || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (safeSlot) {
        fs.writeFileSync(path.join(pDir, `quota_${safeSlot}.json`), JSON.stringify(quotaState, null, 2), 'utf8');
      }
    } catch (err) {}
  }

  // 监听 quota_trigger.json 触发文件与定时器
  let lastTriggerTime = 0;
  function initQuotaTriggerWatcher() {
    try {
      const homeDir = (typeof process !== 'undefined' && process.env && (process.env.USERPROFILE || process.env.HOME)) || '';
      if (!homeDir || !fs || !path) return;
      const pDir = path.join(homeDir, '.gemini', 'antigravity', 'profiles');
      const trigFile = path.join(pDir, 'quota_trigger.json');

      setInterval(() => {
        try {
          if (fs.existsSync(trigFile)) {
            const stat = fs.statSync(trigFile);
            if (stat.mtimeMs > lastTriggerTime) {
              lastTriggerTime = stat.mtimeMs;
              fetchAndPersistQuota(true);
            }
          }
        } catch (e) {}
      }, 500);

      // 启动后 2 秒立即自动主动拉取一次最新真实配额
      setTimeout(() => { fetchAndPersistQuota(false); }, 2000);
      // 后续每 90 秒自动静默轮询一次
      setInterval(() => { fetchAndPersistQuota(false); }, 90000);
    } catch (e) {}
  }

  function persistQuota() {
    if (quotaSaveTimer) clearTimeout(quotaSaveTimer);
    quotaSaveTimer = setTimeout(() => {
      persistQuotaImmediate();
    }, 500);
  }

  function isBadgeNode(node) {
    if (!node) return false;
    if (node.nodeType === Node.ELEMENT_NODE) {
      return !!(node.id === 'agy-i18n-toggle-badge' ||
                node.id === 'agy-vault-toggle-badge' ||
                node.id === 'agy-control-dock' ||
                node.id === 'agy-status-hud' ||
                (node.closest && (node.closest('#agy-i18n-toggle-badge') || node.closest('#agy-vault-toggle-badge') || node.closest('#agy-control-dock') || node.closest('#agy-status-hud'))));
    }
    const p = node.parentElement;
    return !!(p && p.closest && (p.closest('#agy-i18n-toggle-badge') || p.closest('#agy-vault-toggle-badge') || p.closest('#agy-control-dock') || p.closest('#agy-status-hud')));
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    const tag = parent.tagName;
    if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'KBD', 'SAMP'].includes(tag)) return true;
    if (parent.closest('pre, code, .terminal, .xterm, .monaco-editor, .prism-code, [data-terminal], [contenteditable="true"], .notranslate, [translate="no"]')) return true;
    return false;
  }

  function formatTranslationOutput(origTrimmed, zhText) {
    if (!zhText) return null;
    if (langMode === 'zh' || zhText === origTrimmed || /[\u4e00-\u9fa5]/.test(origTrimmed)) {
      return zhText;
    }
    if (zhText.includes(origTrimmed)) return zhText;
    return origTrimmed.length > 28 ? `${zhText} / ${origTrimmed}` : `${zhText} (${origTrimmed})`;
  }

  function translateText(text) {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return null;
    if (/^[A-Za-z]:[\\/]/.test(trimmed) || /^(https?|file|ws):\/\//.test(trimmed) || /^[0-9a-f]{16,}$/i.test(trimmed)) return null;
    if (Object.prototype.hasOwnProperty.call(DICTIONARY, trimmed)) {
      const out = formatTranslationOutput(trimmed, DICTIONARY[trimmed]);
      return out ? text.replace(trimmed, out) : null;
    }
    for (const item of REGEX_PATTERNS) {
      if (item.reg.test(trimmed)) {
        const zhText = trimmed.replace(item.reg, item.rep);
        const out = formatTranslationOutput(trimmed, zhText);
        return out ? text.replace(trimmed, out) : null;
      }
    }
    return null;
  }

  function processNode(node) {
    if (!node) return;
    const active = langMode !== 'en';
    if (node.nodeType === Node.TEXT_NODE) {
      if (isBadgeNode(node) || shouldSkipNode(node)) return;
      if (active) {
        // 若当前值既不等于上次记录的原文，也不等于插件写入的译文，说明 React 等框架已复用并修改了节点内容
        if (node.__agy_orig === undefined ||
            (node.nodeValue !== node.__agy_orig && node.nodeValue !== node.__agy_trans)) {
          node.__agy_orig = node.nodeValue;
          node.__agy_trans = undefined;
        }
        const orig = node.__agy_orig;
        sniffQuota(orig);
        const trans = translateText(orig);
        if (trans && node.nodeValue !== trans) {
          node.__agy_trans = trans;
          node.nodeValue = trans;
        } else if (!trans) {
          node.__agy_trans = undefined;
        }
        if (node.nodeValue) sniffQuota(node.nodeValue);
      } else if (node.__agy_orig !== undefined) {
        if (node.__agy_trans !== undefined && node.nodeValue === node.__agy_trans) {
          node.nodeValue = node.__agy_orig;
        } else if (node.nodeValue !== node.__agy_orig) {
          node.__agy_orig = node.nodeValue;
        }
        node.__agy_trans = undefined;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (isBadgeNode(node)) return;
      const attrs = ['title', 'aria-label', 'placeholder'];
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const val = node.getAttribute(attr);
        if (!val) continue;
        const origKey = 'data-agy-orig-' + attr;
        const transKey = 'data-agy-trans-' + attr;
        let orig = node.getAttribute(origKey);
        const prevTrans = node.getAttribute(transKey);
        if (orig === null || (val !== orig && val !== prevTrans)) {
          orig = val;
          if (active) {
            node.setAttribute(origKey, orig);
            node.removeAttribute(transKey);
          }
        }
        if (active) {
          sniffQuota(orig);
          const trans = translateText(orig);
          if (trans && val !== trans) {
            node.setAttribute(transKey, trans);
            node.setAttribute(attr, trans);
          }
          if (val) sniffQuota(val);
        } else if (prevTrans !== null && val === prevTrans && orig !== null) {
          node.setAttribute(attr, orig);
          node.removeAttribute(transKey);
        }
      }
    }
  }

  function walkDOM(root) {
    if (!root || applying) return;
    applying = true;
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
      let node;
      let guard = 0;
      while ((node = walker.nextNode())) {
        if (++guard > 200000) break;
        processNode(node);
      }
    } finally {
      applying = false;
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (applying) return;
    // Ignore our own controls: updating their titles must not retrigger upkeep.
    if (mutations.every((m) => isBadgeNode(m.target))) return;
    let needsWalk = null;
    const textTargets = [];
    const attrTargets = [];

    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];
      if (m.type === 'characterData') {
        if (!isBadgeNode(m.target)) textTargets.push(m.target);
      } else if (m.type === 'childList') {
        for (let j = 0; j < m.addedNodes.length; j++) {
          const added = m.addedNodes[j];
          if (isBadgeNode(added)) continue;
          if (added.nodeType === Node.ELEMENT_NODE) {
            if (!needsWalk) needsWalk = [];
            needsWalk.push(added);
          } else {
            textTargets.push(added);
          }
        }
      } else if (m.type === 'attributes') {
        if (!isBadgeNode(m.target)) attrTargets.push(m.target);
      }
    }

    applying = true;
    try {
      for (let i = 0; i < textTargets.length; i++) processNode(textTargets[i]);
      for (let i = 0; i < attrTargets.length; i++) processNode(attrTargets[i]);
    } finally {
      applying = false;
    }

    if (needsWalk) {
      for (let i = 0; i < needsWalk.length; i++) {
        const el = needsWalk[i];
        if (el.isConnected && !isBadgeNode(el)) walkDOM(el);
      }
    }

    ensureControlDock();
    ensureBadge();
    if (hasMultiVaultInstalled()) ensureVaultBadge();
  });

  function ensureControlDock() {
    if (!document.body) return null;
    if (!controlDock || !controlDock.isConnected) {
      const existing = document.getElementById('agy-control-dock');
      if (existing) {
        controlDock = existing;
      } else {
        controlDock = document.createElement('div');
        controlDock.id = 'agy-control-dock';
        controlDock.setAttribute('data-agy-i18n', '1');

        let savedPos = null;
        try {
          savedPos = JSON.parse(localStorage.getItem('agy_control_dock_pos') || 'null');
        } catch (e) {}

        if (savedPos && savedPos.left && savedPos.top) {
          controlDock.style.cssText = `position:fixed;left:${savedPos.left};top:${savedPos.top};z-index:2147483647;display:flex;align-items:center;gap:6px;user-select:none;pointer-events:auto;-webkit-app-region:no-drag;`;
        } else {
          controlDock.style.cssText = 'position:fixed;bottom:14px;left:80px;z-index:2147483647;display:flex;align-items:center;gap:6px;user-select:none;pointer-events:auto;-webkit-app-region:no-drag;';
        }

        // 自由拖拽机制 (Drag-and-Drop)
        let isDragging = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;

        controlDock.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          isDragging = true;
          dockHasMoved = false;
          startX = e.clientX;
          startY = e.clientY;
          const rect = controlDock.getBoundingClientRect();
          initialLeft = rect.left;
          initialTop = rect.top;
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          if (!dockHasMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            dockHasMoved = true;
          }
          if (dockHasMoved) {
            controlDock.style.bottom = 'auto';
            controlDock.style.right = 'auto';
            const maxL = Math.max(4, window.innerWidth - controlDock.offsetWidth - 4);
            const maxT = Math.max(4, window.innerHeight - controlDock.offsetHeight - 4);
            const newLeft = Math.max(4, Math.min(maxL, initialLeft + dx));
            const newTop = Math.max(4, Math.min(maxT, initialTop + dy));
            controlDock.style.left = newLeft + 'px';
            controlDock.style.top = newTop + 'px';
          }
        });

        window.addEventListener('mouseup', () => {
          if (!isDragging) return;
          isDragging = false;
          if (dockHasMoved) {
            try {
              localStorage.setItem('agy_control_dock_pos', JSON.stringify({
                left: controlDock.style.left,
                top: controlDock.style.top
              }));
            } catch (e) {}
            setTimeout(() => { dockHasMoved = false; }, 80);
          }
        });

        document.body.appendChild(controlDock);
      }
    }
    return controlDock;
  }

  function updateBadgeStyle(b) {
    if (!b) return;
    const text = langMode === 'zh' ? '中' : (langMode === 'bilingual' ? '双语' : 'EN');
    if (b.textContent !== text) b.textContent = text;
    const title = langMode === 'zh'
      ? '当前界面: 纯简体中文 (点击切换为中英双语对照)'
      : (langMode === 'bilingual'
          ? '当前界面: 中英文双语对照 (点击切换为英文原版)'
          : 'Current: English (Click to enable Chinese)');
    if (b.title !== title) b.title = title;
    const active = langMode !== 'en';
    const isLight = (detectCurrentTheme() === 'light');
    if (isLight) {
      b.style.background = 'rgba(255, 255, 255, 0.96)';
      b.style.border = '1px solid rgba(2, 132, 199, 0.5)';
      b.style.color = active ? '#0284c7' : '#64748b';
      b.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.12)';
    } else {
      b.style.background = 'rgba(26, 28, 35, 0.92)';
      b.style.border = '1px solid rgba(56, 189, 248, 0.4)';
      b.style.color = active ? '#38bdf8' : '#94a3b8';
      b.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    }
  }

  function ensureBadge() {
    if (!document.body) return;
    const dock = ensureControlDock();
    if (!badge || !badge.isConnected) {
      const existing = document.getElementById('agy-i18n-toggle-badge');
      if (existing) {
        badge = existing;
      } else {
        badge = document.createElement('div');
        badge.id = 'agy-i18n-toggle-badge';
        badge.setAttribute('data-agy-i18n', '1');
        badge.style.cssText = 'position:static;z-index:2147483647;border-radius:6px;padding:2px 9px;font-size:11px;font-weight:700;font-family:Segoe UI,system-ui,sans-serif;cursor:pointer;user-select:none;pointer-events:auto;transition:all 0.15s ease;display:flex;align-items:center;';
        badge.onclick = (e) => {
          if (dockHasMoved) return;
          e.preventDefault();
          e.stopPropagation();
          langMode = langMode === 'zh' ? 'bilingual' : (langMode === 'bilingual' ? 'en' : 'zh');
          try {
            localStorage.setItem('agy_i18n_mode', langMode === 'bilingual' ? 'bilingual_explicit' : langMode);
            localStorage.setItem('agy_chinese_plugin_enabled', langMode === 'en' ? 'false' : 'true');
          } catch (err) {}
          updateBadgeStyle(badge);
          walkDOM(document.body);
        };
      }
    }
    if (dock && badge.parentElement !== dock) {
      dock.insertBefore(badge, dock.firstChild);
    }
    updateBadgeStyle(badge);
  }

  function detectCurrentTheme() {
    try {
      const bodyClass = (document.body && document.body.className) || '';
      const htmlClass = (document.documentElement && document.documentElement.className) || '';
      if (bodyClass.includes('vscode-light') || bodyClass.includes('theme-light') || htmlClass.includes('light')) {
        return 'light';
      }
      if (bodyClass.includes('vscode-dark') || bodyClass.includes('theme-dark') || htmlClass.includes('dark')) {
        return 'dark';
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {}
    return 'dark';
  }

  let lastSavedTheme = '';
  function syncStateToVault() {
    try {
      if (!fs || !path) return;
      const theme = detectCurrentTheme();
      const home = (typeof process !== 'undefined' && process.env && (process.env.USERPROFILE || process.env.HOME)) || '';
      const pDir = path.join(home, '.gemini', 'antigravity', 'profiles');
      if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });

      const syncData = {
        theme: theme,
        top: (typeof window !== 'undefined' && typeof window.screenY === 'number') ? window.screenY : 80,
        right: (typeof window !== 'undefined' && typeof window.screenX === 'number' && typeof window.outerWidth === 'number') ? (window.screenX + window.outerWidth) : 1600,
        width: (typeof window !== 'undefined' && typeof window.outerWidth === 'number') ? window.outerWidth : 1200,
        height: (typeof window !== 'undefined' && typeof window.outerHeight === 'number') ? window.outerHeight : 800
      };
      fs.writeFileSync(path.join(pDir, 'companion_sync.json'), JSON.stringify(syncData), 'utf8');
      fs.writeFileSync(path.join(pDir, 'theme.json'), JSON.stringify({ theme }), 'utf8');
      lastSavedTheme = theme;
    } catch (e) {}
  }

  function updateVaultBadgeStyle() {
    if (!vaultBadge) return;
    if (vaultBadge.innerHTML !== '<span>⚡ 多仓</span>') {
      vaultBadge.innerHTML = '<span>⚡ 多仓</span>';
    }
    const title = '⚡ 多仓账号工作台 (点击秒级呼出 / 收回收缩)';
    if (vaultBadge.title !== title) vaultBadge.title = title;
    const isLight = (detectCurrentTheme() === 'light');
    if (isLight) {
      vaultBadge.style.background = 'rgba(255, 255, 255, 0.96)';
      vaultBadge.style.border = '1px solid rgba(16, 185, 129, 0.6)';
      vaultBadge.style.color = '#047857';
      vaultBadge.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.12)';
    } else {
      vaultBadge.style.background = 'rgba(26, 28, 35, 0.92)';
      vaultBadge.style.border = '1px solid rgba(52, 211, 153, 0.45)';
      vaultBadge.style.color = '#34d399';
      vaultBadge.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    }
  }

  // 全局事件捕获委托：无论 DOM 怎么被 SPA 框架重绘，只要点击到 #agy-vault-toggle-badge 必能 100% 触发呼出
  if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
      const b = e.target && e.target.closest && e.target.closest('#agy-vault-toggle-badge');
      if (b) {
        if (dockHasMoved) return;
        e.preventDefault();
        e.stopPropagation();
        triggerToggleVault();
      }
    }, true);
    document.addEventListener('dblclick', (e) => {
      const b = e.target && e.target.closest && e.target.closest('#agy-vault-toggle-badge');
      if (b) {
        if (dockHasMoved) return;
        e.preventDefault();
        e.stopPropagation();
        triggerToggleVault();
      }
    }, true);
  }

  let lastVaultToggleClick = 0;
  function triggerToggleVault() {
    const now = Date.now();
    // 350ms 防抖：如果用户连续点击或双击，保证只触发一次明确的呼出，避免瞬间连续翻转状态
    if (now - lastVaultToggleClick < 350) return;
    lastVaultToggleClick = now;

    // 给予即时的按钮按压动效
    const badge = document.getElementById('agy-vault-toggle-badge');
    if (badge) {
      badge.style.transform = 'scale(0.92)';
      setTimeout(() => {
        const b = document.getElementById('agy-vault-toggle-badge');
        if (b) b.style.transform = 'scale(1)';
      }, 150);
    }

    // 收集反重力界面的深浅色与窗口真实坐标
    const theme = detectCurrentTheme();
    const x = window.screenX || 0;
    const y = window.screenY || 0;
    const w = window.outerWidth || 0;
    const h = window.outerHeight || 0;

    // 通道一：主进程 IPC 通道（最高优先级，穿透沙盒并自带伴随拉起）
    try {
      if (typeof window !== 'undefined' && window.vaultAPI && typeof window.vaultAPI.toggle === 'function') {
        window.vaultAPI.toggle({ theme, x, y, w, h }).catch(() => {});
        return;
      }
    } catch(e) {}

    // 通道二：超高速本地 HTTP 通信（1ms直达常驻 Companion），失败时降级拉起进程
    syncStateToVault();
    const url = `http://127.0.0.1:28888/toggle?theme=${encodeURIComponent(theme)}&x=${x}&y=${y}&w=${w}&h=${h}&t=${now}`;
    fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' }).catch(() => {
      if (cp) {
        try {
          const scriptPath = getCompanionScriptPath();
          if (scriptPath) {
            const pyBin = (typeof process !== 'undefined' && process.platform === 'win32') ? 'pythonw' : 'python3';
            cp.spawn(pyBin, [scriptPath], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
            return;
          }
          const exe = getCompanionExePath();
          if (exe) {
            cp.spawn(exe, ['--toggle'], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
            return;
          }
        } catch (e) {}
      }
      try {
        const img = new Image();
        img.src = url;
      } catch (e) {}
    });
  }

  function ensureVaultBadge() {
    if (!document.body) return;
    const dock = ensureControlDock();
    if (!vaultBadge || !vaultBadge.isConnected) {
      const existing = document.getElementById('agy-vault-toggle-badge');
      if (existing) {
        vaultBadge = existing;
      } else {
        vaultBadge = document.createElement('div');
        vaultBadge.id = 'agy-vault-toggle-badge';
        vaultBadge.setAttribute('data-agy-i18n', '1');
        vaultBadge.style.cssText = 'position:static;z-index:2147483647;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:700;font-family:Segoe UI,system-ui,sans-serif;cursor:pointer;user-select:none;pointer-events:auto;-webkit-app-region:no-drag;transition:all 0.15s ease;display:flex;align-items:center;gap:3px;';
        vaultBadge.setAttribute('onclick', "try{if(window.vaultAPI){window.vaultAPI.toggle();}fetch('http://127.0.0.1:28888/toggle?t='+Date.now(),{mode:'no-cors'}).catch(()=>{});}catch(e){}");

        vaultBadge.onmouseenter = () => {
          vaultBadge.style.borderColor = 'rgba(52,211,153,0.85)';
          const isLight = (detectCurrentTheme() === 'light');
          vaultBadge.style.background = isLight ? 'rgba(243,244,246,1)' : 'rgba(32,36,48,0.98)';
          vaultBadge.style.boxShadow = '0 0 10px rgba(52,211,153,0.3)';
        };
        vaultBadge.onmouseleave = () => {
          updateVaultBadgeStyle();
        };
        vaultBadge.onclick = (e) => {
          if (dockHasMoved) return;
          e.preventDefault();
          e.stopPropagation();
          triggerToggleVault();
        };
        vaultBadge.ondblclick = (e) => {
          if (dockHasMoved) return;
          e.preventDefault();
          e.stopPropagation();
          triggerToggleVault();
        };
      }
    }
    if (dock && vaultBadge.parentElement !== dock) {
      dock.appendChild(vaultBadge);
    }
    updateVaultBadgeStyle();
  }

  let vaultServiceOnline = false;

  function getCompanionScriptPath() {
    try {
      if (!fs || !path) return null;
      const envScript = (typeof process !== 'undefined' && process.env && process.env.AGY_MULTI_VAULT_SCRIPT) || '';
      if (envScript && fs.existsSync(envScript)) return envScript;
      const home = (typeof process !== 'undefined' && process.env && (process.env.USERPROFILE || process.env.HOME)) || '';
      if (!home) return null;
      const candidates = [
        path.join(home, '.gemini', 'config', 'skills', 'antigravity-multi-vault', 'scripts', 'companion_app.py'),
        path.join(home, '.claude', 'skills', 'antigravity-multi-vault', 'scripts', 'companion_app.py'),
        path.join(home, '.codex', 'skills', 'antigravity-multi-vault', 'scripts', 'companion_app.py')
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
      }
    } catch (e) {}
    return null;
  }

  function getCompanionExePath() {
    try {
      if (!fs || !path) return null;
      const envExe = (typeof process !== 'undefined' && process.env && process.env.AGY_COMPANION_EXE) || '';
      if (envExe && fs.existsSync(envExe)) return envExe;
      const home = (typeof process !== 'undefined' && process.env && (process.env.USERPROFILE || process.env.HOME)) || '';
      const candidates = [
        home ? path.join(home, '.gemini', 'antigravity', 'bin', 'AntigravityCompanion.exe') : ''
      ].filter(Boolean);
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) return candidate;
      }
    } catch (e) {}
    return null;
  }

  function hasMultiVaultInstalled() {
    if (vaultServiceOnline) return true;
    try {
      if (getCompanionScriptPath() || getCompanionExePath()) return true;
      if (fs && path) {
        const home = (typeof process !== 'undefined' && process.env && (process.env.USERPROFILE || process.env.HOME)) || '';
        if (home) {
          const pDir = path.join(home, '.gemini', 'antigravity', 'profiles');
          if (fs.existsSync(path.join(pDir, 'registry.json')) || fs.existsSync(path.join(pDir, 'profile_a.dat'))) {
            return true;
          }
        }
      }
    } catch (e) {}
    return false;
  }

  function probeVaultServiceOnce() {
    try {
      fetch('http://127.0.0.1:28888/status', { method: 'GET', cache: 'no-store' })
        .then((res) => (res && res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.ok) {
            vaultServiceOnline = true;
            ensureVaultBadge();
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  let companionStarted = false;
  function ensureCompanionRunning() {
    if (companionStarted) return;
    try {
      if (!cp) return;
      const exe = getCompanionExePath();
      if (!exe) return;

      cp.exec('tasklist /FI "IMAGENAME eq AntigravityCompanion.exe"', (err, stdout) => {
        if (stdout && stdout.includes('AntigravityCompanion.exe')) {
          companionStarted = true;
          return;
        }
        try {
          const child = cp.spawn(exe, [], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });
          child.unref();
          companionStarted = true;
        } catch (spawnErr) {}
      });
    } catch (e) {}
  }

  function start() {
    if (!document.body) {
      setTimeout(start, 100);
      return;
    }
    if (langMode !== 'en') walkDOM(document.body);
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label', 'placeholder']
    });
    ensureControlDock();
    ensureBadge();
    if (hasMultiVaultInstalled()) {
      ensureVaultBadge();
      ensureCompanionRunning();
    } else {
      probeVaultServiceOnce();
    }
    initQuotaTriggerWatcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

/**
 * =========================================================================
 * Antigravity 全局文件拖拽与路径/链接自动注入增强器 (File Drop & Path/Link Autofill Enhancer)
 * 彻底解决原生客户端对 .txt、代码文件及各类文档拖拽出现 🚫 禁止图标或无法识别的痛点。
 * 拖入任意文件即自动提取本地磁盘绝对路径/文件链接并安全填入对话输入框，零卡死、零失焦。
 * =========================================================================
 */