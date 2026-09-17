-- ============================================================================
-- Fase 6 · Reconfirma (o crea) el cron de reset_demo.
--   La Fase 1 ya intentó programarlo, pero esa migración no se vuelve a correr;
--   esto es una forma barata de verificar en vivo (vía el output de `db push`)
--   si pg_cron quedó habilitado, sin necesitar entrar al dashboard.
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    if exists (select 1 from cron.job where jobname = 'reset-demo') then
      raise notice 'cron reset-demo YA estaba programado (jobid %)', (select jobid from cron.job where jobname = 'reset-demo');
    else
      perform cron.schedule('reset-demo', '0 * * * *', 'select public.reset_demo()');
      raise notice 'cron reset-demo programado ahora';
    end if;
  else
    raise notice 'pg_cron NO está habilitado en este proyecto — reset_demo() sólo corre manual (botón ↻) hasta activarlo en el dashboard (Database → Extensions → pg_cron)';
  end if;
end;
$$;
