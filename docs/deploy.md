# Deploy — Menú Digital

Estado actual y reglas de operación de los dos entornos: base de datos (Supabase) + frontend (Vercel).

## 0. Estado actual

**Desarrollo y producción están separados y configurados.** Ya se puede dar de alta un restaurante real
siguiendo `docs/alta-restaurante.md`.

| | Desarrollo (dev) | Producción (prod) |
|---|---|---|
| Proyecto Supabase | `oopowxlxpwsjpmpyuckm` | proyecto propio (ref en el dashboard de Supabase) |
| Datos | tenant demo + "Bar de Prueba" (`supabase/seed.sql`) + pruebas | tenant demo + restaurantes reales. **Sin seed.** |
| Quién lo usa | `npm run dev` (`.env.local`), deploys **Preview** de Vercel | deploy **Production** de Vercel |
| Scripts `db:verify*` | sí | **no** (ver §3) |

Reglas:

- `.env.local` apunta **siempre a dev**. Nunca poner ahí las claves de prod: así `npm run dev` jamás toca datos
  reales.
- En Vercel (Settings → Environment Variables), `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` tienen valores de
  **prod** en el scope *Production* y de **dev** en *Preview*/*Development*. Vite incrusta las variables `VITE_*`
  en el bundle **al hacer el build**: después de cambiarlas en Vercel hay que hacer **Redeploy**.
- La `service_role` key no va nunca en el frontend ni en el repo (la anon key sí es pública por diseño: lo que
  protege los datos es RLS).

## 1. Supabase

### Migraciones (el esquema)

Toda migración nueva se prueba primero en **dev** (`npm run db:push`, `db:types`, `db:verify`,
`db:verify:staff`) y recién después se aplica a prod:

```bash
npx supabase projects list                      # confirmar a qué proyecto está vinculada la CLI
npx supabase link --project-ref <ref-de-prod>   # apuntar a PROD (pide la password de la base)
npx supabase db push --linked                   # SOLO migraciones, sin seed
npx supabase link --project-ref oopowxlxpwsjpmpyuckm   # volver a DEV enseguida
```

> ⚠️ **Nunca `npm run db:push` contra prod**: ese script lleva `--include-seed` y subiría el tenant de pruebas
> "Bar de Prueba" a producción. En prod va sólo `supabase db push --linked`.
>
> ⚠️ `supabase link` guarda el proyecto vinculado en `supabase/.temp/` (ignorado por git). Olvidarse de volver a
> dev significa que el próximo `db:push` de desarrollo va a producción. Ante la duda, `supabase projects list`.

### Configuración del dashboard (ya aplicada en ambos proyectos; revisar si se crea otro)

1. **Database → Extensions**: `pg_cron` habilitado; **Integrations → Cron**: job `reset-demo` programado
   (lo crean `20260917000500_demo_data_and_cron.sql` / `20260918000200_confirm_cron.sql`).
2. **Storage**: bucket público `restaurant-media` (lo crea `20260918000100_storage_media.sql`).
3. **Authentication → URL Configuration**: *Site URL* = dominio de la app y *Redirect URLs* con
   `https://<dominio>/**`. Sin esto el link del email de confirmación (que vuelve a `origin + '/registro'`,
   `RegisterPage.tsx`) no redirige a la app y el alta del dueño no termina.
4. **Authentication → Email**: confirmación de email por link activada (comportamiento esperado, ver
   `CLAUDE.md` §5c).

### Email de confirmación: puede caer en spam

Comprobado con un usuario de prueba en prod: el email de confirmación llega a **spam** en Gmail y hay que
marcarlo como "No es spam" para poder usar el link. Mientras no haya SMTP propio con dominio autenticado
(SPF/DKIM, p. ej. con Resend — pendiente, ver `docs/nuevas-funcionalidades.md`), al dar de alta un cliente:

- avisarle que revise **spam/correo no deseado**, o hacer el alta junto a él;
- plan B si el email no llega: dashboard → **Authentication → Users → Add user** con **Auto Confirm User**,
  iniciar sesión en `/login` y, ya logueado, `/registro` → "Crear mi restaurante" (con sesión, crea el
  restaurante directo, sin email).

## 2. Frontend en Vercel

- Framework preset **Vite**; build `npm run build`, output `dist` (por defecto).
- `vercel.json` define el rewrite de SPA (`/(.*)` → `/index.html`) para que `/r/:slug/m/:token` no dé 404 al
  recargar.
- Cada push a `main` despliega Production (prod); cada rama/PR genera un Preview contra dev.
- Dominio: por ahora el de Vercel (`*.vercel.app`). Los QR impresos llevan ese dominio: si se cambia a un
  dominio propio, los QR viejos siguen funcionando mientras exista el alias `*.vercel.app` del proyecto, pero
  conviene definir el dominio definitivo **antes** de imprimir QR para clientes nuevos.

## 3. Verificación

- `npm run db:verify` y `npm run db:verify:staff` **sólo corren contra dev**: leen `.env.local` (dev) y dependen
  del tenant "Bar de Prueba" del seed, que en prod no existe a propósito.
- En prod se verifica a mano después de cada deploy o migración: `/demo` en las cuatro vistas (pedido desde
  `/demo/m/demo-mesa-04` → llega a `/demo/mozo` sin recargar → `/demo/cocina`), y ante cambios grandes un
  recorrido de `docs/alta-restaurante.md` §6 sobre un restaurante real.

## 4. CI

`.github/workflows/ci.yml` corre `lint`, `typecheck`, `test` y `build` en cada push/PR a `main`. Si el repo tiene
los secrets `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (Settings → Secrets → Actions), el build de CI los usa;
si no, igual pasa: `vite build` no ejecuta el cliente de Supabase (el error de `lib/supabase.ts` por variables
faltantes es en runtime, no en build).

## 5. Borrar un restaurante (manual, sólo desde el dashboard)

No hay UI para borrar un restaurante (decisión deliberada: es irreversible y se hace muy rara vez). Todas las
tablas del tenant cuelgan de `restaurants` con `on delete cascade`, así que en el **SQL Editor** del proyecto
correcto:

1. Anotar el id y los usuarios del tenant:
   ```sql
   select r.id, r.name, s.id as user_id, s.display_name, s.role
   from restaurants r left join staff s on s.restaurant_id = r.id
   where r.slug = '<slug>';
   ```
2. Borrar el restaurante (arrastra sectores, mesas, menú, sesiones, pedidos, alertas, staff e invitaciones):
   ```sql
   delete from restaurants where slug = '<slug>' and not is_demo;
   ```
3. **Authentication → Users**: borrar los usuarios anotados en el paso 1 (la cascada borra su fila `staff`, pero
   la cuenta de login en `auth.users` queda huérfana hasta borrarla a mano).
4. **Storage → `restaurant-media`**: borrar la carpeta `<id del restaurante>/` (logo y fotos; Storage no
   participa de la cascada de Postgres).

Nunca borrar el tenant `demo` (`is_demo = true`): lo recrea `reset_demo()`, pero la demo pública queda rota
hasta el próximo reset.
