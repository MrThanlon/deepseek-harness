/**
 * Runtime smoke test.
 *
 * Boots the Cordis context in Node, loads the same framework + application
 * plugins as the browser entry, and renders the root slot to a string. This
 * proves that the slot protocol works end-to-end (plugin -> register -> render)
 * without needing a headless browser. Run with `pnpm smoke`.
 */
import { Context } from '@deepseek-ai/cordis'
import { renderToString } from 'react-dom/server'
import { SlotsPlugin, type SlotRegistry } from '../src/dsh/slots.ts'
import { UiRendererPlugin, SlotOutlet } from '../src/dsh/renderer.tsx'
import { LayoutPlugin } from '../src/plugins/layout/index.tsx'
import { ChromePlugin } from '../src/plugins/chrome/index.tsx'
import { HelloWorldPlugin } from '../src/plugins/hello-world/index.tsx'

async function main() {
  const ctx = new Context()
  await ctx.plugin(SlotsPlugin)
  await ctx.plugin(UiRendererPlugin)
  await ctx.plugin(LayoutPlugin)
  await ctx.plugin(ChromePlugin)
  await ctx.plugin(HelloWorldPlugin)

  const slots = ctx.slots as SlotRegistry
  const html = renderToString(<SlotOutlet name="app" slots={slots} />)

  if (!html.includes('Hello World')) {
    throw new Error('Smoke failed: "Hello World" was not rendered')
  }
  if (!html.includes('app.content')) {
    throw new Error('Smoke failed: expected the slot annotation text to render')
  }
  if (!html.includes('Cordis Web Frontend')) {
    throw new Error('Smoke failed: header chrome did not render')
  }

  console.log('✓ Smoke passed: the plugin-assembled tree renders correctly.')
  console.log('  - app.content -> "Hello World" (HelloWorldPlugin)')
  console.log('  - app.header  -> "Cordis Web Frontend" (ChromePlugin)')
  console.log('  - app.footer  -> chrome footer (ChromePlugin)')
  console.log('\nRendered fragment:\n' + html.slice(0, 400))
  await ctx.fiber.dispose()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
