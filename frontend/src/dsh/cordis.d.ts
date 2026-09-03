/**
 * Cordis context augmentation for the migrated frontend.
 *
 * The client shell adds `ctx.slots` and `ctx.uiRenderer` as provided services.
 * Declaring them here gives every plugin typed access through the context,
 * matching the `@deepseek-ai/cordis` consumer pattern used across the original
 * client packages.
 */
import type { SlotRegistry } from './slots.ts'
import type { UiRendererService } from './renderer.tsx'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** The slot registry service, provided by {@link SlotsPlugin}. */
    slots: SlotRegistry
    /** The UI renderer service, provided by {@link UiRendererPlugin}. */
    uiRenderer: UiRendererService
  }
}
