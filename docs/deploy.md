# Deploy — Menú Digital

Guía para poner el proyecto en producción: base de datos (Supabase) + frontend (Vercel).

## 1. Proyecto Supabase de producción

Hasta ahora todo el desarrollo corrió contra un proyecto Supabase de **desarrollo** (`oopowxlxpwsjpmpyuckm`,
vinculado con `supabase link`). Para vender hace falta un proyecto separado de **producción**:

1. Crear un proyecto nuevo en [supabase.com/dashboard](https://supabase.com/dashboard).
2. Vincular la CLI a ese proyecto (en una copia del repo o cambiando el link momentáneamente):
   ```bash
   supabase link --project-ref <ref-de-produccion>
   ```
3. Aplicar todas las migraciones (sin el seed de "Bar de Prueba", que es sólo para tests de aislamiento):
   ```bash
   supabase db push --linked
   ```
4. Confirmar en el dashboard → **Database → Extensions** que `pg_cron` está habilitado, y en
   **Integrations → Cron** que el job `reset-demo` quedó programado (la migración
   `20260918000200_confirm_cron.sql` lo programa si no existe, pero el resultado no se ve en el output de
   `db push` — hay que confirmarlo a mano en el dashboard). Si el proyecto de producción no debe tener tenant
   demo público, se puede desactivar el cron job o borrar el restaurante `demo` después de aplicar las
   migraciones.
5. Dashboard → **Storage**: confirmar que el bucket `restaurant-media` se creó (lo crea la migración
   `20260918000100_storage_media.sql`) y que es público.
6. Dashboard → **Authentication → Email**: confirmar que la confirmación de email por link está activada
   (comportamiento esperado, ver `CLAUDE.md` §5c) y, opcionalmente, personalizar la plantilla de email con el
   nombre del producto.
7. Copiar **Project URL** y **anon public key** (Settings → API) — son las variables de entorno del frontend.

## 2. Frontend en Vercel

1. Importar el repo de GitHub en [vercel.com](https://vercel.com/new). Framework preset: **Vite**.
2. Variables de entorno (Project Settings → Environment Variables), en **Production** (y **Preview** si se
   quiere probar contra el mismo proyecto):
   ```
   VITE_SUPABASE_URL=<Project URL del paso 1.7>
   VITE_SUPABASE_ANON_KEY=<anon public key del paso 1.7>
   ```
3. Build command / output quedan por defecto (`npm run build` / `dist`); `vercel.json` en la raíz ya define el
   rewrite de SPA (`/(.*)` → `/index.html`) para que rutas como `/r/:slug/m/:token` no den 404 al recargar.
4. Deploy. Verificar `/`, `/demo`, `/demo/mozo`, `/demo/cocina`, `/demo/admin` y un QR real de `/admin/mesas`
   (Fase 5) apuntando al dominio de Vercel.

## 3. CI

`.github/workflows/ci.yml` corre `lint`, `typecheck`, `test` y `build` en cada push/PR a `main`. Si el repo
tiene los secrets `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` configurados (Settings → Secrets → Actions), el
build de CI los usa; si no, el build igual pasa porque `vite build` no ejecuta el cliente de Supabase (sólo lo
empaqueta) — el error de `lib/supabase.ts` por variables faltantes es en runtime, no en build.

## 4. Después de cada deploy

- Recorrer `docs/alta-restaurante.md` para dar de alta un cliente de prueba en producción y confirmar que el
  flujo completo (registro → confirmar email → crear restaurante → cargar menú → mesa real → QR) funciona de
  punta a punta contra el proyecto productivo, no sólo contra dev.
- `npm run db:verify` y `npm run db:verify:staff` corren contra el proyecto **vinculado actualmente** por la
  CLI — antes de correrlos contra producción, confirmar con `supabase projects list` / `.git` que no se está
  apuntando por error al proyecto de desarrollo, y viceversa al volver a trabajar en features nuevas.
