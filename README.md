# TaskFlow

Навчальний PWA-застосунок за КП 2/5: Vue 3, Framework7 та Vite.

Картки завдань із датами, статусами й пріоритетами, циклічне перемикання через Props/Emits, фільтри та спільний реактивний store. HomePage і TasksPage показують узгоджені дані. Початково: 6 завдань, 2 у роботі, 2 виконано, 2 заплановано; виконання 33%.

Додаткові завдання: показник «Заплановано», TaskCounter з числовим prop і процент виконання. Зміни діють у поточному сеансі та скидаються після перезавантаження. LocalStorage і серверне зберігання не використовуються на цьому занятті.

Попередні версії збережено тегами `kp2-3-complete` та `kp2-4-complete`.

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
- `src/data/tasks.js` — шість початкових демонстраційних завдань.
- `src/components/AppTabbar.vue` — спільна нижня навігація, prop `active` виділяє поточну сторінку.
- `src/components/TaskCard.vue` — картка із prop `task` та подіями `status-change` / `priority-change`.
- `src/components/StatusBadge.vue`, `PriorityBadge.vue` — підписи та кольори статусів і пріоритетів.
- `src/components/TaskCounter.vue` — кількість знайдених записів через prop `count`.
- `src/store/tasks.js` — спільний реактивний стан і функції зміни з перевіркою допустимих значень.
- `src/pages/` — HomePage, TasksPage, AboutPage та HelpPage.
- `src/css/app.css` — спільні адаптивні стилі та навігація.
- `src/css/task-components.css` — темне оформлення карток, фільтрів і статистики.
- `public/icons/`, `scripts/generate-icons.mjs` — PWA-іконки; PNG генеруються перед збіркою.
- `vite.config.js` — збірка, Web App Manifest і кешування Workbox.
- `wrangler.jsonc` — Cloudflare Workers Static Assets із SPA fallback.

Додавання і видалення завдань не входять до цієї роботи. Статуси та пріоритети змінюються у спільному store без зміни Props у дочірньому компоненті.

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

## Перевірка КП 2/5

1. На головній перевірити 6 завдань, 2 у роботі, 2 виконано, 2 заплановано та 33%.
2. Кнопка статусу: Заплановано → У роботі → Виконано → Заплановано.
3. Кнопка пріоритету: Низький → Середній → Високий → Низький.
4. На Завданнях вибрати У роботі + Високий: лишається «Створити індикатор статусу».
5. Натиснути Завершити: вибірка порожня, лічильник 0. На головній 6/1/3/2 та 50%.
6. Змінити пріоритет на головній і перевірити той самий запис у списку; обидві сторінки використовують один store.
7. Перезавантажити сторінку: початкові 6/2/2/2 відновлюються.
8. Перевірити ширини 320/375/768 px та офлайн після першого онлайн-відкриття.
