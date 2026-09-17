-- ============================================================================
-- Fase 3 · close_table_session: el mozo cierra la mesa desde /mozo (tab Mesas)
--   No es SECURITY DEFINER por conveniencia sino por necesidad: valida
--   autorización a mano (can_operate) porque una función de owner no
--   atraviesa RLS. Idempotente si ya estaba cerrada.
-- ============================================================================

create or replace function public.close_table_session(p_session_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_session public.table_sessions%rowtype;
  v_active  int;
begin
  select * into v_session from public.table_sessions where id = p_session_id;
  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if not public.can_operate(v_session.restaurant_id) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if v_session.status = 'closed' then
    return; -- idempotente
  end if;

  select count(*) into v_active
  from public.orders
  where session_id = p_session_id and status in ('pending', 'kitchen', 'ready');
  if v_active > 0 then
    raise exception 'SESSION_HAS_ACTIVE_ORDERS';
  end if;

  update public.alerts
     set resolved_at = now(), resolved_by = auth.uid()
   where session_id = p_session_id and resolved_at is null;

  update public.table_sessions
     set status = 'closed', closed_by = auth.uid()
   where id = p_session_id;
end;
$$;
grant execute on function public.close_table_session(uuid) to anon, authenticated;
