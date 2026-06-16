<div align="center">

<img src="extension/assets/logo.512x.png" width="120" alt="Claude Ukrainian Logo" />

# Claude Ukrainian

**Українська локалізація інтерфейсу Claude.ai**

[![Версія](https://img.shields.io/badge/версія-1.0.0-orange)](https://github.com/PasateArtem/claude-i18n-ua)
[![Ліцензія](https://img.shields.io/badge/ліцензія-MIT-blue)](LICENSE)
[![Платформа](https://img.shields.io/badge/платформа-Chrome-green)](https://chrome.google.com/webstore)

</div>

## Про проєкт

Розширення для Chrome, що додає повноцінний українськомовний інтерфейс до Claude.ai — без проксі, без зміни налаштувань акаунту.

**15 358 перекладених рядків** — повне покриття UI.

## Встановлення

### Chrome Web Store
*(незабаром)*

### Вручну (для розробників)
1. Завантажте репозиторій або ZIP
2. Відкрийте `chrome://extensions`
3. Увімкніть **Режим розробника**
4. Натисніть **Завантажити розпаковане розширення** → вкажіть папку `extension/`
5. Відкрийте [claude.ai](https://claude.ai) — інтерфейс буде українською

## Як це працює

Розширення перехоплює запити Claude.ai до файлів локалізації та підміняє англійські рядки українськими. Переклад завантажується з CDN і кешується локально.

```
hook.js    — перехоплює fetch-запити до /i18n/
script.js  — міст між сторінкою та service worker
service.js — завантажує та кешує uk-UA.json
```

## Ліцензія

MIT
