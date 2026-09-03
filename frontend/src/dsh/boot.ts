/**
 * Boot kernel for the migrated frontend.
 *
 * This is the slim equivalent of `@deepseek-ai/dsh-client-web`'s
 * {@link AppWebEntry}: it creates a Cordis root context, loads the framework
 * plugins (slot registry + UI renderer) and the application plugins that
 * register components into slots, and finally hands the mount point to the
 * renderer. The UI is composed entirely by plugins, not by a hard-coded tree.
 */
import { Context } from '@deepseek-ai/cordis'
import { SlotsPlugin } from './slots.ts'
import { UiRendererPlugin } from './renderer.tsx'
import { LayoutPlugin } from '../plugins/layout/index.tsx'
import { ChromePlugin } from '../plugins/chrome/index.tsx'
import { HelloWorldPlugin } from '../plugins/hello-world/index.tsx'

export interface BootHandle {
  /**
   * The Cordis context hosting every frontend plugin. Exposed for
   * introspection/tests; call {@link BootHandle.dispose} to unload the app.
   */
  ctx: Context
  /** Unload every plugin fiber and unmount the rendered tree. */
  dispose(): Promise<void>
}

/**
 * Boot the frontend against a mount point.
 * @param container - the DOM element to render into.
 * @returns a handle owning the context and its lifecycle.
 */
export async function bootApp(container: HTMLElement): Promise<BootHandle> {
  const ctx = new Context()

  // Framework plugins first: the slot registry, then the React renderer that
  // consumes it. `ctx.plugin()` returns a fiber; awaiting it settles once the
  // plugin has started (and, for injectful plugins, once their dependencies are
  // available).
  await ctx.plugin(SlotsPlugin)
  await ctx.plugin(UiRendererPlugin)

  // Application plugins — each registers components into slots. Order is not
  // semantically important because the renderer reacts to slot changes, but
  // loading them before mount shows the assembled tree on first paint.
  await ctx.plugin(LayoutPlugin)
  await ctx.plugin(ChromePlugin)
  await ctx.plugin(HelloWorldPlugin)

  // Hand the mount point to the renderer once it is provided. The disposer
  // returned by `mount` unmounts the React root when the fiber unloads.
  await ctx.inject(['uiRenderer'], (scope) => {
    scope.effect(() => scope.uiRenderer.mount(container))
  })

  return {
    ctx,
    dispose: () => ctx.fiber.dispose(),
  }
}
