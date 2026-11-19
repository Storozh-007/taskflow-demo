import { reactive } from 'vue';
import initialTasks from '../data/tasks.js';

export const allowedStatuses = ['todo', 'progress', 'done'];
export const allowedPriorities = ['low', 'medium', 'high'];
export const allowedCategories = ['study', 'work', 'personal'];

// Сховище навмисно працює лише в пам'яті: після перезавантаження
// відновлюються шість демонстраційних завдань із src/data/tasks.js.
export const taskState = reactive({
  tasks: initialTasks.map(task => ({ ...task })),
});

export function isValidTaskDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === value;
}

export function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isDuplicateTaskTitle(title, exceptId = null) {
  if (typeof title !== 'string') return false;
  const normalized = title.trim().toLocaleLowerCase('uk-UA');
  return taskState.tasks.some(task => task.id !== exceptId && task.title.trim().toLocaleLowerCase('uk-UA') === normalized);
}

function normalizeTaskData(data, existingTask = null) {
  if (!data || typeof data !== 'object') return null;

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  if (title.length < 3 || title.length > 80) return null;
  if (description.length > 300) return null;
  if (!allowedStatuses.includes(data.status)) return null;
  if (!allowedPriorities.includes(data.priority)) return null;

  // Підтримка необов'язкової або початкової категорії
  const category = data.category || existingTask?.category || 'study';
  if (!allowedCategories.includes(category)) return null;

  if (!isValidTaskDate(data.dueDate)) return null;

  // Додаткове завдання 2: дата завершення нового завдання не може бути минулою.
  // Історичне завдання можна відредагувати без зміни його початкової дати.
  if (data.dueDate < todayDate() && (!existingTask || existingTask.dueDate !== data.dueDate)) return null;

  // Додаткове завдання 7: унікальність назви без урахування регістру.
  if (isDuplicateTaskTitle(title, existingTask?.id ?? null)) return null;

  return {
    title,
    description,
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate,
    category,
  };
}

export function addTask(data) {
  const normalized = normalizeTaskData(data);
  if (!normalized) return null;
  const nextId = taskState.tasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1;
  const task = { id: nextId, ...normalized };
  taskState.tasks.push(task);
  return task;
}

export function updateTask({ id, ...data } = {}) {
  const task = taskState.tasks.find(item => item.id === id);
  if (!task) return null;
  const normalized = normalizeTaskData(data, task);
  if (!normalized) return null;
  Object.assign(task, normalized);
  return task;
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.includes(status)) return;
  const task = taskState.tasks.find(item => item.id === id);
  if (task) task.status = status;
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.includes(priority)) return;
  const task = taskState.tasks.find(item => item.id === id);
  if (task) task.priority = priority;
}
