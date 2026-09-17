-- ============================================================================
-- Fase 1 · Datos del tenant demo + reset horario
-- ============================================================================

-- Carga inicial del demo (idempotente: seed_demo borra y recrea)
select public.seed_demo();

-- Reset cada hora con pg_cron. Si la extensión no se puede habilitar acá,
-- activarla desde el dashboard (Integrations → Cron) y volver a correr el bloque.
do $$
begin
  begin
    create extension if not exists pg_cron with schema pg_catalog;
  exception when others then
    raise notice 'pg_cron no disponible en este entorno: %', sqlerrm;
  end;

  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'reset-demo';
    perform cron.schedule('reset-demo', '0 * * * *', 'select public.reset_demo()');
    raise notice 'cron reset-demo programado';
  end if;
end;
$$;
