import { defineStore } from 'pinia'
import { useTasksStore } from './tasks.js'

// Окреме сховище для каталогу проєктів.
// Сховище лише в оперативній пам'яті: IndexedDB буде в роботі № 7.
export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' },
    ],
    nextProjectId: 1,
  }),

  getters: {
    projectCount: (state) => state.projects.length,
    projectTitle: (state) => (id) =>
      state.projects.find((project) => project.id === id)?.title ?? 'Загальні',

    // Додаткові завдання 1–3: статистика кожного проєкту (усього / невиконані / відсоток).
    projectStats: (state) => {
      const taskStore = useTasksStore()
      return state.projects.map((project) => {
        const own = taskStore.tasks.filter((task) => task.projectId === project.id)
        const done = own.filter((task) => task.status === 'done').length
        return {
          ...project,
          taskCount: own.length,
          activeCount: own.length - done,
          percent: own.length ? Math.round((done / own.length) * 100) : 0,
        }
      })
    },
  },

  actions: {
    addProject(rawTitle) {
      const title = String(rawTitle ?? '').trim()
      if (title.length < 3 || title.length > 40) return null

      const duplicate = this.projects.some(
        (project) => project.title.toLocaleLowerCase('uk-UA') ===
          title.toLocaleLowerCase('uk-UA'),
      )
      if (duplicate) return null

      const project = { id: `project-${this.nextProjectId}`, title }
      this.nextProjectId += 1
      this.projects.push(project)
      return project
    },
  },
})
