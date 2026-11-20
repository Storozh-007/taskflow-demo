<script setup>
import { ref, computed } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'
import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks.js'
import '../css/task-components.css'
import '../css/task-list.css'

const searchText = ref('')
const selectedStatus = ref('all')
const selectedPriority = ref('all')
const sortOrder = ref('newest')
const onlyActive = ref(false)

const showForm = ref(false)
const editingId = ref(null)
const editingTask = computed(
  () => taskState.tasks.find((task) => task.id === editingId.value) ?? null,
)

const visibleTasks = computed(() => {
  const term = searchText.value.trim().toLocaleLowerCase('uk-UA')
  const priorityWeight = { high: 3, medium: 2, low: 1 }
  const statusWeight = { progress: 0, todo: 1, done: 2 }

  // filter() створює новий масив: вихідний стан не змінюється.
  const result = taskState.tasks.filter((task) => {
    const matchesText =
      !term ||
      `${task.title} ${task.description ?? ''}`.toLocaleLowerCase('uk-UA').includes(term)
    const matchesStatus =
      selectedStatus.value === 'all' || task.status === selectedStatus.value
    const matchesPriority =
      selectedPriority.value === 'all' || task.priority === selectedPriority.value
    const matchesActive = !onlyActive.value || task.status !== 'done'

    return matchesText && matchesStatus && matchesPriority && matchesActive
  })

  // Сортуємо лише копію, щоб не змінювати taskState.tasks.
  return result.sort((a, b) => {
    if (sortOrder.value === 'title') {
      return a.title.localeCompare(b.title, 'uk-UA') || a.id - b.id
    }
    if (sortOrder.value === 'priority') {
      return priorityWeight[b.priority] - priorityWeight[a.priority] || b.id - a.id
    }
    if (sortOrder.value === 'status') {
      return statusWeight[a.status] - statusWeight[b.status] || b.id - a.id
    }
    if (sortOrder.value === 'dueDate' || sortOrder.value === 'dueDateDesc') {
      // Порожні дати завжди після заповнених (в обох напрямках).
      if (!a.dueDate && !b.dueDate) return b.id - a.id
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      const direction = sortOrder.value === 'dueDate' ? 1 : -1
      return direction * a.dueDate.localeCompare(b.dueDate) || b.id - a.id
    }
    return b.id - a.id
  })
})

// Додаткове завдання 3: частка виконаних серед знайдених завдань.
const donePercent = computed(() => {
  if (!visibleTasks.value.length) return 0
  const done = visibleTasks.value.filter((task) => task.status === 'done').length
  return Math.round((done / visibleTasks.value.length) * 100)
})

function resetFilters() {
  searchText.value = ''
  selectedStatus.value = 'all'
  selectedPriority.value = 'all'
  sortOrder.value = 'newest'
  onlyActive.value = false
}

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
  const saved = values.id === null ? addTask(values) : updateTask(values)
  if (saved) cancelForm()
}

function handleDelete(id) {
  const task = taskState.tasks.find((item) => item.id === id)
  if (!task) return

  const confirmed = window.confirm(`Видалити завдання «${task.title}»?`)
  if (!confirmed) return

  if (deleteTask(id) && editingId.value === id) cancelForm()
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="app-content tf3-container">
      <div class="page-heading tf5-heading">
        <div>
          <h1>Завдання</h1>
          <p>Створюйте, редагуйте, знаходьте, сортуйте та видаляйте завдання.</p>
        </div>
        <button type="button" class="tf5-btn tf5-btn--primary tf5-new" @click="startCreate">
          + Додати завдання
        </button>
      </div>

      <TaskForm
        v-if="showForm"
        :key="editingId ?? 'new'"
        :task="editingTask"
        @save="saveTask"
        @cancel="cancelForm"
      />

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:only-active="onlyActive"
        @reset="resetFilters"
      />

      <section class="tasks-section">
        <div class="section-heading">
          <h2>Список завдань</h2>
          <div class="tf3-counter" role="status" aria-live="polite">
            Показано: {{ visibleTasks.length }} із {{ taskState.tasks.length }}
            <span class="tf5-percent">· Виконано: {{ donePercent }}%</span>
          </div>
        </div>

        <div v-if="visibleTasks.length" class="tf3-task-grid">
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            @status-change="setTaskStatus"
            @priority-change="setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <!-- Додаткове завдання 5: окреме пояснення, коли видалено всі завдання -->
        <div v-else-if="taskState.tasks.length === 0" class="tf5-empty" data-testid="empty-all">
          <p>Список завдань порожній: усі завдання видалено. Створіть нове завдання або оновіть сторінку, щоб повернути демонстраційні записи.</p>
          <button type="button" class="tf5-btn tf5-btn--primary" @click="startCreate">
            + Додати завдання
          </button>
        </div>

        <div v-else class="tf5-empty" data-testid="empty-filter">
          <p>За поточними умовами завдань не знайдено.</p>
          <button type="button" class="tf5-btn" @click="resetFilters">
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
