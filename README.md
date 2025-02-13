# vite-electron-plugin

Fast, Electron plugin for Vite

[![NPM version](https://img.shields.io/npm/v/vite-electron-plugin.svg)](https://npmjs.org/package/vite-electron-plugin)
[![NPM Downloads](https://img.shields.io/npm/dm/vite-electron-plugin.svg)](https://npmjs.org/package/vite-electron-plugin)

- 🚀 Fast <sub><sup>(Not Bundle, based on esbuild)</sup></sub>
- 🎯 Plugin <sub><sup>(Like Vite's plugin)</sup></sub>
- 🔥 Hot reload
- 📦 Out of the box
- 🌱 What you see is what you get

## Install

```sh
npm i vite-electron-plugin -D
```

## Examples

- [quick-start](https://github.com/caoxiemeihao/vite-electron-plugin/tree/main/examples/quick-start)
- [plugin/alias](https://github.com/caoxiemeihao/vite-electron-plugin/tree/main/examples/alias)
- [plugin/copy](https://github.com/caoxiemeihao/vite-electron-plugin/tree/main/examples/copy)
- [plugin/custom-start-electron-app](https://github.com/caoxiemeihao/vite-electron-plugin/tree/main/examples/custom-start-electron-app)

## Recommend structure

Let's use the official [template-vanilla-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-vanilla-ts) created based on `create vite` as an example

```diff
+ ├─┬ electron
+ │ └── main.ts
  ├─┬ src
  │ ├── main.ts
  │ ├── style.css
  │ └── vite-env.d.ts
  ├── .gitignore
  ├── favicon.svg
  ├── index.html
  ├── package.json
  ├── tsconfig.json
+ └── vite.config.ts
```
## Conventions

- Any file ending with `reload.ext` *(e.g. `foo.reload.js`, `preload.ts`)* after an update,  
  will trigger a reload of the Electron-Renderer process, instead of an entire Electron App restart.  
  **Which is useful when updating Preload-Scripts.**

## Usage

vite.config.ts

```js
import electron from 'vite-electron-plugin'

export default {
  plugins: [
    electron({
      include: [
        // The Electron source codes directory
        'electron',
      ],
    }),
  ],
}
```

electron/main.ts

```js
import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  const win = new BrowserWindow()

  if (app.isPackaged) {
    win.loadFile('your-build-output-index.html')
  } else {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  }
})
```

## Plugin API

> The design of plugin is similar to [Vite's plugin](https://vitejs.dev/guide/api-plugin.html). But simpler, only 4 hooks in total.

#### `configResolved`

- **Type**: `(config: ResolvedConfig) => void | Promise<void>`
- **Kind**: `async`, `sequential`

You can freely modify the `config` argument in ths hooks or use.

#### `onwatch` <sub><sup>serve only</sup></sub>

- **Type**: `(envet: 'add' | 'change' | 'addDir' | 'unlink' | 'unlinkDir', path: string) => void`
- **Kind**: `async`, `parallel`

Triggered by `include` file changes. You can emit some files in this hooks. Even restart the Electron App.

#### `transform`

- **Type**: `(args: { filename: string, code: string, done: () => void }) => string | import('esbuild').TransformResult | void | Promise<string | import('esbuild').TransformResult | void>`
- **Kind**: `async`, `sequential`

Triggered by changes in `extensions` files in include.

#### `ondone`

- **Type**: `(args: { filename: string, distname: string }) => void`
- **Kind**: `async`, `parallel`

Triggered when `transform()` ends or a file in `extensions` is removed.

## Builtin Plugin

```ts
import path from 'path'
import electron from 'vite-electron-plugin'
import {
  alias,
  copy,
  customStart,
  loadViteEnv,
} from 'vite-electron-plugin/plugin'

export default {
  plugins: [
    electron({
      plugins: [
        alias([
          // `replacement` is recommented to use absolute path, 
          // it will be automatically calculated as relative path.
          { find: '@', replacement: path.join(__dirname, 'src') },
        ]),

        copy([
          // filename, glob
          { from: 'foo/*.ext', to: 'dest' },
        ]),

        customStart(({ startup }) => {
          // If you want to control the launch of Electron App yourself.
          startup()
        }),

        // https://vitejs.dev/guide/env-and-mode.html#env-files
        // Support use `import.meta.env.VITE_SOME_KEY` in Electron-Main
        loadViteEnv(),
      ],
    }),
  ],
}
```

## API <sub><sup>(Define)</sup></sub>

###### `electron(config: Configuration)`

```ts
export interface Configuration {
  /** Like Vite's plugin */
  plugins?: {
    name: string
    configResolved?: (config: ResolvedConfig) => void | Promise<void>
    /** Triggered by `include` file changes. You can emit some files in this hooks. */
    onwatch?: (envet: 'add' | 'change' | 'addDir' | 'unlink' | 'unlinkDir', path: string) => void
    /** Triggered by changes in `extensions` files in include */
    transform?: (args: {
      /** Raw filename */
      filename: string
      code: string
      /** Skip subsequent transform hooks */
      done: () => void
    }) => string | null | void | import('esbuild').TransformResult | Promise<string | null | void | import('esbuild').TransformResult>
    /** Triggered when `transform()` ends or a file in `extensions` is removed */
    ondone?: (args: {
      filename: string
      destname: string
    }) => void
  }[],
  /** @default process.cwd() */
  root?: string
  /** directory, filename, glob */
  include: string[]
  /** @default 'dist-electron' */
  outDir?: string
  /** Options of `esbuild.transform()` */
  transformOptions?: import('esbuild').TransformOptions
}
```

###### ResolvedConfig

```ts
export interface ResolvedConfig {
  plugins: Required<Configuration>['plugins']
  /** @default process.cwd() */
  root: string
  /** Relative path */
  include: string[]
  /** Absolute path */
  outDir: string
  /** Options of `esbuild.transform()` */
  transformOptions: import('esbuild').TransformOptions

  config: Configuration
  /** Vite's command */
  command: 'build' | 'serve',
  /** @default ['.ts', '.tsx', '.js', '.jsx'] */
  extensions: string[]
  /** The value is `null` at build time */
  watcher: import('chokidar').FSWatcher | null
  /** The value is `null` at build time */
  viteDevServer: import('vite').ViteDevServer | null,
  /** Internal functions (🚨 Experimental) */
  _fn: {
    /** Electron App startup function */
    startup: (args?: string[]) => void
    /** Reload Electron-Renderer */
    reload: () => void
    include2files: (config: ResolvedConfig, include?: string[]) => string[]
    include2globs: (config: ResolvedConfig, include?: string[]) => string[]
    replace2dest: (filename: string, replace2js?: boolean) => string
  }
}
```
