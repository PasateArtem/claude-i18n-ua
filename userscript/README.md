# Claude i18n Tampermonkey 试验版

这是给 Firefox Desktop + Tampermonkey 准备的实验性单文件版本。它不替代 Chrome / Edge 扩展，也暂不承诺 Safari、Violentmonkey、Greasemonkey 兼容。

## 安装

1. 在 Firefox Desktop 安装 Tampermonkey。
2. 打开 Tampermonkey Dashboard，创建新脚本。
3. 用 `userscript/claude-i18n.user.js` 的内容替换默认模板并保存。
4. 打开或刷新 `https://claude.ai`。

## 调试

- 打开 DevTools Console，确认出现 `[claude-i18n][hook] hook.installed`。
- 在 Console 查看 `window.__CLAUDE_ARRAY_PROXY_REPORT__`。
- 选择中文后，`i18nRedirectHits`、`i18nCacheHits`、`requestLocaleRewriteHits`、`responseLocaleRewriteHits` 等计数应有增长。

## 已知限制

- 首版只按 Firefox Desktop + Tampermonkey 验证。
- userscript 必须足够早地注入页面主世界；如果语言菜单没有出现中文，先刷新页面再看 Console 日志。
- 语言包仍从 `https://claude-i18n.vercel.app` 拉取，并通过 Tampermonkey 的 GM storage 做本地缓存。
