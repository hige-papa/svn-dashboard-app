// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
export default defineNuxtConfig({
  //...
  build: {
    transpile: ['vuetify', 'chart.js'],
  },
  
  // コンポーネントの自動インポート設定
  components: {
    dirs: [
      // 基本コンポーネント
      {
        path: '~/components',
        pathPrefix: false,
      },
      // 機能ごとのサブディレクトリ内のコンポーネント
      {
        path: '~/components/Calendar/DailyView',
        prefix: 'Daily',
        pathPrefix: false,
      },
      {
        path: '~/components/Calendar/WeeklyView',
        prefix: 'Weekly',
        pathPrefix: false,
      },
      {
        path: '~/components/Calendar/MonthlyView',
        prefix: 'Monthly',
        pathPrefix: false,
      }
    ],
  },

  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    '@nuxt/content'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    optimizeDeps: {
      include: ['chart.js'],
    },
  },
  ssr: false,
  compatibilityDate: '2024-11-01',
  // devtools: { enabled: true }
  devtools: { enabled: false }
})
