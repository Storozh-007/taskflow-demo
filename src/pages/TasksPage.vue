<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import {
  persistenceState,
  retrySave,
  buildExport,
  replaceAllData,
} from '../services/persistence'
import '../css/task-components.css'
import '../css/task-list.css'
import '../css/persistence.css'

const taskStore = useTasksStore()
const projectStore = useProjectsStore()

// Для деструктуризації реактивного стану й getters використовуємо storeToRefs().
const {
  tasks,
  visibleTasks,
  searchText,
  selectedStatus,
  selectedPriority,
  selectedProject,
  sortOrder,
  onlyActive,
  onlyNoDate,
} = storeToRefs(taskStore)
const { projects, projectStats } = storeToRefs(projectStore)

// Стан відкриття форми локальний: іншим сторінкам він не потрібен.
const showForm = ref(false)
const editingId = ref(null)
const newProjectTitle = ref('')
const newProjectError = ref('')

const editingTask = computed(
  () => tasks.value.find((task) => task.id === editingId.value) ?? null,
)

const donePercent = computed(() => {
  if (!visibleTasks.value.length) return 0
  const done = visibleTasks.value.filter((task) => task.status === 'done').length
  return Math.round((done / visibleTasks.value.length) * 100)
})

const currentProject = computed(() =>
  projects.value.find((project) => project.id === selectedProject.value) ?? null,
)

function startCreate() {
  editingId.value = null
  showForm.value = true
}

function startEdit(id) {
  editingId.value = id
  showForm.value = true
}

function cancelForm() {
  editingId.value = null
  showForm.value = false
}

function saveTask(values) {
  const saved = values.id === null
    ? taskStore.addTask(values)
    : taskStore.updateTask(values)
  if (saved) cancelForm()
}

function handleDelete(id) {
  const task = tasks.value.find((item) => item.id === Number(id))
  if (!task) return

  if (!window.confirm(`Видалити завдання «${task.title}»?`)) return
  if (taskStore.deleteTask(id) && editingId.value === id) cancelForm()
}

function createProject() {
  const project = projectStore.addProject(newProjectTitle.value)
  if (!project) {
    newProjectError.value = 'Назва: 3–40 символів. Не повторюйте назви проєктів.'
    return
  }
  newProjectTitle.value = ''
  newProjectError.value = ''
  selectedProject.value = project.id
}

const saveMessage = computed(() => {
  if (persistenceState.status === 'loading') return 'Завантаження локальних даних…'
  if (persistenceState.status === 'saving') return 'Збереження змін у IndexedDB…'
  if (persistenceState.status === 'saved') return 'Усі зміни збережено в цьому браузері.'
  return persistenceState.error || 'Помилка локального збереження.'
})

// Додаткове завдання 4 (робота № 7): час останнього успішного збереження.
const lastSavedText = computed(() => {
  const date = persistenceState.lastSavedAt
  if (!date) return ''
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date)
})

// Додаткові завдання 1–2 (робота № 7): експорт та імпорт JSON.
const importInput = ref(null)
const transferMessage = ref('')
const transferIsError = ref(false)

function exportJson() {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  transferIsError.value = false
  transferMessage.value = 'Файл експорту сформовано.'
}

async function importJson(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  transferIsError.value = true
  let data
  try {
    data = JSON.parse(await file.text())
  } catch {
    transferMessage.value = 'Імпорт скасовано: файл не є коректним JSON.'
    return
  }
  const message = 'Імпорт замінить усі наявні завдання та проєкти. Продовжити?'
  if (!window.confirm(message)) {
    transferMessage.value = 'Імпорт скасовано користувачем.'
    return
  }
  const problem = replaceAllData(data)
  transferMessage.value = problem ? `Імпорт скасовано: ${problem}` : 'Дані імпортовано.'
  transferIsError.value = Boolean(problem)
}

