/**
 * Browser entry for the migrated frontend.
 *
 * It boots the Cordis context (which loads the slot registry, the UI renderer
 * and the application plugins) and hands the mount point over. Any plugin
 * failure surfaces on the page so a broken assembly is visible.
 */
import { bootApp } from '@/dsh/boot'
import '@/app.css'

const container = document.getElementById('root')
if (container === null) throw new Error('frontend: missing #root')

bootApp(container).catch((reason: unknown) => {
  console.error(reason)
  const message = reason instanceof Error ? reason.message : String(reason)
  document.body.innerHTML = `<pre>Failed to boot the frontend:\n${message}</pre>`
})
