<script setup>
import { computed } from 'vue';
import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import { taskState, setTaskStatus, setTaskPriority } from '../store/tasks.js';
import '../css/task-components.css';
const totalTasks = computed(() => taskState.tasks.length);
const completedTasks = computed(() => taskState.tasks.filter(task => task.status === 'done').length);
const progressTasks = computed(() => taskState.tasks.filter(task => task.status === 'progress').length);
const plannedTasks = computed(() => totalTasks.value - completedTasks.value - progressTasks.value);
const completionPercent = computed(() => totalTasks.value ? Math.round(completedTasks.value / totalTasks.value * 100) : 0);
const activeTasks = computed(() => {
  const order = { high: 0, medium: 1, low: 2 };
  return taskState.tasks.filter(task => task.status !== 'done')
    .sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3);
});
function handleStatusChange(payload) { setTaskStatus(payload); }
function handlePriorityChange(payload) { setTaskPriority(payload); }
</script>
<template>
  <f7-page name="home">
    <f7-navbar title="TaskFlow"><f7-nav-right><f7-link href="/about/" aria-label="Інформація про TaskFlow"><f7-icon f7="info_circle" aria-hidden="true" /></f7-link></f7-nav-right></f7-navbar>
    <div class="app-content tf3-container">
      <div class="page-heading"><h1>Головна</h1><p>Огляд ваших завдань</p></div>
      <section class="stats-grid" aria-label="Статистика завдань">
        <div class="stat-card tf3-stat"><f7-icon f7="square_list" aria-hidden="true" /><strong class="stat-value">{{ totalTasks }}</strong><div class="stat-label">Усього завдань</div></div>
        <div class="stat-card stat-card-progress tf3-stat"><f7-icon f7="arrow_2_circlepath" aria-hidden="true" /><strong class="stat-value">{{ progressTasks }}</strong><div class="stat-label">У роботі</div></div>
        <div class="stat-card stat-card-success tf3-stat"><f7-icon f7="checkmark_circle" aria-hidden="true" /><strong class="stat-value">{{ completedTasks }}</strong><div class="stat-label">Виконано</div></div>
        <div class="stat-card stat-card-planned tf3-stat"><f7-icon f7="clock" aria-hidden="true" /><strong class="stat-value">{{ plannedTasks }}</strong><div class="stat-label">Заплановано</div></div>
      </section>
      <section class="tf3-completion"><div><span>Прогрес виконання</span><strong>{{ completionPercent }}%</strong></div><progress :value="completedTasks" :max="totalTasks || 1" aria-label="Частка виконаних завдань">{{ completionPercent }}%</progress></section>
      <section>
        <div class="section-heading"><h2>Актуальні завдання</h2><f7-link href="/tasks/">Переглянути всі</f7-link></div>
        <div v-if="activeTasks.length" class="task-list tf3-task-grid"><TaskCard v-for="task in activeTasks" :key="task.id" :task="task" @status-change="handleStatusChange" @priority-change="handlePriorityChange" /></div>
        <div v-else class="tf3-empty">Наразі всі завдання виконані.</div>
      </section>
      <f7-button fill large href="/tasks/" class="page-action">Перейти до завдань</f7-button>
    </div>
    <template #fixed><AppTabbar active="home" /></template>
  </f7-page>
</template>
