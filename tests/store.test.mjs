import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useTasksStore } from '../src/store/tasks.js'
import { useProjectsStore } from '../src/store/projects.js'

const valid = {
  title: 'Підготувати презентацію',
  description: 'Практична робота з Pinia',
  status: 'todo',
  priority: 'medium',
  dueDate: '2029-01-15',
}

let tasks
let projects

// Кожен тест отримує нове, ізольоване Pinia-сховище.
beforeEach(() => {
  setActivePinia(createPinia())
  tasks = useTasksStore()
  projects = useProjectsStore()
})

test('початковий стан: 6 завдань, усі у проєкті «Загальні», 3 проєкти', () => {
  assert.equal(tasks.totalTasks, 6)
  assert.ok(tasks.tasks.every((task) => task.projectId === 'general'))
  assert.equal(projects.projectCount, 3)
})

test('getters статистики: total / progress / done / відсоток', () => {
  assert.equal(tasks.completedTasks, 2)
  assert.equal(tasks.progressTasks, 2)
  assert.equal(tasks.plannedTasks, 2)
  assert.equal(tasks.completionPercent, 33)
  assert.equal(tasks.activeTasks.length, 3)
})

test('addProject: створює проєкт, відхиляє дубль і некоректну довжину', () => {
  const created = projects.addProject('Лабораторні')
  assert.equal(created.id, 'project-1')
  assert.equal(projects.projectCount, 4)
  assert.equal(projects.addProject('  лабораторні '), null)
  assert.equal(projects.addProject('ab'), null)
  assert.equal(projects.addProject('x'.repeat(41)), null)
  assert.equal(projects.projectCount, 4)
})

test('projectTitle: повертає назву, а для невідомого id — «Загальні»', () => {
  assert.equal(projects.projectTitle('study'), 'Навчання')
  assert.equal(projects.projectTitle('nope'), 'Загальні')
})

test('addTask: додає на початок, з projectId; невідомий проєкт → general', () => {
  assert.equal(tasks.addTask({ ...valid, projectId: 'study' }), true)
  assert.equal(tasks.tasks[0].id, 7)
  assert.equal(tasks.tasks[0].projectId, 'study')
  tasks.addTask({ ...valid, projectId: 'ghost' })
  assert.equal(tasks.tasks[0].projectId, 'general')
})

test('addTask / updateTask: некоректні дані відхиляються', () => {
  assert.equal(tasks.addTask({ ...valid, title: 'ab' }), false)
  assert.equal(tasks.addTask(null), false)
  assert.equal(tasks.updateTask({ ...valid, id: 999 }), false)
  assert.equal(tasks.updateTask({ ...valid, id: 1, title: '' }), false)
  assert.equal(tasks.totalTasks, 6)
})

test('updateTask: змінює проєкт наявного завдання', () => {
  assert.equal(tasks.updateTask({ ...valid, id: 1, projectId: 'personal' }), true)
  assert.equal(tasks.tasks.find((t) => t.id === 1).projectId, 'personal')
})

test('visibleTasks: фільтр проєкту разом із пошуком і статусом', () => {
  tasks.updateTask({ ...tasks.tasks[0], projectId: 'study' })
  tasks.updateTask({ ...tasks.tasks[2], projectId: 'study' })
  tasks.selectedProject = 'study'
  assert.equal(tasks.visibleTasks.length, 2)
  tasks.selectedStatus = 'progress'
  assert.deepEqual(tasks.visibleTasks.map((t) => t.id), [3])
  tasks.searchText = 'НЕМАЄ'
  assert.equal(tasks.visibleTasks.length, 0)
})

test('visibleTasks: sort() не змінює порядок у state.tasks', () => {
  const before = tasks.tasks.map((t) => t.id)
  tasks.sortOrder = 'title'
  assert.equal(tasks.visibleTasks.length, 6)
  assert.deepEqual(tasks.tasks.map((t) => t.id), before)
})

test('фільтр «Лише без терміну» та «Тільки невиконані»', () => {
  tasks.addTask({ ...valid, dueDate: '' })
  tasks.onlyNoDate = true
  assert.equal(tasks.visibleTasks.length, 1)
  tasks.onlyNoDate = false
  tasks.onlyActive = true
  assert.equal(tasks.visibleTasks.length, 5)
})

test('deleteTask і статус/пріоритет: правильні та хибні значення', () => {
  assert.equal(tasks.deleteTask(4), true)
  assert.equal(tasks.deleteTask(4), false)
  assert.equal(tasks.setTaskStatus({ id: 1, status: 'done' }), true)
  assert.equal(tasks.setTaskStatus({ id: 1, status: 'x' }), false)
  assert.equal(tasks.setTaskPriority({ id: 1, priority: 'low' }), true)
  assert.equal(tasks.setTaskPriority({ id: 999, priority: 'low' }), false)
})

test('projectStats: кількість, невиконані та відсоток виконання', () => {
  tasks.updateTask({ ...tasks.tasks[1], projectId: 'study' }) // id 2 — виконане
  tasks.updateTask({ ...tasks.tasks[0], projectId: 'study' }) // id 1 — заплановане
  const study = projects.projectStats.find((p) => p.id === 'study')
  assert.deepEqual(
    [study.taskCount, study.activeCount, study.percent],
    [2, 1, 50],
  )
  const empty = projects.projectStats.find((p) => p.id === 'personal')
  assert.equal(empty.percent, 0)
})

test('startProjectTasks: лише заплановані завдання проєкту → «У роботі»', () => {
  assert.equal(tasks.startProjectTasks('general'), 2)
  assert.equal(tasks.progressTasks, 4)
  assert.equal(tasks.startProjectTasks('study'), 0)
})

test('resetFilters повертає значення за замовчуванням', () => {
  Object.assign(tasks, {
    searchText: 'x', selectedStatus: 'done', selectedPriority: 'low',
    selectedProject: 'study', sortOrder: 'title', onlyActive: true, onlyNoDate: true,
  })
  tasks.resetFilters()
  assert.equal(tasks.searchText, '')
  assert.equal(tasks.selectedProject, 'all')
  assert.equal(tasks.sortOrder, 'newest')
  assert.equal(tasks.onlyActive || tasks.onlyNoDate, false)
})

test('два сховища спільні для всіх викликів useStore() в одному pinia', () => {
  assert.equal(useTasksStore(), tasks)
  tasks.addTask(valid)
  assert.equal(useTasksStore().totalTasks, 7)
})
