-- ============================================================================
-- Fase 3 · Fix: can_operate/can_manage podían devolver NULL (no boolean)
--   Motivo: `p_restaurant_id = (subquery)` es NULL cuando la subquery no
--   devuelve filas (anon sin staff), y `NULL OR false = NULL`. En una
--   política RLS (`using (...)`) Postgres trata NULL como "no pasa" (falla
--   cerrado, sin riesgo). Pero en `close_table_session` se usa como
--   `if not can_operate(...) then raise ...` — y `not NULL` es NULL, que en
--   un IF de PL/pgSQL es "falso" (NO dispara el raise): falla ABIERTO.
--   Verificado en vivo con scripts/verify-staff-ops.mjs contra bar-prueba.
--   Fix: envolver en coalesce(..., false) para que nunca devuelvan NULL.
-- ============================================================================

create or replace function public.can_operate(p_restaurant_id uuid)
returns boolean
language sql stable
as $$
  select coalesce(
    p_restaurant_id = (select public.current_restaurant_id())
    or p_restaurant_id in (select id from public.restaurants where is_demo),
    false
  );
$$;

create or replace function public.can_manage(p_restaurant_id uuid)
returns boolean
language sql stable
as $$
  select coalesce(
    ((select public.is_manager()) and p_restaurant_id = (select public.current_restaurant_id()))
    or p_restaurant_id in (select id from public.restaurants where is_demo),
    false
  );
$$;
