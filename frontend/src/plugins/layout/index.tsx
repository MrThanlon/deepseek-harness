/**
 * App-shell plugin.
 *
 * Fills the root `app` slot with the page frame and exposes child slots
 * (`app.header`, `app.content`, `app.footer`) that the rest of the app's
 * plugins populate. This is the migrated analogue of the original
 * `@deepseek-ai/dsh-client-ui-layout` package: the shell only declares the
 * slots; it does not know what occupies them.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { SlotRegistry } from '../../dsh/slots.ts'
import { SlotOutlet } from '../../dsh/renderer.tsx'

function AppFrame({ slots }: { slots: SlotRegistry }) {
  return (
    <div className="frame">
      <header className="frame__header">
        <SlotOutlet name="app.header" slots={slots} />
      </header>
      <main className="frame__content">
        <SlotOutlet name="app.content" slots={slots} />
      </main>
      <footer className="frame__footer">
        <SlotOutlet name="app.footer" slots={slots} />
      </footer>
    </div>
  )
}

/** Cordis plugin that provides the app frame for the root `app` slot. */
export const LayoutPlugin = (ctx: Context): (() => void) | void => {
  ctx.inject(['slots'], (ctx): (() => void) | void => {
    const slots = ctx.slots
    return slots.register('app', AppFrame)
  })
}
