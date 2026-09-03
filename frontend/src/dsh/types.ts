/**
 * Slot contract table.
 *
 * Each key is a slot name; the value describes how the slot is rendered. This
 * mirrors the original `@deepseek-ai/dsh-client-ui-slots` `SlotMap` pattern
 * (where owners merge keys via `declare module` augmentation). Here it is kept
 * as a single documented map so the assembled structure is obvious and so new
 * plugins know which slots exist.
 */

/** A single occupant renders last-registered-wins semantics (one component). */
export interface SingleSlot {
  kind: 'single'
}

/** An ordered list of occupants, all rendered in registration order. */
export interface ListSlot {
  kind: 'list'
}

export interface SlotMap {
  /** Root slot: the whole application. A layout plugin fills this. */
  app: SingleSlot
  /** Top chrome slot: brand / title. */
  'app.header': SingleSlot
  /** Main content slot: the page body. */
  'app.content': ListSlot
  /** Bottom chrome slot: footer / status. */
  'app.footer': SingleSlot
}

export type SlotKey = keyof SlotMap & string

export type SlotDef = SlotMap[SlotKey]
