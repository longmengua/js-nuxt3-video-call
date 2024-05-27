// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },
  nitro: {
    experimental: {
      websocket: true
    },
  },
  runtimeConfig: {
    public: {
      SOCKET_URL: process.env.SOCKET_URL,
    },
    private: {
      WEBRTC_ROOMS_MAP: {} as Record<string, any>,
      LIMITED_PPL_A_ROOM: 2,
    },
  },
})