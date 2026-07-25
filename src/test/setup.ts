import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import { afterEach } from 'vitest'

// Node 22+のグローバルlocalStorageがjsdom実装より優先して解決されるため、
// jsdomのStorage実装を明示的に注入する
const { localStorage } = new JSDOM('', { url: 'http://localhost:3000/' }).window
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorage,
  configurable: true,
})

afterEach(() => {
  cleanup()
})
