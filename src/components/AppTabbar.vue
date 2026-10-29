<template>
  <f7-toolbar bottom tabbar class="app-tabbar" aria-label="Основна навігація">
    <f7-link v-for="item in links" :key="item.id" :href="item.href"
      :class="{ 'app-link-active': active === item.id }"
      :aria-current="active === item.id ? 'page' : undefined">
      <f7-icon :f7="item.icon" aria-hidden="true" />
      <span class="app-tab-label">{{ item.label }}</span>
    </f7-link>
  </f7-toolbar>
</template>
<script setup>
defineProps({ active: { type: String, required: true } });
const links = [
  { id: 'home', href: '/', icon: 'house_fill', label: 'Головна' },
  { id: 'tasks', href: '/tasks/', icon: 'square_list_fill', label: 'Завдання' },
  { id: 'about', href: '/about/', icon: 'info_circle_fill', label: 'Про застосунок' },
];
</script>
