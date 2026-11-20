import 'fake-indexeddb/auto'
import test, { beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useTasksStore } from '../src/store/tasks.js'
import { useProjectsStore } from '../src/store/projects.js'
import {
  closeDatabase, getDatabase, readSnapshot, writeSnapshot, deleteRecord, readCounts,
} from '../src/services/database.js'
import {
  persistenceState, initializePersistence, stopPersistence, retrySave,
  validateSnapshot, replaceAllData, buildExport, sortProjects,
} from '../src/services/persistence.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitSaved() {
  for (let i = 0; i < 100; i += 1) {
    await sleep(10)
    if (persistenceState.status === 'saved' || persistenceState.status === 'error') return
  }
  throw new Error('Збереження не завершилося')
}

// Імітує повне перезавантаження сторінки: нові Pinia та модуль, та сама база.
async function launch() {
  stopPersistence()
  const pinia = createPinia()
  setActivePinia(pinia)
  await initializePersistence(pinia)
  return { tasks: useTasksStore(pinia), projects: useProjectsStore(pinia) }
}

beforeEach(async () => {
  await closeDatabase()
  await new Promise((resolve) => {
    const request = indexedDB.deleteDatabase('taskflow-db')
    request.onsuccess = request.onerror = request.onblocked = resolve
  })
})

afterEach(() => stopPersistence())

test('схема: база taskflow-db має сховища tasks, projects, metadata з ключами', async () => {
  const db = await getDatabase()
  assert.deepEqual([...db.objectStoreNames].sort(), ['metadata', 'projects', 'tasks'])
  const tx = db.transaction(['tasks', 'projects', 'metadata'])
  assert.equal(tx.objectStore('tasks').keyPath, 'id')
  assert.equal(tx.objectStore('projects').keyPath, 'id')
  assert.equal(tx.objectStore('metadata').keyPath, null)
  assert.equal(db.version, 1)
})

test('перший запуск: демонстраційні дані записуються один раз, initialized = true', async () => {
  await launch()
  const snapshot = await readSnapshot()
  assert.equal(snapshot.initialized, true)
  assert.equal(snapshot.tasks.length, 6)
  assert.equal(snapshot.projects.length, 3)
  assert.equal(snapshot.nextProjectId, 1)
  assert.equal(persistenceState.status, 'saved')
})

test('створення, редагування, статус, пріоритет і видалення відновлюються після reload', async () => {
  const { tasks } = await launch()
  tasks.addTask({ title: 'Практична № 7 — тест', description: 'опис', projectId: 'study' })
  await waitSaved()
  tasks.updateTask({ ...tasks.tasks.find((t) => t.id === 1), title: 'Змінена назва' })
  tasks.setTaskStatus({ id: 2, status: 'todo' })
  tasks.setTaskPriority({ id: 3, priority: 'low' })
  tasks.deleteTask(6)
  await waitSaved()

  const after = (await launch()).tasks
  assert.equal(after.tasks.length, 6)
  const created = after.tasks.find((t) => t.title === 'Практична № 7 — тест')
  assert.equal(created.projectId, 'study')
  assert.equal(after.tasks.find((t) => t.id === 1).title, 'Змінена назва')
  assert.equal(after.tasks.find((t) => t.id === 2).status, 'todo')
  assert.equal(after.tasks.find((t) => t.id === 3).priority, 'low')
  assert.equal(after.tasks.some((t) => t.id === 6), false)
})

test('видалені записи не відновлюються; порожній список лишається порожнім', async () => {
  const { tasks } = await launch()
  for (const id of tasks.tasks.map((t) => t.id)) tasks.deleteTask(id)
  await waitSaved()
  const after = (await launch()).tasks
  assert.equal(after.tasks.length, 0)
  assert.equal((await readSnapshot()).initialized, true)
})

test('проєкти та nextProjectId зберігаються; новий id унікальний після reload', async () => {
  const { projects } = await launch()
  assert.equal(projects.addProject('Лабораторні').id, 'project-1')
  await waitSaved()
  const after = (await launch()).projects
  assert.equal(after.projects.length, 4)
  assert.equal(after.nextProjectId, 2)
  assert.equal(after.addProject('Ще один').id, 'project-2')
})

test('зміна лише фільтрів не спричиняє запису в базу', async () => {
  const { tasks } = await launch()
  const before = (await readSnapshot()).lastSavedAt
  await sleep(20)
  tasks.searchText = 'інтерфейс'
  tasks.selectedStatus = 'done'
  tasks.sortOrder = 'title'
  await sleep(60)
  assert.equal(persistenceState.status, 'saved')
  assert.equal((await readSnapshot()).lastSavedAt, before)
})

test('фільтри не зберігаються: після reload вони скинуті, дані збережено', async () => {
  const { tasks } = await launch()
  tasks.searchText = 'x'
  tasks.addTask({ title: 'Нове завдання' })
  await waitSaved()
  const after = (await launch()).tasks
  assert.equal(after.searchText, '')
  assert.equal(after.tasks.length, 7)
})

