<script setup>
defineProps({ count: { type: Number, required: true } });
</script>
<template><div class="tf3-counter" role="status" aria-live="polite">Знайдено: {{ count }}</div></template>
