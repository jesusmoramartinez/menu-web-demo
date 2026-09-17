-- ============================================================================
-- Fase 5 · Storage: bucket público para logos y fotos de platos
--   Convención de ruta: '<restaurant_id>/<logo|menu>/<archivo>'. El primer
--   segmento de la ruta es el tenant: can_manage(ese uuid) autoriza escritura.
--   Lectura pública (bucket public = true sirve por URL directa, sin RLS).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('restaurant-media', 'restaurant-media', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "restaurant_media_select_public" on storage.objects
  for select using (bucket_id = 'restaurant-media');

create policy "restaurant_media_write_manager" on storage.objects
  for insert with check (
    bucket_id = 'restaurant-media'
    and public.can_manage((storage.foldername(name))[1]::uuid)
  );

create policy "restaurant_media_update_manager" on storage.objects
  for update using (
    bucket_id = 'restaurant-media'
    and public.can_manage((storage.foldername(name))[1]::uuid)
  );

create policy "restaurant_media_delete_manager" on storage.objects
  for delete using (
    bucket_id = 'restaurant-media'
    and public.can_manage((storage.foldername(name))[1]::uuid)
  );
