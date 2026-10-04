import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'


// https://vite.dev/config/
export default defineConfig({
  define: {
    // Baked at build time from the GitHub Release tag (CODRYN_VERSION).
    // Falls back to empty string for local dev; the Go side resolves
    // the full version via internal/version at runtime.
    __APP_VERSION__: JSON.stringify(
      process.env.CODRYN_VERSION ?? process.env.APP_VERSION ?? '',
    ),
  },  plugins: [
    vueDevTools(),
    vue(),
    vueJsx(),
    tailwindcss(),
    Icons({ compiler: 'vue3' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@stream-markdown/core': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/core/src/index.ts', import.meta.url)),
      '@stream-markdown/code': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/extensions/code/src/index.ts', import.meta.url)),
      '@stream-markdown/html': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/extensions/html/src/index.ts', import.meta.url)),
      '@stream-markdown/math': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/extensions/math/src/index.ts', import.meta.url)),
      '@stream-markdown/mermaid': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/extensions/mermaid/src/index.ts', import.meta.url)),
      '@markmend/ast': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/markmend/ast/src/index.ts', import.meta.url)),
      '@markmend/core': fileURLToPath(new URL('./src/vendor/vue-stream-markdown/markmend/core/src/index.ts', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/workspaces': {
        target: 'http://localhost:4567',
        changeOrigin: true,
      },
      '/providers': {
        target: 'http://localhost:4567',
        changeOrigin: true,
      },
      '/settings': {
        target: 'http://localhost:4567',
        changeOrigin: true,
      },
    },
  },
})
