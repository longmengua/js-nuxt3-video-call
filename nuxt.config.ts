// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  // hooks: {
  //   'build:done': () => {
  //     setTimeout(() => {
  //       process.exit(0);
  //     }, 100); // Adjust the timeout as needed
  //   }
  // },
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
  //   // Homepage pre-rendered at build time
  //   '/': { prerender: true },
  //   // Products page generated on demand, revalidates in background, cached until API response changes
  //   '/products': { swr: true },
  //   // Product page generated on demand, revalidates in background, cached for 1 hour (3600 seconds)
  //   '/products/**': { swr: 3600 },
  //   // Blog posts page generated on demand, revalidates in background, cached on CDN for 1 hour (3600 seconds)
  //   '/blog': { isr: 3600 },
  //   // Blog post page generated on demand once until next deployment, cached on CDN
  //   '/blog/**': { isr: true },
  //   // Admin dashboard renders only on client-side
  //   '/admin/**': { ssr: false },
  //   // Add cors headers on API routes
    '/api/**': { cors: true },
  //   // Redirects legacy urls
  //   '/old-page': { redirect: '/new-page' }
  },
  devtools: {
    enabled: true,
  },
  nitro: {
    experimental: {
      websocket: true
    },
  },
})