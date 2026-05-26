# Claude i18n Userscript 试验版

这是给非 Chromium 浏览器准备的实验性用户脚本版本。它不替代 Chrome / Edge 扩展；Firefox 优先支持 Tampermonkey 与 Violentmonkey，Greasemonkey 为 best-effort 实验支持；Safari 目前只验证 macOS Safari + Userscripts App。

## Firefox 安装

1. 在 Firefox Desktop 安装 Tampermonkey、Violentmonkey 或 Greasemonkey。
2. 打开脚本管理器的 Dashboard，创建新脚本。
3. 用 `userscript/claude-i18n.user.js` 的内容替换默认模板并保存。
4. 打开或刷新 `https://claude.ai`。

## Safari 安装（实验性）

1. 在 macOS Safari 安装 Userscripts App，并在 Safari 扩展设置中启用。
2. 允许 Userscripts 访问 `claude.ai`，推荐测试时允许所有网站。
3. 添加 `userscript/claude-i18n.safari.user.js` 并启用脚本。
4. 打开或刷新 `https://claude.ai`。

## 调试

- 打开 DevTools Console，确认出现 `[claude-i18n][hook] hook.installed`。
- 在 Console 查看 `window.__CLAUDE_ARRAY_PROXY_REPORT__`。
- 选择中文后，`i18nRedirectHits`、`i18nCacheHits`、`requestLocaleRewriteHits`、`responseLocaleRewriteHits` 等计数应有增长。

## 已知限制

- Safari 版仅面向 macOS Safari + Userscripts App；iOS / iPadOS 暂未验证。
- Safari Web Extension / Xcode 包装暂不支持，后续如果需要正式分发再单独适配。
- Greasemonkey 使用 GM4 Promise API，当前为 best-effort 实验支持；如果页面主世界注入被拦截，语言菜单可能不会出现中文。
- userscript 必须足够早地注入页面主世界；如果语言菜单没有出现中文，先刷新页面再看 Console 日志。
- Firefox 版语言包通过脚本管理器的 GM storage 做本地缓存；Safari 版优先使用 Cache Storage，失败后回退到 localStorage。
