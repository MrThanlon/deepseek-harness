/**
 * Chrome plugin.
 *
 * Contributes the always-present chrome (header title + footer note) into the
 * `app.header` and `app.footer` slots declared by the layout plugin. It shows
 * how one plugin can fill several disjoint slots and how a plugin that does not
 * provide a "page" still contributes to the shell.
 */
import type { Context } from '@deepseek-ai/cordis'

function AppHeader() {
  return <span className="app-title">Cordis Web Frontend</span>
}

function AppFooter() {
  return (
    <span>
      UI assembled entirely by Cordis plugins through slots · Nitro + Vite
    </span>
  )
}

/** Cordis plugin that fills the header and footer chrome slots. */
export const ChromePlugin = (ctx: Context): (() => void) | void => {
  ctx.inject(['slots'], (ctx): (() => void) | void => {
    const slots = ctx.slots
    const disposeHeader = slots.register('app.header', () => <AppHeader />)
    const disposeFooter = slots.register('app.footer', () => <AppFooter />)
    return () => {
      disposeHeader()
      disposeFooter()
    }
  })
}
