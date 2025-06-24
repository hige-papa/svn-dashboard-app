// plugins/chart.js
import { defineNuxtPlugin } from '#app';
import Chart from 'chart.js/auto';

export default defineNuxtPlugin(() => {
  return {
    provide: {
      Chart,
    },
  };
});