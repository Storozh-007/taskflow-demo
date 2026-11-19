<script setup>
import { computed, reactive, ref } from 'vue';
import { isDuplicateTaskTitle, isValidTaskDate, todayDate } from '../store/tasks.js';

const props = defineProps({
  task: { type: Object, default: null },
});
const emit = defineEmits(['save', 'cancel']);

const isEditing = computed(() => props.task !== null);
const showErrors = ref(false);

const statusLabels = { todo: 'Заплановано', progress: 'У роботі', done: 'Виконано' };
const priorityLabels = { low: 'Низький', medium: 'Середній', high: 'Високий' };
const categoryLabels = { study: 'Навчання', work: 'Робота', personal: 'Особисте' };

function defaultValues() {
  return {
    title: props.task?.title ?? '',
    description: props.task?.description ?? '',
    status: props.task?.status ?? 'todo',
    priority: props.task?.priority ?? 'medium',
    category: props.task?.category ?? 'study',
    dueDate: props.task?.dueDate ?? '',
  };
}

// Локальна копія: форма не змінює вихідний об'єкт до натискання «Зберегти».
const form = reactive(defaultValues());

const titleRemaining = computed(() => 80 - form.title.length);
const descriptionRemaining = computed(() => 300 - form.description.length);

const errors = computed(() => {
  const result = {};
  const title = form.title.trim();
  if (!title) {
    result.title = 'Вкажіть назву завдання.';
  } else if (title.length < 3) {
    result.title = 'Назва має містити щонайменше 3 символи.';
  } else if (title.length > 80) {
    result.title = 'Максимальна довжина — 80 символів.';
  } else if (isDuplicateTaskTitle(title, props.task?.id ?? null)) {
    result.title = 'Завдання з такою назвою вже існує.';
  }

  if (form.description.trim().length > 300) {
    result.description = 'Опис не повинен перевищувати 300 символів.';
  }
  if (!Object.hasOwn(statusLabels, form.status)) {
    result.status = 'Оберіть коректний статус.';
  }
  if (!Object.hasOwn(priorityLabels, form.priority)) {
    result.priority = 'Оберіть коректний пріоритет.';
  }
  if (!Object.hasOwn(categoryLabels, form.category)) {
    result.category = 'Оберіть коректну категорію.';
  }
  if (!isValidTaskDate(form.dueDate)) {
    result.dueDate = 'Укажіть коректну дату завершення.';
  } else if (form.dueDate < todayDate() && (!isEditing.value || form.dueDate !== props.task?.dueDate)) {
    result.dueDate = 'Дата завершення не може бути в минулому.';
  }
  return result;
});

function clearForm() {
  if (isEditing.value) return;
  Object.assign(form, defaultValues());
  showErrors.value = false;
}

function submitForm() {
  showErrors.value = true;
  if (Object.keys(errors.value).length > 0) return;
  emit('save', {
    title: form.title.trim(),
    description: form.description.trim(),
    status: form.status,
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate,
  });
}
</script>

