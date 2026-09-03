/**
 * Slot registry pure core.
 *
 * This is the migrated, framework-free heart of the DeepSeek Harness client
 * slot mechanism. An owner plugin appears by providing `ctx.slots`; any plugin
 * can then register components into named slots. The renderer (and nested slot
 * components) subscribe to a slot's version and re-render when its occupants
 * change, so the whole UI tree is assembled by plugins — exactly like the
 * original `@deepseek-ai/dsh-client-ui-slots` + `ui-renderer` pairing.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { ReactNode } from 'react'

/** Props delivered to every slot component: the registry (to render child slots). */
export interface SlotComponentProps {
  /** The slot registry, passed down so components can render child slots. */
  slots: SlotRegistry
  /** Arbitrary owner-supplied props passed through at the render site. */
  [key: string]: unknown
}

/** A registered slot occupant. Receives the standard `slots` prop plus owner props. */
export type SlotComponent = (props: SlotComponentProps) => ReactNode

interface Entry {
  readonly id: number
  readonly component: SlotComponent
}

/**
 * Reactive slot registry.
 *
 * @remarks
 * A slot is just a named list of components. Registering emits a version bump
 * for that slot that the renderer observes through `useSyncExternalStore`.
 */
export class SlotRegistry {
  #entries = new Map<string, Entry[]>()
  #versions = new Map<string, number>()
  #listeners = new Map<string, Set<() => void>>()
  #counter = 0

  /**
   * Register a component into a slot, appending to any existing occupants.
   * @param name - the slot key (e.g. `app.content`).
   * @param component - the component to render for this slot.
   * @returns a disposer that removes this occupant.
   */
  register(name: string, component: SlotComponent): () => void {
    const id = ++this.#counter
    const entry: Entry = { id, component }
    const list = this.#entries.get(name) ?? []
    list.push(entry)
    this.#entries.set(name, list)
    this.#bump(name)
    return () => {
      const current = this.#entries.get(name)
      if (!current) return
      const index = current.findIndex((item) => item.id === id)
      if (index >= 0) current.splice(index, 1)
      if (current.length === 0) this.#entries.delete(name)
      this.#bump(name)
    }
  }

  /** Components currently registered for a slot, in registration order. */
  get(name: string): SlotComponent[] {
    return (this.#entries.get(name) ?? []).map((entry) => entry.component)
  }

  /** Whether a slot has at least one occupant. */
  has(name: string): boolean {
    return (this.#entries.get(name)?.length ?? 0) > 0
  }

  /** Subscribe to a slot's occupant changes. */
  subscribe(name: string, listener: () => void): () => void {
    let set = this.#listeners.get(name)
    if (!set) {
      set = new Set()
      this.#listeners.set(name, set)
    }
    set.add(listener)
    return () => set!.delete(listener)
  }

  /** Monotonic version for a slot, used by `useSyncExternalStore` as the snapshot. */
  getVersion(name: string): number {
    return this.#versions.get(name) ?? 0
  }

  #bump(name: string): void {
    this.#versions.set(name, (this.#versions.get(name) ?? 0) + 1)
    for (const listener of this.#listeners.get(name) ?? []) listener()
  }
}

/**
 * Cordis plugin that provides `ctx.slots`.
 *
 * @remarks
 * This mirrors the `slots` service in the original client shell. Every
 * frontend plugin reaches the slot protocol through this service. The provide
 * is tied to the current fiber, so unloading the context unregisters it.
 */
export const SlotsPlugin = (ctx: Context): void => {
  ctx.provide('slots', new SlotRegistry())
}
