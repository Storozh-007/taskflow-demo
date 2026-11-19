<script setup>
import { ref, computed, nextTick } from 'vue';
import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskCounter from '../components/TaskCounter.vue';
import TaskForm from '../components/TaskForm.vue';
import { taskState, addTask, updateTask, setTaskStatus, setTaskPriority } from '../store/tasks.js';
import '../css/task-components.css';
import '../css/task-form.css';

const selectedStatus = ref('all');
const selectedPriority = ref('all');
const searchQuery = ref('');
const formVisible = ref(false);
const editingId = ref(null);
const formAnchor = ref(null);
const formInstance = ref(0);
const feedback = ref('');
const feedbackIsError = ref(false);

const statusOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'todo', label: 'Заплановано' },
  { value: 'progress', label: 'У роботі' },
  { value: 'done', label: 'Виконано' },
];

const priorityOptions = [
  { value: 'all', label: 'Усі' },
  { value: 'low', label: 'Низький' },
  { value: 'medium', label: 'Середній' },
  { value: 'high', label: 'Високий' },
];

const filteredTasks = computed(() => taskState.tasks.filter(task => (
  (selectedStatus.value === 'all' || task.status === selectedStatus.value) &&
  (selectedPriority.value === 'all' || task.priority === selectedPriority.value) &&
  task.title.toLocaleLowerCase('uk-UA').includes(searchQuery.value.trim().toLocaleLowerCase('uk-UA'))
)));

const editingTask = computed(() => taskState.tasks.find(task => task.id === editingId.value) ?? null);

function handleStatusChange(payload) {
  setTaskStatus(payload);
}

function handlePriorityChange(payload) {
  setTaskPriority(payload);
}

async function scrollToForm() {
  await nextTick();
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function createTask() {
  editingId.value = null;
  formInstance.value += 1;
  formVisible.value = true;
  feedback.value = '';
  await scrollToForm();
}

async function editTask(id) {
  if (!taskState.tasks.some(task => task.id === id)) return;
  editingId.value = id;
  formInstance.value += 1;
  formVisible.value = true;
  feedback.value = '';
  await scrollToForm();
}

function cancelForm() {
  formVisible.value = false;
  editingId.value = null;
}

function saveTask(data) {
  const isEditing = editingId.value !== null;
  const saved = isEditing ? updateTask({ id: editingId.value, ...data }) : addTask(data);
  feedbackIsError.value = !saved;
  if (!saved) {
    feedback.value = 'Не вдалося зберегти завдання. Перевірте дані форми.';
    return;
  }
  feedback.value = isEditing ? `Завдання «${saved.title}» оновлено.` : `Завдання «${saved.title}» створено.`;
  cancelForm();
  selectedStatus.value = 'all';
  selectedPriority.value = 'all';
  searchQuery.value = '';
}
</script>

<template>
  <f7-page name="tasks">
    <f7-navbar title="Мої завдання" />
    <div class="app-content tf3-container">
      <div class="page-heading tf4-page-heading">
        <div>
          <h1>Завдання</h1>
          <p>Список поточних завдань</p>
        </div>
        <button type="button" class="tf4-new-task" @click="createTask">
          <span aria-hidden="true">+</span> Додати завдання
        </button>
      </div>

      <p v-if="feedback" class="tf4-feedback" :class="{ 'tf4-feedback--error': feedbackIsError }" role="status">
        {{ feedback }}
      </p>

      <section v-if="formVisible" ref="formAnchor" class="tf4-form-section" aria-label="Форма завдання">
        <TaskForm :key="formInstance" :task="editingTask" @save="saveTask" @cancel="cancelForm" />
      </section>

      <section class="tf3-filters" aria-label="Фільтри завдань">
        <div class="tf4-search">
          <label for="tf4-search">Пошук за назвою</label>
          <input
            id="tf4-search"
            v-model="searchQuery"
            type="search"
            placeholder="Знайти завдання…"
            autocomplete="off"
          />
        </div>

        <div class="tf3-filter-group" role="group" aria-label="Фільтр за статусом">
          <div class="tf3-filter-title">Фільтр за статусом</div>
          <div class="tf3-filter-buttons">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{ 'is-active': selectedStatus === option.value }"
              :aria-pressed="selectedStatus === option.value"
              @click="selectedStatus = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="tf3-filter-group" role="group" aria-label="Фільтр за пріоритетом">
          <div class="tf3-filter-title">Фільтр за пріоритетом</div>
          <div class="tf3-filter-buttons">
            <button
              v-for="option in priorityOptions"
              :key="option.value"
              type="button"
              class="tf3-filter-button"
              :class="{ 'is-active': selectedPriority === option.value }"
              :aria-pressed="selectedPriority === option.value"
              @click="selectedPriority = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </section>

      <section class="tasks-section">
        <div class="section-heading">
          <h2>Список завдань</h2>
          <TaskCounter :count="filteredTasks.length" />
        </div>
        <div v-if="filteredTasks.length" class="task-list tf3-task-grid">
          <TaskCard
            v-for="task in filteredTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            @status-change="handleStatusChange"
            @priority-change="handlePriorityChange"
            @edit="editTask"
          />
        </div>
        <div v-else class="tf3-empty">За обраними фільтрами завдань не знайдено.</div>
      </section>
    </div>

    <template #fixed>
      <AppTabbar active="tasks" />
    </template>
  </f7-page>
</template>
