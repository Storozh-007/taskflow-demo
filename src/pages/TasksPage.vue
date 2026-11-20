<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppTabbar from '../components/AppTabbar.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskForm from '../components/TaskForm.vue'
import TaskListControls from '../components/TaskListControls.vue'
import { useTasksStore } from '../store/tasks'
import { useProjectsStore } from '../store/projects'
import '../css/task-components.css'
import '../css/task-list.css'

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
