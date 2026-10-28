# TaskFlow

Навчальний PWA-застосунок за КП 2–3: Vue 3, Framework7 та Vite.

Застосунок: https://taskflow-demo.kpidanil.workers.dev

Репозиторій: https://github.com/Storozh-007/taskflow-demo

## Запуск

```sh
npm ci
npm run dev
```

## Production і офлайн-перевірка

```sh
npm run build
npm run preview
```

Відкрити адресу з термінала. Service Worker працює у production-збірці на localhost або HTTPS. Після першого завантаження можна вимкнути мережу й оновити сторінку. Для встановлення використати звичайне вікно Chrome: режим інкогніто не підтримує встановлення PWA.

## Структура

- `src/main.js` — ініціалізація Vue і Framework7.
- `src/App.vue` — кореневий застосунок та головний View.
- `src/routes.js` — маршрути `/` і `/about/`.
- `src/data/tasks.js` — чотири демонстраційні завдання.
- `src/components/TaskCard.vue` — картка, що отримує завдання через prop `task`.
- `src/pages/` — головна сторінка та інформація про застосунок.
- `src/css/app.css` — адаптивні стилі.
- `public/icons/`, `scripts/generate-icons.mjs` — PWA-іконки; PNG генеруються перед збіркою.
- `vite.config.js` — збірка, Web App Manifest і кешування Workbox.
- `wrangler.jsonc` — Cloudflare Workers Static Assets із SPA fallback.

Завдання демонстраційні: додавання, редагування та серверне зберігання не входять до цієї роботи.

## Публікація

```sh
npx wrangler login
npm run deploy
```

Для Workers Builds: production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy`, root directory — корінь цього проєкту. Назва Worker: `taskflow-demo`.

Конфігурація статичних ресурсів: https://developers.cloudflare.com/workers/static-assets/

`node_modules`, `dist`, `.env*`, `.dev.vars*` і `.wrangler` не додаються до Git; `package-lock.json` зберігається.
