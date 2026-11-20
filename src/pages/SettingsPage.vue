<script setup>
import { ref, onMounted } from 'vue'
import AppTabbar from '../components/AppTabbar.vue'
import { readCounts } from '../services/database'
import { persistenceState } from '../services/persistence'
import '../css/task-components.css'
import '../css/persistence.css'

// Додаткове завдання 5: значення читаються безпосередньо з IndexedDB, а не зі сховищ Pinia.
const counts = ref(null)
const error = ref('')

async function refresh() {
  try {
    counts.value = await readCounts()
    error.value = ''
  } catch (err) {
    error.value = 'Не вдалося прочитати IndexedDB.'
    console.error(err)
  }
}

function format(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(iso))
}

onMounted(refresh)
</script>

<template>
  <f7-page name="settings" @page:afterin="refresh">
    <f7-navbar title="Налаштування" back-link="Назад" />
    <div class="app-content tf3-container">
      <div class="page-heading">
        <h1>Налаштування</h1>
        <p>Дані локального сховища taskflow-db.</p>
      </div>
      <p v-if="error" class="tf5-error" role="alert">{{ error }}</p>
      <div v-else class="tf7-settings-grid" data-testid="settings">
        <div class="tf7-settings-row"><span>Збережених завдань</span><strong>{{ counts ? counts.tasks : '…' }}</strong></div>
        <div class="tf7-settings-row"><span>Збережених проєктів</span><strong>{{ counts ? counts.projects : '…' }}</strong></div>
        <div class="tf7-settings-row"><span>Останнє збереження</span><strong>{{ counts ? format(counts.lastSavedAt) : '…' }}</strong></div>
        <div class="tf7-settings-row"><span>Стан збереження</span><strong>{{ persistenceState.status }}</strong></div>
      </div>
    </div>
    <template #fixed><AppTabbar active="about" /></template>
  </f7-page>
</template>