test('атомарність: помилка під час запису відкочує всю транзакцію', async () => {
  await launch()
  const before = await readSnapshot()
  await assert.rejects(
    writeSnapshot({ tasks: [{ title: 'без ключа id' }], projects: [], nextProjectId: 1 }),
  )
  const after = await readSnapshot()
  assert.equal(after.tasks.length, before.tasks.length)
  assert.equal(after.projects.length, before.projects.length)
})

test('IndexedDB недоступна: стан error, запис не вмикається, база не перезаписується', async () => {
  const original = globalThis.indexedDB
  globalThis.indexedDB = undefined
  try {
    const { tasks } = await launch()
    assert.equal(persistenceState.status, 'error')
    assert.equal(persistenceState.canRetry, false)
    tasks.addTask({ title: 'У пам’яті' })
    await sleep(40)
    assert.equal(persistenceState.status, 'error')
    retrySave()
    assert.equal(persistenceState.status, 'error')
  } finally {
    globalThis.indexedDB = original
  }
})

test('помилка запису: статус error, кнопка повтору, після retrySave — saved', async () => {
  const { tasks } = await launch()
  const db = await getDatabase()
  const original = db.transaction.bind(db)
  db.transaction = () => { throw new Error('збій') }
  const quiet = console.error
  console.error = () => {}
  try {
    tasks.addTask({ title: 'Не збережеться' })
    await waitSaved()
    assert.equal(persistenceState.status, 'error')
    assert.equal(persistenceState.canRetry, true)
  } finally {
    console.error = quiet
    db.transaction = original
  }
  retrySave()
  await waitSaved()
  assert.equal(persistenceState.status, 'saved')
  assert.equal((await readSnapshot()).tasks.length, 7)
})

test('deleteRecord: видаляє один запис за ключем, решта лишається', async () => {
  await launch()
  await deleteRecord('tasks', 3)
  const snapshot = await readSnapshot()
  assert.equal(snapshot.tasks.length, 5)
  assert.equal(snapshot.tasks.some((t) => t.id === 3), false)
  await assert.rejects(deleteRecord('metadata', 'initialized'))
})

test('readCounts: кількість записів і lastSavedAt беруться з IndexedDB', async () => {
  await launch()
  const counts = await readCounts()
  assert.equal(counts.tasks, 6)
  assert.equal(counts.projects, 3)
  assert.ok(Date.parse(counts.lastSavedAt) > 0)
})

test('validateSnapshot: перевіряє структуру, типи, projectId та унікальність id', () => {
  const task = { id: 1, title: 'Завдання', status: 'todo', priority: 'low', dueDate: '', projectId: 'general' }
  const project = { id: 'general', title: 'Загальні' }
  assert.equal(validateSnapshot({ tasks: [task], projects: [project] }), '')
  assert.match(validateSnapshot(null), /об’єкта/)
  assert.match(validateSnapshot({ tasks: 1, projects: [] }), /масиви/)
  assert.match(validateSnapshot({ tasks: [{ ...task, id: 'a' }], projects: [project] }), /числового id/)
  assert.match(validateSnapshot({ tasks: [task, task], projects: [project] }), /Дубльований id завдання/)
  assert.match(validateSnapshot({ tasks: [task], projects: [project, project] }), /Дубльований id проєкту/)
  assert.match(validateSnapshot({ tasks: [{ ...task, status: 'x' }], projects: [project] }), /статус/)
  assert.match(validateSnapshot({ tasks: [{ ...task, projectId: 'ghost' }], projects: [project] }), /не існує/)
})

test('імпорт: коректний файл замінює дані й зберігається; хибний — відхиляється', async () => {
  const { tasks, projects } = await launch()
  const exported = buildExport()
  assert.equal(exported.tasks.length, 6)
  assert.ok(Date.parse(exported.exportedAt) > 0)

  assert.match(replaceAllData({ tasks: [{ id: 1 }], projects: [] }), /./)
  assert.equal(tasks.tasks.length, 6)

  const data = {
    projects: [{ id: 'general', title: 'Загальні' }, { id: 'project-4', title: 'Імпорт' }],
    tasks: [{ id: 10, title: 'Імпортоване', status: 'todo', priority: 'high', dueDate: '', projectId: 'project-4' }],
  }
  assert.equal(replaceAllData(data), '')
  await waitSaved()
  assert.equal(tasks.tasks.length, 1)
  assert.equal(projects.nextProjectId, 5)
  const after = await launch()
  assert.equal(after.tasks.tasks[0].title, 'Імпортоване')
})

test('порядок каталогу проєктів після reload збігається з порядком до нього', async () => {
  const { projects } = await launch()
  projects.addProject('Лабораторні')
  projects.addProject('Курсові')
  await waitSaved()
  const before = projects.projects.map((p) => p.id)
  const after = (await launch()).projects.projects.map((p) => p.id)
  assert.deepEqual(after, before)
  assert.deepEqual(after, ['general', 'study', 'personal', 'project-1', 'project-2'])
  assert.deepEqual(
    sortProjects([{ id: 'project-10' }, { id: 'project-2' }, { id: 'zzz' }, { id: 'personal' }]).map((p) => p.id),
    ['personal', 'project-2', 'project-10', 'zzz'],
  )
})
