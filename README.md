# TaskFlow

Навчальний PWA-застосунок за КП 2/4: Vue 3, Framework7 та Vite.

Головна зі статистикою та останніми завданнями, окрема сторінка завдань, інформація про застосунок і довідка. Дані демонстраційні: 4 завдання, 2 виконані, 2 очікують виконання. Спільна нижня панель використовує маршрути Framework7. Додаткові завдання: HelpPage та обчислюваний показник «Очікує виконання».

Попередню версію КП 2–3 збережено тегом `kp2-3-complete`.

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
- `src/routes.js` — маршрути `/`, `/tasks/`, `/about/`, `/help/`.
- `src/data/tasks.js` — чотири демонстраційні завдання.
- `src/components/AppTabbar.vue` — спільна нижня навігація, prop `active` виділяє поточну сторінку.
- `src/components/TaskCard.vue` — збережений компонент попередньої КП 2–3, у нових сторінках не використовується.
- `src/pages/` — HomePage, TasksPage, AboutPage та HelpPage.
- `src/css/app.css` — адаптивні стилі.
- `public/icons/`, `scripts/generate-icons.mjs` — PWA-іконки; PNG генеруються перед збіркою.
- `vite.config.js` — збірка, Web App Manifest і кешування Workbox.
- `wrangler.jsonc` — Cloudflare Workers Static Assets із SPA fallback.

Завдання демонстраційні: додавання, редагування та серверне зберігання не входять до цієї роботи.

## Автоматична публікація з GitHub

Cloudflare Workers Builds підключено до `Storozh-007/taskflow-demo`.

- Production branch: `main`.
- Root directory: `/` (корінь репозиторію).
- Build command: `npm run build`.
- Deploy command: `npx wrangler deploy`.
- Preview command: `npx wrangler preview`.

Після `git push origin main` Cloudflare встановлює залежності, збирає PWA та публікує нову версію. Результат доступний у Workers & Pages → taskflow-demo → Deployments та у перевірках коміту на GitHub.

## Ручна публікація

```sh
npx wrangler login
npm run deploy
```

Для Workers Builds: production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy`, root directory — корінь цього проєкту. Назва Worker: `taskflow-demo`.

Конфігурація статичних ресурсів: https://developers.cloudflare.com/workers/static-assets/

`node_modules`, `dist`, `.env*`, `.dev.vars*` і `.wrangler` не додаються до Git; `package-lock.json` зберігається.

## Перевірка КП 2/4

На головній: 4 загалом, 2 виконано, 2 очікують виконання; останні записи в порядку 4, 3, 2. У списку всі 4 завдання. Перевірити три пункти нижньої панелі, кнопки головної, іконку інформації, довідку та повернення. Контрольні ширини: 320, 375, 768 px. PWA-іконки та шрифт Framework7 Icons кешуються для офлайн-роботи.
