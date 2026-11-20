import { reactive } from 'vue'
import { useTasksStore } from '../store/tasks.js'
import { useProjectsStore } from '../store/projects.js'
import { readSnapshot, writeSnapshot } from './database.js'

export const persistenceState = reactive({
  status: 'loading', // loading | saving | saved | error
  error: '',
  canRetry: false,
  lastSavedAt: null,
})

let taskStore = null
let projectStore = null
let enabled = false
let writing = false
let revision = 0
let savedRevision = 0
let lastRequestedSnapshot = ''
let scheduled = false
let channel = null

// JSON-серіалізація перетворює реактивні об'єкти Pinia на звичайні дані.
function makeSnapshot() {
  return JSON.parse(JSON.stringify({
    tasks: taskStore.tasks,
    projects: projectStore.projects,
    nextProjectId: projectStore.nextProjectId,
  }))
}

// Перевірка формату даних, що прочитані з бази або імпортовані з файлу.
export function validateSnapshot(data) {
  const statuses = ['todo', 'progress', 'done']
  const priorities = ['low', 'medium', 'high']
  if (!data || typeof data !== 'object') return 'Файл не містить об’єкта з даними.'
  if (!Array.isArray(data.tasks) || !Array.isArray(data.projects)) {
    return 'Потрібні масиви tasks і projects.'
  }

  const projectIds = new Set()
  for (const project of data.projects) {
    if (!project || typeof project.id !== 'string' || !project.id) return 'Проєкт без текстового id.'
    if (typeof project.title !== 'string' || !project.title.trim()) return `Проєкт «${project.id}» без назви.`
    if (projectIds.has(project.id)) return `Дубльований id проєкту: ${project.id}.`
    projectIds.add(project.id)
  }

  const taskIds = new Set()
  for (const task of data.tasks) {
    if (!task || !Number.isInteger(task.id)) return 'Завдання без цілого числового id.'
    if (taskIds.has(task.id)) return `Дубльований id завдання: ${task.id}.`
    taskIds.add(task.id)
    if (typeof task.title !== 'string' || task.title.trim().length < 3) return `Завдання ${task.id}: некоректна назва.`
    if (!statuses.includes(task.status)) return `Завдання ${task.id}: некоректний статус.`
    if (!priorities.includes(task.priority)) return `Завдання ${task.id}: некоректний пріоритет.`
    if (task.description != null && typeof task.description !== 'string') return `Завдання ${task.id}: некоректний опис.`
    if (task.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) return `Завдання ${task.id}: некоректна дата.`
    if (!projectIds.has(task.projectId)) return `Завдання ${task.id}: проєкт «${task.projectId}» не існує.`
  }
  return ''
}

function computeNextProjectId(projects, stored) {
  const calculated = Math.max(
    0,
    ...projects.map((project) => {
      const match = /^project-(\d+)$/.exec(String(project.id))
      return match ? Number(match[1]) : 0
    }),
  ) + 1
  return Number.isSafeInteger(stored) && stored >= calculated ? stored : calculated
}

// IndexedDB повертає записи в порядку ключів, тому порядок каталогу відновлюємо явно:
// спочатку стандартні проєкти, далі створені користувачем за номером project-N.
const defaultProjectOrder = ['general', 'study', 'personal']
export function sortProjects(projects) {
  const weight = (project) => {
    const index = defaultProjectOrder.indexOf(project.id)
    if (index !== -1) return [0, index]
    const match = /^project-(\d+)$/.exec(String(project.id))
    return [1, match ? Number(match[1]) : Number.MAX_SAFE_INTEGER]
  }
  return [...projects].sort((a, b) => {
    const [ga, na] = weight(a)
    const [gb, nb] = weight(b)
    return ga - gb || na - nb || String(a.id).localeCompare(String(b.id))
  })
}

// Відновлюємо стан обох сховищ зі знімка (hydration через $patch()).
function applySnapshot(snapshot) {
  projectStore.$patch({
    projects: sortProjects(snapshot.projects),
    nextProjectId: computeNextProjectId(snapshot.projects, snapshot.nextProjectId),
  })
  taskStore.$patch({ tasks: snapshot.tasks })
}

