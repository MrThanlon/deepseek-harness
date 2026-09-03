/**
 * Example plugin — the "Hello World" of the migrated slot system.
 *
 * Registers a component into the `app.content` slot. Logically it knows
 * nothing about the renderer or the page frame: it merely contributes an
 * occupant to a slot that the layout plugin already declared. This is the
 * exact model of how the DeepSeek Harness client is composed from many
 * independent Cordis UI plugins.
 */
import type { Context } from '@deepseek-ai/cordis'

function HelloWorld() {
  return (
    <section className="hello-world">
      <h1>Hello World</h1>
      <p>
        This message is rendered by a Cordis plugin registered into the{' '}
        <code>app.content</code> slot.
      </p>
    </section>
  )
}

/** Cordis plugin that contributes the Hello World component to `app.content`. */
export const HelloWorldPlugin = (ctx: Context): (() => void) | void => {
  ctx.inject(['slots'], (ctx): (() => void) | void => {
    const slots = ctx.slots
    return slots.register('app.content', () => <HelloWorld />)
  })
}
