# TaskFlow

Навчальний PWA-застосунок: Vue 3, Framework7 та Vite.
Практична робота №7: постійне локальне зберігання завдань і проєктів у IndexedDB (бібліотека idb) з інтеграцією до Pinia.

Застосунок: https://taskflow-demo.kpidanil.workers.dev

Репозиторій: https://github.com/Storozh-007/taskflow-demo

Попередні версії збережено тегами `kp2-3-complete`, `kp2-4-complete`, `kp2-5-complete`, `kp2-6-complete`.

## Що реалізовано (практична №7)

1. **`src/services/database.js`** — база `taskflow-db` (версія 1) зі сховищами `tasks` (ключ `id`), `projects` (ключ `id`), `metadata`; читання знімка в одній `readonly`-транзакції та атомарний запис у `readwrite`-транзакції з явним `abort()` у разі помилки.
2. **`src/services/persistence.js`** — hydration через `$patch()` до монтування, одноразовий запис демонстраційних даних (прапорець `initialized`), `$subscribe()` на обох сховищах Pinia (зберігаються лише `tasks`, `projects`, `nextProjectId`; фільтри — ні), черга записів, стани `loading / saving / saved / error`, повторна спроба.
3. **`src/main.js`** — `bootstrap()`: Pinia → відновлення з IndexedDB → `app.mount()`.
4. **`TasksPage.vue`** — індикатор «Локальне збереження», кнопка «Повторити збереження», час останнього збереження, експорт та імпорт JSON.
5. **`src/css/persistence.css`** — оформлення індикатора (світла й темна теми, адаптивність).
6. Сховища Pinia (`store/tasks.js`, `store/projects.js`) не змінювалися.

### Додаткові завдання (1–6)

| № | Завдання | Де реалізовано |
|---|----------|----------------|
| 1 | Експорт JSON | `TasksPage.vue`, `buildExport()` |
| 2 | Імпорт JSON з перевіркою структури та підтвердженням | `validateSnapshot()`, `replaceAllData()` |
| 3 | Точкове видалення запису методом `delete()` | `deleteRecord()` у `database.js` |
| 4 | `lastSavedAt` у `metadata` та на сторінці | `writeSnapshot()`, `TasksPage.vue` |
| 5 | Сторінка «Налаштування» (лічильники з IndexedDB) | `SettingsPage.vue`, маршрут `/settings/` |
| 6 | Синхронізація двох вкладок через BroadcastChannel | `persistence.js` |

Із практичних №5–6 збережено пошук, фільтри, сортування, проєкти, статистику й видалення з підтвердженням.

## Запуск та тестування

```sh
npm ci
npm run dev
```

Юніт-тести сховища (Node.js Test Runner):

```sh
npm test
```

Production-збірка та локальний попередній перегляд:

```sh
npm run build
npm run preview
```

## Структура каталогу src

```text
src/
├── components/
│   ├── AppTabbar.vue
│   ├── PriorityBadge.vue
│   ├── StatusBadge.vue
│   ├── TaskCard.vue            # Оновлено (projectTitle)
│   ├── TaskCounter.vue
│   ├── TaskForm.vue            # Оновлено (практична №5)
│   └── TaskListControls.vue    # Створено (практична №5)
├── css/
│   ├── app.css
│   ├── task-components.css
│   └── task-list.css           # Створено (практична №5)
├── data/
│   └── tasks.js
├── pages/
│   ├── AboutPage.vue
│   ├── HelpPage.vue
│   ├── HomePage.vue
│   └── TasksPage.vue           # Оновлено (практична №5)
├── services/                   # database.js, persistence.js (IndexedDB)
├── store/
│   └── tasks.js                # Оновлено (практична №5)
├── App.vue
├── main.js
└── routes.js
tests/
└── store.test.mjs
```

## Автоматична публікація з GitHub

Cloudflare Workers Builds підключено до репозиторію `Storozh-007/taskflow-demo`.
- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Після `git push origin main` Cloudflare збирає проєкт і автоматично оновлює PWA на https://taskflow-demo.kpidanil.workers.dev.
