import path from 'path'
import { rmSync } from 'fs'
import { defineConfig } from 'vite'
import electron from 'vite-electron-plugin'
import { loadViteEnv } from 'vite-electron-plugin/plugin'

rmSync(path.join(__dirname, 'dist-electron'), { recursive: true, force: true })

export default defineConfig({
  plugins: [electron({
    include: [
      'electron',
      // 'common.ts',
    ],
    plugins: [loadViteEnv()],
  })],
})
