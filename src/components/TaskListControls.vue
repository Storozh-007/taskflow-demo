<script setup>
defineProps({
  search: { type: String, default: '' },
  status: { type: String, default: 'all' },
  priority: { type: String, default: 'all' },
  sort: { type: String, default: 'newest' },
  onlyActive: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:priority',
  'update:sort',
  'update:onlyActive',
  'reset',
])
</script>

<template>
  <section class="tf5-panel" aria-label="Пошук і фільтри">
    <h2>Пошук і впорядкування</h2>

    <div class="tf5-controls-grid">
      <div class="tf5-search">
        <label class="tf5-search-field">
          Пошук за назвою та описом
          <input
            type="search"
            :value="search"
            placeholder="Наприклад: інтерфейс"
            @input="emit('update:search', $event.target.value)"
          />
        </label>
        <!-- Додаткове завдання 4: кнопка видима лише за непорожнього пошуку -->
        <button v-if="search.trim()" type="button" class="tf5-btn tf5-clear-search" @click="emit('update:search', '')">
          Очистити пошук
        </button>
      </div>

      <label>
        Статус
        <select :value="status" @change="emit('update:status', $event.target.value)">
          <option value="all">Усі статуси</option>
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
      </label>

      <label>
        Пріоритет
        <select :value="priority" @change="emit('update:priority', $event.target.value)">
          <option value="all">Усі пріоритети</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </label>

      <label>
        Сортування
        <select :value="sort" @change="emit('update:sort', $event.target.value)">
          <option value="newest">Спочатку нові</option>
          <option value="title">За назвою (А–Я)</option>
          <option value="priority">За пріоритетом (високий перший)</option>
          <option value="dueDate">За терміном (найближчий перший)</option>
          <!-- Додаткові завдання 2 і 6 -->
          <option value="dueDateDesc">За терміном (найпізніший перший)</option>
          <option value="status">За статусом (У роботі → Заплановано → Виконано)</option>
        </select>
      </label>
    </div>

    <div class="tf5-actions">
      <!-- Додаткове завдання 1: швидкий фільтр -->
      <button
        type="button"
        class="tf5-btn"
        :class="{ 'tf5-btn--active': onlyActive }"
        :aria-pressed="onlyActive"
        @click="emit('update:onlyActive', !onlyActive)"
      >
        Тільки невиконані
      </button>
      <button type="button" class="tf5-btn" @click="emit('reset')">
        Скинути фільтри
      </button>
    </div>
  </section>
</template>
