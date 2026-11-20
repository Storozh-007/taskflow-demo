import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import './css/app.css';
import App from './App.vue';
Framework7.use(Framework7Vue);
const app = createApp(App);
// Підключаємо Pinia до спільного екземпляра Vue-застосунку.
app.use(createPinia());
// Реєстрацію компонентів Framework7 зберігаємо.
registerComponents(app);
app.mount('#app');
