import { openDB } from 'idb'

const DB_NAME = 'taskflow-db'
const DB_VERSION = 1
let databasePromise = null

// Відкриваємо одну базу даних і повторно використовуємо з'єднання.
export function getDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Цей браузер не підтримує IndexedDB.'))
  }

  if (!databasePromise) {
    databasePromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata')
        }
      },
    }).catch((error) => {
      databasePromise = null
      throw error
    })
  }

  return databasePromise
}

// Закриваємо з'єднання (потрібно, зокрема, для тестів і видалення бази).
export async function closeDatabase() {
  if (!databasePromise) return
  const db = await databasePromise
  db.close()
  databasePromise = null
}

// Читаємо завдання, проєкти та службові значення в одній транзакції.
export async function readSnapshot() {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readonly')
  const [tasks, projects, initialized, nextProjectId, lastSavedAt] = await Promise.all([
    tx.objectStore('tasks').getAll(),
    tx.objectStore('projects').getAll(),
    tx.objectStore('metadata').get('initialized'),
    tx.objectStore('metadata').get('nextProjectId'),
    tx.objectStore('metadata').get('lastSavedAt'),
  ])
  await tx.done

  return {
    tasks,
    projects,
    initialized: initialized === true,
    nextProjectId,
    lastSavedAt: typeof lastSavedAt === 'string' ? lastSavedAt : null,
  }
}

// Атомарно замінюємо збережені списки актуальним знімком Pinia.
export async function writeSnapshot(snapshot) {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readwrite')
  const taskStore = tx.objectStore('tasks')
  const projectStore = tx.objectStore('projects')
  const metadataStore = tx.objectStore('metadata')
  const savedAt = new Date().toISOString()

  try {
    await Promise.all([taskStore.clear(), projectStore.clear()])
    await Promise.all([
      ...snapshot.tasks.map((task) => taskStore.put(task)),
      ...snapshot.projects.map((project) => projectStore.put(project)),
      metadataStore.put(true, 'initialized'),
      metadataStore.put(snapshot.nextProjectId, 'nextProjectId'),
      // Додаткове завдання 4: час останнього успішного збереження.
      metadataStore.put(savedAt, 'lastSavedAt'),
      tx.done,
    ])
  } catch (error) {
    // Синхронний виняток (наприклад, запис без ключа) сам не скасовує транзакцію:
    // без abort() уже виконаний clear() було б зафіксовано. Скасовуємо явно.
    try { tx.abort() } catch { /* транзакція вже завершена */ }
    await tx.done.catch(() => {})
    throw error
  }
  return savedAt
}

// Додаткове завдання 3: точкове видалення одного запису методом delete().
// На відміну від повного знімка, транзакція торкається лише одного ключа.
export async function deleteRecord(storeName, key) {
  if (!['tasks', 'projects'].includes(storeName)) {
    throw new Error(`Невідоме сховище: ${storeName}`)
  }
  const db = await getDatabase()
  const tx = db.transaction(storeName, 'readwrite')
  await Promise.all([tx.store.delete(key), tx.done])
}

// Додаткове завдання 5: кількість записів безпосередньо з IndexedDB.
export async function readCounts() {
  const db = await getDatabase()
  const tx = db.transaction(['tasks', 'projects', 'metadata'], 'readonly')
  const [tasks, projects, lastSavedAt] = await Promise.all([
    tx.objectStore('tasks').count(),
    tx.objectStore('projects').count(),
    tx.objectStore('metadata').get('lastSavedAt'),
  ])
  await tx.done
  return { tasks, projects, lastSavedAt: typeof lastSavedAt === 'string' ? lastSavedAt : null }
}
