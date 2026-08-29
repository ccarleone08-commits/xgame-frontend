// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'
// import { VitePWA } from 'vite-plugin-pwa'
// import path from 'path'
// import { fileURLToPath } from 'url'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     VitePWA({
//       registerType: 'prompt',
//       injectRegister: false,
//       filename: 'sw.js',
//       strategies: 'generateSW',
//       manifest: {
//         name: 'XGame',
//         short_name: 'XGame',
//         description: 'Online casino and game platform. Internet connection required.',
//         start_url: '/',
//         scope: '/',
//         display: 'standalone',
//         display_override: ['standalone', 'minimal-ui'],
//         background_color: '#0b1511',
//         theme_color: '#264639',
//         icons: [
//           {
//             src: '/icons/icon-192.png',
//             sizes: '192x192',
//             type: 'image/png',
//           },
//           {
//             src: '/icons/icon-512.png',
//             sizes: '512x512',
//             type: 'image/png',
//           },
//           {
//             src: '/icons/maskable-icon-512.png',
//             sizes: '512x512',
//             type: 'image/png',
//             purpose: 'maskable',
//           },
//         ],
//       },
//       workbox: {
//         cleanupOutdatedCaches: true,
//         clientsClaim: false,
//         skipWaiting: false,
//         globPatterns: [
//           'index.html',
//           'favicon.ico',
//           'apple-touch-icon.png',
//           'assets/*.{js,css}',
//         ],
//         globIgnores: [
//           '**/Games/**/*',
//           '**/*.mp3',
//           '**/*.map',
//         ],
//         navigateFallback: '/index.html',
//         navigateFallbackDenylist: [
//           /^\/Games(?:\/|$)/i,
//           /^\/api(?:\/|$)/i,
//           /^\/hubs?(?:\/|$)/i,
//           /^\/sw\.js$/i,
//           /^\/workbox-.*\.js$/i,
//           /^\/manifest\.webmanifest$/i,
//           /^\/favicon\.ico$/i,
//           /^\/apple-touch-icon\.png$/i,
//           /\/[^/?]+\.[^/]+$/,
//         ],
//         runtimeCaching: [],
//       },
//       devOptions: {
//         enabled: false,
//       },
//     }),
//   ],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src')
//     }
//   },
//   server: {
//     host: true,
//   }
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),

    // Local HTTPS only for development
    command === 'serve' && basicSsl(),

    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      filename: 'sw.js',
      strategies: 'generateSW',

      manifest: {
        name: 'XGame',
        short_name: 'XGame',
        description:
          'Online casino and game platform. Internet connection required.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        background_color: '#0b1511',
        theme_color: '#264639',

        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,

        globPatterns: [
          'index.html',
          'favicon.ico',
          'apple-touch-icon.png',
          'assets/*.{js,css}',
          'assets/siteImages/Cards/cards.webp',
        ],

        globIgnores: [
          '**/Games/**/*',
          '**/*.mp3',
          '**/*.map',
        ],

        navigateFallback: '/index.html',

        navigateFallbackDenylist: [
          /^\/Games(?:\/|$)/i,
          /^\/api(?:\/|$)/i,
          /^\/hubs?(?:\/|$)/i,
          /^\/sw\.js$/i,
          /^\/workbox-.*\.js$/i,
          /^\/manifest\.webmanifest$/i,
          /^\/favicon\.ico$/i,
          /^\/apple-touch-icon\.png$/i,
          /\/[^/?]+\.[^/]+$/,
        ],

        runtimeCaching: [],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,
    https: command === 'serve',
    port: 5173,
  },
}))
