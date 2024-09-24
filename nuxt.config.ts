export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      SOCKET_URL: process.env.SOCKET_URL,
    },
    private: {
      // for default configurations
      WEBRTC_ROOMS_MAP: {} as Record<string, any>,
      LIMITED_PPL_A_ROOM: 2,
    },
  },
  routeRules: {
    '/api/**': { cors: true },
  },

  devtools: {
    enabled: true,
  },

  nitro: {
    experimental: {
      websocket: true
    },
  },

  modules: ['@nuxtjs/tailwindcss'],

  compatibilityDate: '2024-08-30',
})