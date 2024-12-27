// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['@/public/css/main.css'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  nitro: {
    preset: 'cloudflare-pages'
  },

  modules: ['nitro-cloudflare-dev'],

  routeRules: {
    '/': { prerender: true, ssr: true }
  },

  app: { pageTransition: { name: 'page', mode: 'out-in' } }
})
