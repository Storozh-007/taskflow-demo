# TaskFlow

Навчальний PWA-застосунок: Vue 3, Framework7 та Vite.
Практична робота №6: централізоване керування станом через Pinia — сховища завдань і проєктів, фільтр за проєктом, статистика через getters.

Застосунок: https://taskflow-demo.kpidanil.workers.dev

Репозиторій: https://github.com/Storozh-007/taskflow-demo

Попередні версії збережено тегами `kp2-3-complete`, `kp2-4-complete`, `kp2-5-complete`, `kp2-6-complete`.

## Що реалізовано (практична №6)

1. **Pinia** підключено в `src/main.js` (`app.use(createPinia())`); `Framework7.use()` та `registerComponents()` збережено.
2. **`src/store/tasks.js`** — `useTasksStore`: state (`tasks`, фільтри, сортування), getters (`totalTasks`, `completedTasks`, `progressTasks`, `visibleTasks`, `activeTasks`…), actions (`addTask`, `updateTask`, `deleteTask`, `setTaskStatus`, `setTaskPriority`, `resetFilters`).
3. **`src/store/projects.js`** (новий) — `useProjectsStore`: каталог із трьох проєктів, `addProject()` з перевіркою довжини та унікальності, getters `projectTitle(id)`, `projectCount`, `projectStats`.
4. **`TaskForm.vue`** — вибір проєкту; **`TaskListControls.vue`** — фільтр за проєктом; **`TaskCard.vue`** — показ назви проєкту.
5. **`TasksPage.vue`** і **`HomePage.vue`** читають дані через `storeToRefs()`; локальними `ref()` залишено лише `showForm`, `editingId` і поле назви нового проєкту.
6. Дані, як і раніше, лише в пам'яті: після F5 повертаються демонстраційні записи (IndexedDB — у наступній роботі).

### Додаткові завдання (1–6)

| № | Завдання | Де реалізовано |
|---|----------|----------------|
| 1 | Getter `projectStats` | `useProjectsStore` |
| 2 | Блок «Проєкти» на головній: назва та кількість невиконаних | `HomePage.vue` |
| 3 | Відсоток виконання проєкту (0 % за порожнього проєкту) | `projectStats.percent` |
| 4 | Action групового переведення запланованих завдань проєкту в «У роботі» з підтвердженням | `startProjectTasks()`, `TasksPage.vue` |
| 5 | Фільтр «Лише без терміну» у state та `visibleTasks` | `onlyNoDate` |
| 6 | Перевірка стану Pinia (`$pinia.state`) | див. звіт |

Із практичної №5 збережено: пошук, статус, пріоритет, сортування, «Тільки невиконані», видалення з підтвердженням.

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
