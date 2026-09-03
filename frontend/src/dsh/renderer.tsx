/**
 * UI renderer: the React half of the slot assembly.
 *
 * The renderer does not know the application layout. It mounts the root slot
 * (`app`) and forwards the slot registry to every occupant, so the entire tree
 * (header/content/footer, and the content inside those) is composed by plugins
 * registering into slots. This is the migrated equivalent of the original
 * `@deepseek-ai/dsh-client-ui-renderer` slot renderer.
 */
import { useSyncExternalStore } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Context } from '@deepseek-ai/cordis'
import type { SlotRegistry } from './slots.ts'

/** The `uiRenderer` service face consumed by the boot kernel (`ctx.uiRenderer`). */
export interface UiRendererService {
  /**
   * Mount the slot tree into a DOM container.
   * @returns a disposer that unmounts the React root.
   */
  mount(container: HTMLElement): () => void
  /** Unmount the React root if mounted. */
  dispose(): void
}

export interface SlotOutletProps {
  /** Slot key to render. */
  name: string
  /** The slot registry. */
  slots: SlotRegistry
}

/**
 * Render one slot's occupants.
 *
 * Subscribes to the slot's version so the tree reacts when a plugin registers
 * or unregisters a component at runtime — this is what makes the UI genuinely
 * "assembled by plugins."
 */
export function SlotOutlet({ name, slots }: SlotOutletProps) {
  useSyncExternalStore(
    (callback) => slots.subscribe(name, callback),
    () => slots.getVersion(name),
    // SSR-safe snapshot: the version is a stable primitive, so reading it on
    // the server and hydrating on the client line up.
    () => slots.getVersion(name),
  )
  const components = slots.get(name)
  return (
    <>
      {components.map((Component, index) => (
        // `index` is safe as the key: occupants are appended in registration
        // order and re-render wholesale on change.
        <Component key={`${name}:${index}`} slots={slots} />
      ))}
    </>
  )
}

/**
 * Root application. The `app` slot is the single entry point that a layout
 * plugin fills in; its component is then responsible for rendering the child
 * slots. This keeps the shell itself free of layout knowledge.
 */
function App({ slots }: { slots: SlotRegistry }) {
  return <SlotOutlet name="app" slots={slots} />
}

class UiRenderer {
  #root: Root | undefined
  #slots: SlotRegistry

  constructor(slots: SlotRegistry) {
    this.#slots = slots
  }

  mount(container: HTMLElement): () => void {
    this.dispose()
    this.#root = createRoot(container)
    this.#root.render(<App slots={this.#slots} />)
    return () => this.dispose()
  }

  dispose(): void {
    this.#root?.unmount()
    this.#root = undefined
  }
}

/**
 * Cordis plugin that provides `ctx.uiRenderer` once `ctx.slots` is available.
 *
 * The renderer owns the React root and re-renders the slot tree whenever a slot
 * changes. Unloading the context disposes the React root.
 */
export const UiRendererPlugin = (ctx: Context): void => {
  ctx.inject(['slots'], (ctx) => {
    const renderer = new UiRenderer(ctx.slots)
    ctx.provide('uiRenderer', renderer)
    return () => renderer.dispose()
  })
}
