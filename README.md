# TaskFlow

Навчальний PWA-застосунок: Vue 3, Framework7 та Vite.
Практична робота №5: Керування списком завдань — видалення, зміна статусів, пошук, комбінована фільтрація та сортування.

Застосунок: https://taskflow-demo.kpidanil.workers.dev

Репозиторій: https://github.com/Storozh-007/taskflow-demo

Попередні версії збережено тегами `kp2-3-complete`, `kp2-4-complete`, `kp2-5-complete`, `kp2-6-complete`.

## Що реалізовано (практична №5)

1. **Спільне реактивне сховище `src/store/tasks.js`** — `addTask()`, `updateTask()`, `deleteTask()` (`findIndex()` + `splice()`), `setTaskStatus()`, `setTaskPriority()`. Дані зберігаються лише в пам'яті; після F5 повертаються 6 демонстраційних завдань із `src/data/tasks.js`.
2. **`TaskForm.vue`** — форма створення та редагування з локальною копією стану (`reactive()` + `watch`), перевіркою введення та подіями `save` / `cancel`.
3. **`TaskListControls.vue`** (новий) — пошук за назвою й описом, фільтри за статусом і пріоритетом, сортування. Не містить масиву завдань: значення надходять через Props, зміни повертаються подіями `update:*`.
4. **`TaskCard.vue`** — події `edit` і `delete`, кнопки показуються при `editable`.
5. **`TasksPage.vue`** — обчислюваний `visibleTasks` (`filter()` створює новий масив, `sort()` застосовується до копії), видалення з підтвердженням `window.confirm()`, скидання фільтрів, порожні стани.
6. **`src/css/task-list.css`** (новий) — адаптивне оформлення панелей, форми й кнопок (світла та темна теми).

### Додаткові завдання (1–6)

| № | Завдання | Де реалізовано |
|---|----------|----------------|
| 1 | Кнопка «Тільки невиконані» разом з іншими умовами | `TaskListControls.vue`, `visibleTasks` |
| 2 | Сортування за статусом: У роботі → Заплановано → Виконано | `TasksPage.vue` (`statusWeight`) |
| 3 | Частка виконаних серед знайдених завдань (%) | `donePercent` біля лічильника |
| 4 | Кнопка «Очистити пошук» лише за непорожнього тексту | `TaskListControls.vue` (`v-if="search.trim()"`) |
| 5 | Окреме пояснення, коли видалено всі завдання | `TasksPage.vue` (`data-testid="empty-all"`) |
| 6 | Сортування за терміном у зворотному порядку; порожні дати — в кінці | `dueDateDesc` |

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
│   ├── TaskCard.vue            # Оновлено (edit, delete)
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
