import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import initialTasks from '../src/data/tasks.js';
import {
  taskState,
  addTask,
  updateTask,
  setTaskStatus,
  setTaskPriority,
  isValidTaskDate,
  isDuplicateTaskTitle,
  todayDate,
} from '../src/store/tasks.js';

const valid = {
  title: 'Підготувати презентацію',
  description: 'Практична робота з реактивних форм',
  status: 'todo',
  priority: 'medium',
  category: 'study',
  dueDate: '2029-01-15',
};

beforeEach(() => {
  taskState.tasks.splice(0, taskState.tasks.length, ...initialTasks.map(task => ({ ...task })));
});

test('початковий стан містить 6 завдань', () => {
  assert.equal(taskState.tasks.length, 6);
});

test('невалідні дані відхиляються валідацією сховища', () => {
  assert.equal(addTask(null), null);
  assert.equal(addTask({ ...valid, title: 'A' }), null); // менше 3 символів
  assert.equal(addTask({ ...valid, title: 'x'.repeat(81) }), null); // більше 80 символів
  assert.equal(addTask({ ...valid, description: 'x'.repeat(301) }), null); // більше 300 символів
  assert.equal(addTask({ ...valid, dueDate: '2020-01-01' }), null); // минула дата для нового
  assert.equal(addTask({ ...valid, dueDate: 'not-a-date' }), null); // некоректна дата
  assert.equal(addTask({ ...valid, status: 'unknown' }), null); // недозволений статус
  assert.equal(addTask({ ...valid, priority: 'urgent' }), null); // недозволений пріоритет
  assert.equal(addTask({ ...valid, category: 'gaming' }), null); // недозволена категорія
});

test('додавання формує новий ID = max(ID) + 1', () => {
  const created = addTask(valid);
  assert.equal(created.id, 7);
  assert.equal(taskState.tasks.length, 7);
  assert.equal(created.title, 'Підготувати презентацію');
  assert.equal(created.category, 'study');
});

test('редагування змінює задачу й зберігає ID', () => {
  addTask(valid);
  const result = updateTask({
    id: 7,
    ...valid,
    title: 'Оновлена презентація',
    priority: 'high',
    status: 'progress',
  });
  assert.equal(result.id, 7);
  assert.equal(result.title, 'Оновлена презентація');
  assert.equal(result.priority, 'high');
  assert.equal(result.status, 'progress');
});

test('перевірка унікальності назви без урахування регістру', () => {
  addTask(valid);
  assert.equal(isDuplicateTaskTitle('підготувати презентацію'), true);
  assert.equal(isDuplicateTaskTitle('ПІДГОТУВАТИ ПРЕЗЕНТАЦІЮ'), true);
  assert.equal(isDuplicateTaskTitle('Підготувати презентацію', 7), false); // виняток власного id
  assert.equal(addTask({ ...valid, title: 'ПІДГОТУВАТИ ПРЕЗЕНТАЦІЮ' }), null);
});

test('старі завдання допускають незмінену минулу дату при редагуванні', () => {
  const old = taskState.tasks[0];
  assert.ok(updateTask({ ...old, title: 'Оновлена стара задача' }));
  // Зміна на іншу минулу дату повинна бути відхилена
  assert.equal(updateTask({ ...old, title: 'Оновлена стара задача', dueDate: '2020-01-01' }), null);
});

test('статус і пріоритет змінюються через store', () => {
  setTaskStatus({ id: 1, status: 'done' });
  setTaskPriority({ id: 1, priority: 'low' });
  assert.equal(taskState.tasks[0].status, 'done');
  assert.equal(taskState.tasks[0].priority, 'low');
});

test('валідація календарних дат враховує високосні роки', () => {
  assert.equal(isValidTaskDate('2028-02-29'), true);
  assert.equal(isValidTaskDate('2027-02-29'), false);
  assert.equal(isValidTaskDate('2026-13-01'), false);
  assert.equal(isValidTaskDate('2026-04-31'), false);
});

test('підтримується замовчування категорії при відсутності поля', () => {
  const withoutCategory = {
    title: 'Завдання без категорії',
    description: 'Опис',
    status: 'todo',
    priority: 'low',
    dueDate: '2029-05-20',
  };
  const task = addTask(withoutCategory);
  assert.ok(task);
  assert.equal(task.category, 'study');
});