// В один момент часу виконуємо не більш як один запис в IndexedDB.
async function flushChanges() {
  if (!enabled || writing) return
  writing = true

  try {
    while (savedRevision < revision) {
      const targetRevision = revision
      const snapshot = makeSnapshot()

      try {
        const savedAt = await writeSnapshot(snapshot)
        savedRevision = targetRevision
        persistenceState.lastSavedAt = new Date(savedAt)
        channel?.postMessage({ type: 'saved' })
      } catch (error) {
        console.error('TaskFlow: збереження не вдалося:', error)
        persistenceState.status = 'error'
        persistenceState.error = 'Зміни поки що залишилися лише в пам’яті.'
        persistenceState.canRetry = true
        return
      }
    }

    persistenceState.status = 'saved'
    persistenceState.error = ''
    persistenceState.canRetry = false
  } finally {
    writing = false
  }
}

function requestSave(force = false) {
  if (!enabled) return
  const fingerprint = JSON.stringify(makeSnapshot())
  if (!force && fingerprint === lastRequestedSnapshot) return
  lastRequestedSnapshot = fingerprint
  revision += 1
  persistenceState.status = 'saving'
  persistenceState.error = ''
  persistenceState.canRetry = false
  void flushChanges()
}

// Об'єднуємо синхронні зміни й не записуємо зміни лише у фільтрах.
function onStoreChanged() {
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    requestSave()
  })
}

// Кнопка повторної спроби використовується тільки після помилки запису.
export function retrySave() {
  if (!enabled || persistenceState.status !== 'error') return
  requestSave(true)
}

// Додаткове завдання 2: заміна даних імпортованим знімком (після перевірки формату).
export function replaceAllData(data) {
  const problem = validateSnapshot(data)
  if (problem) return problem
  applySnapshot({ tasks: data.tasks, projects: data.projects, nextProjectId: undefined })
  requestSave(true)
  return ''
}

// Додаткове завдання 1: дані для експорту (без паролів і токенів — їх у застосунку немає).
export function buildExport() {
  return {
    app: 'TaskFlow',
    exportedAt: new Date().toISOString(),
    ...makeSnapshot(),
  }
}

// Додаткове завдання 6: друга вкладка отримує сповіщення і перечитує базу.
async function onChannelMessage(event) {
  if (event.data?.type !== 'saved' || !enabled) return
  // Якщо у цій вкладці є незбережені зміни, не перезаписуємо їх чужими.
  if (writing || savedRevision < revision || scheduled) return
  try {
    const snapshot = await readSnapshot()
    if (!snapshot.initialized || validateSnapshot(snapshot)) return
    applySnapshot(snapshot)
    lastRequestedSnapshot = JSON.stringify(makeSnapshot())
    persistenceState.lastSavedAt = snapshot.lastSavedAt ? new Date(snapshot.lastSavedAt) : null
  } catch (error) {
    console.error('TaskFlow: не вдалося синхронізувати з іншою вкладкою:', error)
  }
}

// Зупиняє фонові механізми (канал, запис); використовується в тестах.
export function stopPersistence() {
  channel?.close()
  channel = null
  enabled = false
  writing = false
  scheduled = false
  revision = 0
  savedRevision = 0
  lastRequestedSnapshot = ''
  persistenceState.status = 'loading'
  persistenceState.error = ''
  persistenceState.canRetry = false
  persistenceState.lastSavedAt = null
}

export async function initializePersistence(pinia) {
  taskStore = useTasksStore(pinia)
  projectStore = useProjectsStore(pinia)

  try {
    const snapshot = await readSnapshot()

    if (snapshot.initialized) {
      if (!Array.isArray(snapshot.tasks) || !Array.isArray(snapshot.projects)) {
        throw new Error('Некоректний формат локальних даних.')
      }
      applySnapshot(snapshot)
      persistenceState.lastSavedAt = snapshot.lastSavedAt ? new Date(snapshot.lastSavedAt) : null
    } else {
      // Демонстраційні дані записуємо тільки під час першого запуску.
      const savedAt = await writeSnapshot(makeSnapshot())
      persistenceState.lastSavedAt = new Date(savedAt)
    }

    persistenceState.status = 'saved'
    lastRequestedSnapshot = JSON.stringify(makeSnapshot())
    enabled = true

    // Слухаємо зміни стану обох сховищ; фільтри не записуємо.
    taskStore.$subscribe(onStoreChanged, { detached: true, flush: 'sync' })
    projectStore.$subscribe(onStoreChanged, { detached: true, flush: 'sync' })

    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('taskflow-sync')
      channel.onmessage = onChannelMessage
    }
  } catch (error) {
    console.error('TaskFlow: IndexedDB недоступна:', error)
    persistenceState.status = 'error'
    persistenceState.error = 'Не вдалося відкрити або відновити локальні дані. '
      + 'Працює лише тимчасовий стан; наявну базу не перезаписано.'
    persistenceState.canRetry = false
  }
}
