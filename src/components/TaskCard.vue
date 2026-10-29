<script setup>
import { computed, useId } from 'vue';
import StatusBadge from './StatusBadge.vue';
import PriorityBadge from './PriorityBadge.vue';
const props = defineProps({ task: { type: Object, required: true } });
const titleId = useId();
const emit = defineEmits(['status-change', 'priority-change']);
const statusSequence = ['todo', 'progress', 'done'];
const prioritySequence = ['low', 'medium', 'high'];
const statusActionText = computed(() => ({
  todo: 'Взяти в роботу', progress: 'Завершити', done: 'Повернути в план',
})[props.task.status] || 'Змінити статус');
const formattedDate = computed(() => {
  if (!props.task.dueDate) return 'Без терміну';
  const date = new Date(`${props.task.dueDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Дата не визначена';
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(date);
});
function changeStatus() {
  const index = statusSequence.indexOf(props.task.status);
  emit('status-change', {
    id: props.task.id,
    status: statusSequence[(index + 1) % statusSequence.length],
  });
}
function changePriority() {
  const index = prioritySequence.indexOf(props.task.priority);
  emit('priority-change', {
    id: props.task.id,
    priority: prioritySequence[(index + 1) % prioritySequence.length],
  });
}
</script>
<template>
  <f7-card class="tf3-task-card" :data-task-id="task.id" :aria-labelledby="titleId">
    <f7-card-content>
      <div class="task-row task-row-detail">
        <f7-icon :f7="task.status === 'done' ? 'checkmark_circle_fill' : 'circle'" :class="{ 'completed-icon': task.status === 'done' }" aria-hidden="true" />
        <div class="task-details">
          <h3 :id="titleId" class="task-title">{{ task.title }}</h3>
          <p class="task-description">{{ task.description }}</p>
          <div class="tf3-card-meta"><StatusBadge :status="task.status" /><PriorityBadge :priority="task.priority" /></div>
          <div class="tf3-meta-date">Термін: {{ formattedDate }}</div>
          <div class="tf3-card-actions">
            <button type="button" class="tf3-action tf3-action--primary" @click="changeStatus">{{ statusActionText }}</button>
            <button type="button" class="tf3-action" @click="changePriority">Змінити пріоритет</button>
          </div>
        </div>
      </div>
    </f7-card-content>
  </f7-card>
</template>
