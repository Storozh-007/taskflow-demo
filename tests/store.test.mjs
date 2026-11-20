import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import initialTasks from '../src/data/tasks.js';
import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../src/store/tasks.js';

const valid = {
  title: 'Підготувати презентацію',
  description: 'Практична робота з керування списком',
  status: 'todo',
  priority: 'medium',
  dueDate: '2029-01-15',
};

beforeEach(() => {
  taskState.tasks.splice(0, taskState.tasks.length, ...initialTasks.map((task) => ({ ...task })));
});

test('початковий стан містить 6 завдань', () => {
  assert.equal(taskState.tasks.length, 6);
});

test('addTask: додає завдання на початок списку з ID = max(ID) + 1', () => {
  assert.equal(addTask(valid), true);
  assert.equal(taskState.tasks.length, 7);
  assert.equal(taskState.tasks[0].id, 7);
  assert.equal(taskState.tasks[0].title, 'Підготувати презентацію');
});

test('addTask: порожня назва та null відхиляються', () => {
  assert.equal(addTask({ ...valid, title: '   ' }), false);
  assert.equal(addTask(null), false);
  assert.equal(taskState.tasks.length, 6);
});

test('addTask: некоректні статус і пріоритет замінюються типовими значеннями', () => {
  addTask({ ...valid, status: 'x', priority: 'y' });
  assert.equal(taskState.tasks[0].status, 'todo');
  assert.equal(taskState.tasks[0].priority, 'medium');
});

test('updateTask: змінює завдання та зберігає ID', () => {
  assert.equal(updateTask({ ...valid, id: 2, title: 'Нова назва' }), true);
  const task = taskState.tasks.find((item) => item.id === 2);
  assert.equal(task.title, 'Нова назва');
  assert.equal(task.id, 2);
  assert.equal(taskState.tasks.length, 6);
});

test('updateTask: неіснуючий ID або порожня назва повертають false', () => {
  assert.equal(updateTask({ ...valid, id: 999 }), false);
  assert.equal(updateTask({ ...valid, id: 1, title: '' }), false);
  assert.equal(taskState.tasks.find((item) => item.id === 1).title, initialTasks[0].title);
});

test('setTaskStatus і setTaskPriority змінюють лише коректні значення', () => {
  assert.equal(setTaskStatus({ id: 1, status: 'done' }), true);
  assert.equal(setTaskStatus({ id: 1, status: 'bad' }), false);
  assert.equal(setTaskPriority({ id: 1, priority: 'low' }), true);
  assert.equal(setTaskPriority({ id: 1, priority: 'bad' }), false);
  const task = taskState.tasks.find((item) => item.id === 1);
  assert.equal(task.status, 'done');
  assert.equal(task.priority, 'low');
});

test('deleteTask: видаляє один елемент через findIndex() та splice()', () => {
  assert.equal(deleteTask(3), true);
  assert.equal(taskState.tasks.length, 5);
  assert.equal(taskState.tasks.some((task) => task.id === 3), false);
});

test('deleteTask: неіснуючий ID повертає false і не змінює список', () => {
  assert.equal(deleteTask(999), false);
  assert.equal(taskState.tasks.length, 6);
});

test('нові ID не повторюються після видалення останнього завдання', () => {
  deleteTask(6);
  addTask(valid);
  assert.equal(taskState.tasks[0].id, 6);
});
