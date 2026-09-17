/**
 * Verificación de la Fase 3 (backend): close_table_session y el panorama de
 * mesas, contra el proyecto Supabase real. Usa el tenant demo (anon-operable)
 * para la lógica de negocio y el tenant privado "bar-prueba" para confirmar
 * que un anónimo sin sesión de staff NO puede cerrar mesas ajenas.
 *
 *   node scripts/verify-staff-ops.mjs
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    }),
)
const anon = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })

const DEMO_RID = '00000000-0000-4000-8000-000000000001'
const MESA_7 = '00000000-0000-4000-8000-000000000307' // demo_uuid(3, 7)

let failed = 0
const results = []
async function check(name, fn) {
  try {
    const detail = await fn()
    results.push(`  ✔ ${name}${detail ? ` — ${detail}` : ''}`)
  } catch (e) {
    failed++
    results.push(`  ✘ ${name}\n      ${e.message ?? e}`)
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}
const rpcError = async (fn, args) => {
  const { error } = await anon.rpc(fn, args)
  return error?.message ?? null
}

// ── Panorama de mesas (misma lógica que services/tables.ts) ───────────────
let mesa7SessionId
await check('mesa 7 (demo) tiene una sesión abierta con un pedido en cocina', async () => {
  const { data: sessions, error: e1 } = await anon
    .from('table_sessions')
    .select('id, status')
    .eq('table_id', MESA_7)
    .neq('status', 'closed')
  assert(!e1, e1?.message)
  assert(sessions.length === 1, `esperaba 1 sesión abierta, hay ${sessions.length}`)
  mesa7SessionId = sessions[0].id

  const { data: orders, error: e2 } = await anon.from('orders').select('status').eq('session_id', mesa7SessionId)
  assert(!e2, e2?.message)
  assert(orders.some((o) => o.status === 'kitchen'), 'esperaba un pedido en cocina')
})

await check('close_table_session rechaza una mesa con pedidos activos', async () => {
  const err = await rpcError('close_table_session', { p_session_id: mesa7SessionId })
  assert(err?.includes('SESSION_HAS_ACTIVE_ORDERS'), `esperaba SESSION_HAS_ACTIVE_ORDERS, vino ${err}`)
})

await check('close_table_session con un id inexistente → SESSION_NOT_FOUND', async () => {
  const err = await rpcError('close_table_session', { p_session_id: '00000000-0000-0000-0000-000000000000' })
  assert(err?.includes('SESSION_NOT_FOUND'), `esperaba SESSION_NOT_FOUND, vino ${err}`)
})

await check('al entregar el pedido, close_table_session cierra la mesa y resuelve sus alertas', async () => {
  const { data: orders } = await anon.from('orders').select('id, status').eq('session_id', mesa7SessionId)
  const kitchenOrder = orders.find((o) => o.status === 'kitchen')
  await anon.from('orders').update({ status: 'ready' }).eq('id', kitchenOrder.id)
  await anon.from('orders').update({ status: 'delivered' }).eq('id', kitchenOrder.id)

  // dejamos una alerta abierta en la sesión para confirmar que se resuelve al cerrar
  await anon.from('alerts').insert({ restaurant_id: DEMO_RID, table_id: MESA_7, session_id: mesa7SessionId, type: 'waiter' })

  const { data, error } = await anon.rpc('close_table_session', { p_session_id: mesa7SessionId })
  assert(!error, error?.message)
  void data

  const { data: session } = await anon.from('table_sessions').select('status, closed_at').eq('id', mesa7SessionId).single()
  assert(session.status === 'closed' && session.closed_at, `sesión no quedó cerrada: ${JSON.stringify(session)}`)

  const { data: alerts } = await anon.from('alerts').select('resolved_at').eq('session_id', mesa7SessionId)
  assert(alerts.every((a) => a.resolved_at), 'quedó una alerta sin resolver')
})

await check('close_table_session es idempotente (mesa ya cerrada)', async () => {
  const { error } = await anon.rpc('close_table_session', { p_session_id: mesa7SessionId })
  assert(!error, error?.message ?? 'no debería fallar')
})

// ── Aislamiento: anon no puede cerrar mesas de un restaurante privado ─────
await check('anon NO puede cerrar la mesa de un restaurante privado (bar-prueba)', async () => {
  const { data: place, error: e1 } = await anon.rpc('place_order', {
    p_token: 'prueba-mesa-02',
    p_items: [{ menu_item_id: '00000000-0000-4000-8000-00000000f042', qty: 1 }],
  })
  assert(!e1, e1?.message)
  const err = await rpcError('close_table_session', { p_session_id: place.session_id })
  assert(err?.includes('NOT_AUTHORIZED'), `esperaba NOT_AUTHORIZED, vino ${err}`)
})

// ── Deja el demo como lo encontramos ───────────────────────────────────────
await check('reset_demo restaura el tenant demo', async () => {
  const { error } = await anon.rpc('reset_demo')
  assert(!error, error?.message)
})

console.log(results.join('\n'))
console.log(failed ? `\n${failed} verificación(es) fallaron` : '\nTodo OK')
process.exit(failed ? 1 : 0)
