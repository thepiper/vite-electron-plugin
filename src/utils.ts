import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export function debounce<Fn extends (...args: any[]) => void>(fn: Fn, delay = 299) {
  let t: NodeJS.Timeout
  return ((...args) => {
    // !t && fn(...args) // first call
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }) as Fn
}

/**
 * @see https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
 */
export const colours = {
  $_$: (c: number) => (str: string) => `\x1b[${c}m` + str + '\x1b[0m',
  gary: (str: string) => colours.$_$(90)(str),
  cyan: (str: string) => colours.$_$(36)(str),
  yellow: (str: string) => colours.$_$(33)(str),
  green: (str: string) => colours.$_$(32)(str),
  red: (str: string) => colours.$_$(31)(str),
}

export const JS_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
export const STATIC_JS_EXTENSIONS = ['.json', '.node', '.wasm']

export function ensureDir(filename: string): string {
  const dir = path.dirname(filename)
  !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true })
  return filename
}

export function jsType(filename: string) {
  return {
    js: !filename.endsWith('.d.ts') && JS_EXTENSIONS.some(ext => filename.endsWith(ext)),
    static: STATIC_JS_EXTENSIONS.some(ext => filename.endsWith(ext))
  }
}

function log(type: 'error' | 'info' | 'success' | 'warn', ...message: string[]) {
  const dict: Record<Parameters<typeof log>[1], Exclude<keyof typeof colours, '$_$'>> = {
    error: 'red',
    info: 'cyan',
    success: 'green',
    warn: 'yellow',
  }
  message = message.map(msg => colours[dict[type]](msg))
  console.log(...message)
}
export const logger: Record<Parameters<typeof log>[0] | 'log', (...message: string[]) => void> = {
  error: (...message: string[]) => log('error', ...message),
  info: (...message: string[]) => log('info', ...message),
  success: (...message: string[]) => log('success', ...message),
  warn: (...message: string[]) => log('warn', ...message),
  log: (...message: string[]) => console.log(...message),
}

const isWindows = os.platform() === 'win32'
function slash(p: string): string {
  return p.replace(/\\/g, '/')
}
export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

/**
 * - `'' -> '.'`
 * - `foo` -> `./foo`
 */
export function relativeify(relative: string) {
  if (relative === '') {
    return '.'
  }
  if (!relative.startsWith('.')) {
    return './' + relative
  }
  return relative
}