<template>
  <div class="tf4-form-panel">
    <div class="tf4-form-heading">
      <div>
        <div class="tf4-eyebrow">TASKFLOW / FORM</div>
        <h2>{{ isEditing ? 'Редагування завдання' : 'Нове завдання' }}</h2>
        <p>{{ isEditing ? 'Зміни буде застосовано після збереження.' : 'Заповніть поля, щоб додати нове завдання.' }}</p>
      </div>
      <button type="button" class="tf4-close" aria-label="Закрити форму" @click="emit('cancel')">Закрити</button>
    </div>

    <form class="tf4-form" novalidate @submit.prevent="submitForm">
      <div class="tf4-field tf4-field--wide">
        <label for="tf4-title">Назва завдання <span class="tf4-required" aria-hidden="true">*</span></label>
        <input
          id="tf4-title"
          v-model.trim="form.title"
          type="text"
          placeholder="Наприклад: Підготувати звіт"
          maxlength="80"
          autocomplete="off"
          required
          :aria-invalid="showErrors && !!errors.title"
          :aria-describedby="showErrors && errors.title ? 'tf4-title-help tf4-title-error' : 'tf4-title-help'"
        />
        <small id="tf4-title-help">Від 3 до 80 символів · Залишилося: {{ titleRemaining }}</small>
        <p v-if="showErrors && errors.title" id="tf4-title-error" class="tf4-error" role="alert">{{ errors.title }}</p>
      </div>

      <div class="tf4-field tf4-field--wide">
        <label for="tf4-description">Опис</label>
        <textarea
          id="tf4-description"
          v-model.trim="form.description"
          placeholder="Що потрібно зробити?"
          rows="3"
          maxlength="300"
          :aria-invalid="showErrors && !!errors.description"
          :aria-describedby="showErrors && errors.description ? 'tf4-description-help tf4-description-error' : 'tf4-description-help'"
        ></textarea>
        <small id="tf4-description-help">Необов'язкове поле · Залишилося: {{ descriptionRemaining }}</small>
        <p v-if="showErrors && errors.description" id="tf4-description-error" class="tf4-error" role="alert">{{ errors.description }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-status">Статус <span class="tf4-required" aria-hidden="true">*</span></label>
        <select
          id="tf4-status"
          v-model="form.status"
          required
          :aria-invalid="showErrors && !!errors.status"
          :aria-describedby="showErrors && errors.status ? 'tf4-status-error' : undefined"
        >
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
        <p v-if="showErrors && errors.status" id="tf4-status-error" class="tf4-error" role="alert">{{ errors.status }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-priority">Пріоритет <span class="tf4-required" aria-hidden="true">*</span></label>
        <select
          id="tf4-priority"
          v-model="form.priority"
          required
          :aria-invalid="showErrors && !!errors.priority"
          :aria-describedby="showErrors && errors.priority ? 'tf4-priority-error' : undefined"
        >
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
        <p v-if="showErrors && errors.priority" id="tf4-priority-error" class="tf4-error" role="alert">{{ errors.priority }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-category">Категорія <span class="tf4-required" aria-hidden="true">*</span></label>
        <select
          id="tf4-category"
          v-model="form.category"
          required
          :aria-invalid="showErrors && !!errors.category"
          :aria-describedby="showErrors && errors.category ? 'tf4-category-error' : undefined"
        >
          <option value="study">Навчання</option>
          <option value="work">Робота</option>
          <option value="personal">Особисте</option>
        </select>
        <p v-if="showErrors && errors.category" id="tf4-category-error" class="tf4-error" role="alert">{{ errors.category }}</p>
      </div>

      <div class="tf4-field">
        <label for="tf4-date">Дата завершення <span class="tf4-required" aria-hidden="true">*</span></label>
        <input
          id="tf4-date"
          v-model="form.dueDate"
          type="date"
          required
          :min="isEditing && task?.dueDate < todayDate() ? undefined : todayDate()"
          :aria-invalid="showErrors && !!errors.dueDate"
          :aria-describedby="showErrors && errors.dueDate ? 'tf4-date-help tf4-date-error' : 'tf4-date-help'"
        />
        <small id="tf4-date-help">Дата не має бути минулою (крім незміненої дати старого завдання).</small>
        <p v-if="showErrors && errors.dueDate" id="tf4-date-error" class="tf4-error" role="alert">{{ errors.dueDate }}</p>
      </div>

      <div class="tf4-preview tf4-field--wide" aria-live="polite">
        <div class="tf4-preview-label">ПОПЕРЕДНІЙ ПЕРЕГЛЯД</div>
        <strong>{{ form.title.trim() || 'Назва нового завдання' }}</strong>
        <p>{{ form.description.trim() || 'Опис завдання з’явиться тут після введення.' }}</p>
        <div class="tf4-preview-chips">
          <span>{{ statusLabels[form.status] ?? '—' }}</span>
          <span>{{ priorityLabels[form.priority] ?? '—' }}</span>
          <span>{{ categoryLabels[form.category] ?? '—' }}</span>
        </div>
      </div>

      <div class="tf4-actions tf4-field--wide">
        <button type="submit" class="tf4-save">
          {{ isEditing ? 'Зберегти зміни' : 'Створити завдання' }}
        </button>
        <button v-if="!isEditing" type="button" class="tf4-cancel" @click="clearForm">
          Очистити форму
        </button>
        <button type="button" class="tf4-cancel" @click="emit('cancel')">
          Скасувати
        </button>
      </div>
    </form>
  </div>
</template>