// Додаткове завдання 4: групове переведення завдань проєкту в «У роботі».
function startAllInProject() {
  if (!currentProject.value) return
  const planned = tasks.value.filter(
    (task) => task.projectId === currentProject.value.id && task.status === 'todo',
  ).length
  if (!planned) return
  const message = `Перевести в статус «У роботі» заплановані завдання проєкту «${currentProject.value.title}» (кількість: ${planned})?`
  if (!window.confirm(message)) return
  taskStore.startProjectTasks(currentProject.value.id)
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="app-content tf3-container">
      <div class="page-heading tf5-heading">
        <div>
          <h1>Завдання</h1>
          <p>Pinia забезпечує спільний стан між сторінками без перезавантаження.</p>
        </div>
        <button type="button" class="tf5-btn tf5-btn--primary tf5-new" @click="startCreate">
          + Додати завдання
        </button>
      </div>

      <section
        class="tf7-persistence"
        :class="`tf7-persistence--${persistenceState.status}`"
        role="status"
        aria-live="polite"
        data-testid="persistence"
      >
        <strong>Локальне збереження</strong>
        <span>{{ saveMessage }}</span>
        <button
          v-if="persistenceState.canRetry"
          type="button"
          class="tf5-btn"
          @click="retrySave"
        >
          Повторити збереження
        </button>
        <div v-if="lastSavedText" class="tf7-last-saved">Останнє збереження: {{ lastSavedText }}</div>
        <div class="tf7-transfer">
          <button type="button" class="tf5-btn" @click="exportJson">Експорт JSON</button>
          <button type="button" class="tf5-btn" @click="importInput.click()">Імпорт JSON</button>
          <input ref="importInput" type="file" accept="application/json,.json" hidden @change="importJson" />
        </div>
        <p v-if="transferMessage" class="tf7-transfer-msg" :class="{ 'tf7-transfer-msg--error': transferIsError }">
          {{ transferMessage }}
        </p>
      </section>

      <section class="tf5-panel tf6-project-panel" aria-label="Проєкти">
        <h2>Мої проєкти</h2>
        <div class="tf6-project-list">
          <span v-for="project in projectStats" :key="project.id" class="tf6-project-pill">
            {{ project.title }} <strong>{{ project.taskCount }}</strong>
          </span>
        </div>
        <form class="tf6-project-form" @submit.prevent="createProject">
          <label>
            Назва нового проєкту
            <input
              v-model="newProjectTitle"
              type="text"
              maxlength="40"
              placeholder="Наприклад: Лабораторні"
              @input="newProjectError = ''"
            />
          </label>
          <button type="submit" class="tf5-btn tf5-btn--primary">Створити проєкт</button>
        </form>
        <p v-if="newProjectError" class="tf5-error" role="alert">{{ newProjectError }}</p>
      </section>

      <TaskForm
        v-if="showForm"
        :key="editingId ?? 'new'"
        :task="editingTask"
        :projects="projects"
        @save="saveTask"
        @cancel="cancelForm"
      />

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:project="selectedProject"
        v-model:sort="sortOrder"
        v-model:only-active="onlyActive"
        v-model:only-no-date="onlyNoDate"
        :projects="projects"
        @reset="taskStore.resetFilters"
      />

      <section class="tasks-section">
        <div class="section-heading">
          <h2>Список завдань</h2>
          <div class="tf3-counter" role="status" aria-live="polite">
            Показано: {{ visibleTasks.length }} із {{ tasks.length }}
            <span class="tf5-percent">· Виконано: {{ donePercent }}%</span>
          </div>
        </div>

        <!-- Додаткове завдання 4: групова дія для вибраного проєкту -->
        <div v-if="currentProject" class="tf6-bulk">
          <button type="button" class="tf5-btn" @click="startAllInProject">
            Усі заплановані проєкту «{{ currentProject.title }}» → У роботі
          </button>
        </div>

        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            :project-title="projectStore.projectTitle(task.projectId)"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <div v-else-if="tasks.length === 0" class="tf5-empty" data-testid="empty-all">
          <p>Список завдань порожній: усі завдання видалено. Створіть нове завдання або оновіть сторінку, щоб повернути демонстраційні записи.</p>
          <button type="button" class="tf5-btn tf5-btn--primary" @click="startCreate">
            + Додати завдання
          </button>
        </div>

        <div v-else class="tf5-empty" data-testid="empty-filter">
          <p>За поточними умовами завдань не знайдено.</p>
          <button type="button" class="tf5-btn" @click="taskStore.resetFilters">
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <template #fixed>
      <AppTabbar active="tasks" />
    </template>
  </f7-page>
</template>
