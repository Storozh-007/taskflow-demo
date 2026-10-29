<script setup>
import { ref, computed } from 'vue';
import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskCounter from '../components/TaskCounter.vue';
import { taskState, setTaskStatus, setTaskPriority } from '../store/tasks.js';
import '../css/task-components.css';
const selectedStatus = ref('all');
const selectedPriority = ref('all');
const statusOptions = [
  { value: 'all', label: 'Усі' }, { value: 'todo', label: 'Заплановано' },
  { value: 'progress', label: 'У роботі' }, { value: 'done', label: 'Виконано' },
];
const priorityOptions = [
  { value: 'all', label: 'Усі' }, { value: 'low', label: 'Низький' },
  { value: 'medium', label: 'Середній' }, { value: 'high', label: 'Високий' },
];
const filteredTasks = computed(() => taskState.tasks.filter(task => (
  (selectedStatus.value === 'all' || task.status === selectedStatus.value) &&
  (selectedPriority.value === 'all' || task.priority === selectedPriority.value)
)));
function handleStatusChange(payload) { setTaskStatus(payload); }
function handlePriorityChange(payload) { setTaskPriority(payload); }
</script>
<template>
  <f7-page name="tasks">
    <f7-navbar title="Мої завдання" />
    <div class="app-content tf3-container">
      <div class="page-heading"><h1>Завдання</h1><p>Список поточних завдань</p></div>
      <section class="tf3-filters" aria-label="Фільтри завдань">
        <div class="tf3-filter-group" role="group" aria-label="Фільтр за статусом">
          <div class="tf3-filter-title">Фільтр за статусом</div>
          <div class="tf3-filter-buttons">
            <button v-for="option in statusOptions" :key="option.value" type="button" class="tf3-filter-button"
              :class="{ 'is-active': selectedStatus === option.value }" :aria-pressed="selectedStatus === option.value"
              @click="selectedStatus = option.value">{{ option.label }}</button>
          </div>
        </div>
        <div class="tf3-filter-group" role="group" aria-label="Фільтр за пріоритетом">
          <div class="tf3-filter-title">Фільтр за пріоритетом</div>
          <div class="tf3-filter-buttons">
            <button v-for="option in priorityOptions" :key="option.value" type="button" class="tf3-filter-button"
              :class="{ 'is-active': selectedPriority === option.value }" :aria-pressed="selectedPriority === option.value"
              @click="selectedPriority = option.value">{{ option.label }}</button>
          </div>
        </div>
      </section>
      <section class="tasks-section">
        <div class="section-heading"><h2>Список завдань</h2><TaskCounter :count="filteredTasks.length" /></div>
        <div v-if="filteredTasks.length" class="task-list tf3-task-grid">
          <TaskCard v-for="task in filteredTasks" :key="task.id" :task="task"
            @status-change="handleStatusChange" @priority-change="handlePriorityChange" />
        </div>
        <div v-else class="tf3-empty">За обраними фільтрами завдань не знайдено.</div>
      </section>
    </div>
    <template #fixed><AppTabbar active="tasks" /></template>
  </f7-page>
</template>
