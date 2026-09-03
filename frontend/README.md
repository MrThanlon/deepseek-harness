# Cordis Web Frontend

This is the **migrated frontend** of the DeepSeek Harness monorepo, extracted
into its own smallest-viable standalone project so it can be developed and
shipped independently.

In the original repo the whole `apps/web` + `packages/client/*` surface is a
single-page app that is **assembled entirely by Cordis plugins through slots**:
a boot kernel creates a Cordis `Context`, a slot registry and a React renderer
are provided as services, and every distinct UI package is a plugin that
registers components into named slots. This project keeps that exact assembly
model while replacing the monorepo plumbing with a **Nitro + Vite** build.

## Stack

| Layer          | Tool                                                        |
| -------------- | ----------------------------------------------------------- |
| Client bundler | [Vite](https://vite.dev) + `@vitejs/plugin-react`           |
| Server         | [Nitro](https://nitro.unjs.io) v3 via the `nitro/vite` plugin |
| UI             | React 18                                                     |
| Plugin system  | [@deepseek-ai/cordis](https://www.npmjs.com/package/@deepseek-ai/cordis) v4 |
| Package manager| pnpm (self-contained workspace)                              |

A single Vite config drives everything:

- `vite dev` runs **one** dev server: the SPA is served by Vite and the
  file-based `api/`, `routes/`, `middleware/` handlers are served by Nitro.
- `vite build` produces both the client bundle (`.output/public`) and the Nitro
  server (`.output/server`, preset `node-server`).
- `vite preview` / `node .output/server/index.mjs` serve the built output.

## Commands

```sh
pnpm install      # install (isolated; does not touch the parent monorepo)
pnpm dev          # unified Vite + Nitro dev server (http://localhost:4173)
pnpm build        # client bundle + Nitro server -> .output/
pnpm preview      # serve the built app from .output/
pnpm typecheck    # tsc --noEmit
pnpm smoke        # render the assembled tree to a string in Node (no browser)
```

## How the UI is assembled by plugins

There is no hard-coded application tree. The composition happens in four steps:

1. **Slot registry** (`src/dsh/slots.ts`) — provided on `ctx.slots`. It is an
   observable map from slot name -> list of components. Registering a component
   bumps a revision that the renderer observes.

2. **UI renderer** (`src/dsh/renderer.tsx`) — provided on `ctx.uiRenderer` once
   `ctx.slots` is available. It mounts the root `app` slot into the DOM and
   forwards the registry to every occupant via a `slots` prop, so nested slots
   can be rendered by plugins using `<SlotOutlet name="…" slots={…}/>`.

3. **Boot kernel** (`src/dsh/boot.ts`) — creates a `Context`, loads the
   framework plugins, then the application plugins, then hands the mount point
   to the renderer (the slim analogue of `@deepseek-ai/dsh-client-web`'s
   `AppWebEntry`).

4. **Application plugins** (`src/plugins/*`) — each one injects `['slots']` and
   calls `ctx.slots.register(name, component)`. Nothing about the shell is
   imported by a feature plugin; a plugin only declares which slot it fills.

### Slot map

Declared in `src/dsh/types.ts` (and mirrored by the components):

| Slot             | Kind   | Filled by                                          |
| ---------------- | ------ | -------------------------------------------------- |
| `app`            | single | `LayoutPlugin` (the page frame)                    |
| `app.header`     | single | `ChromePlugin` (title bar)                         |
| `app.content`    | list   | `HelloWorldPlugin` (renders **Hello World**)       |
| `app.footer`     | single | `ChromePlugin` (footer note)                       |

### Example plugin

`src/plugins/hello-world/index.tsx` is the canonical example. It contributes
"Hello World" to the `app.content` slot:

```tsx
import type { Context } from '@deepseek-ai/cordis'

function HelloWorld() {
  return (
    <section className="hello-world">
      <h1>Hello World</h1>
      <p>Rendered by a Cordis plugin registered into the `app.content` slot.</p>
    </section>
  )
}

export const HelloWorldPlugin = (ctx: Context): (() => void) | void => {
  ctx.inject(['slots'], (ctx): (() => void) | void => {
    const slots = ctx.slots
    return slots.register('app.content', () => <HelloWorld />)
  })
}
```

To add a new surface, declare the slot, then register a plugin into it — that's
all. To wire it into the running app, add the plugin to `boot.ts` (or, in a more
advanced port, to a Cordis loader manifest).

## Layout

```
frontend/
├─ api/                    # Nitro file-based API routes (server)
│  └─ hello.ts             # GET /api/hello
├─ public/                 # static assets
├─ scripts/
│  └─ ssr-smoke.tsx        # Node smoke test of the assembled tree
├─ src/
│  ├─ main.tsx             # browser entry -> bootApp(#root)
│  ├─ app.css
│  ├─ dsh/
│  │  ├─ slots.ts          # SlotRegistry + SlotsPlugin (ctx.slots)
│  │  ├─ renderer.tsx      # SlotOutlet + UiRendererPlugin (ctx.uiRenderer)
│  │  ├─ boot.ts           # bootApp: Context + plugin loading + mount
│  │  ├─ types.ts          # slot map
│  │  └─ cordis.d.ts       # Context augmentation (slots/uiRenderer)
│  └─ plugins/
│     ├─ layout/index.tsx  # app frame -> declares header/content/footer slots
│     ├─ chrome/index.tsx  # header title + footer note
│     └─ hello-world/index.tsx  # the "Hello World" example plugin
├─ vite.config.ts          # react() + nitro(), @ alias
├─ nitro.config.ts         # serverDir: "./" (enables api/ scanning)
├─ tsconfig.json
└─ package.json
```

## Notes

- The original client used a Cordis **Loader** (dynamic module table + per-plugin
  bundles). This port registers plugins directly via `ctx.plugin()` so the
  project runs with a plain Vite bundle while keeping the exact slot protocol.
  Bridging back to the loader is a drop-in extension of `boot.ts`.
- `nitro.config.ts` sets `serverDir: "./"` because Nitro 3's Vite plugin
  defaults it to `false`; without it the file-based API routes are not scanned.
- The workspace is self-contained (`pnpm-workspace.yaml` with `packages: ['.']`)
  so installing here never pulls in or mutates the parent Harness monorepo.
