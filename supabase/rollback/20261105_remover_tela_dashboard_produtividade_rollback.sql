-- Rollback de 20261105150000_remover_tela_dashboard_produtividade.sql
-- Recria a tela e as 10 permissões exatamente como estavam (todas sem acesso).

insert into public.telas_sistema (id, chave, nome, rota, ordem, ativo, created_at)
values (4, 'dashboard_produtividade', 'Produtividade', '/dashboard-produtividade', 4, true, '2026-08-26T17:28:42.270819+00:00')
on conflict (id) do nothing;

insert into public.usuario_permissoes (usuario_id, tela_id, permitido, updated_at) values
  ('4fa52ee7-9a8f-4397-8e19-83a0fa5d86b5', 4, false, '2026-10-23T16:08:32.613+00:00'),
  ('2695892c-3eb5-44fe-adcd-7555ee7df811', 4, false, '2026-10-23T16:07:32.931+00:00'),
  ('c806f890-b44b-4185-b88c-3952b1a60129', 4, false, '2026-10-23T16:08:26.037+00:00'),
  ('26d5f6da-8f6d-40ad-99a2-c1938c02622c', 4, false, '2026-11-04T18:09:08.635+00:00'),
  ('311741d8-a649-44a8-9d83-935dcfd47aa1', 4, false, '2026-10-27T15:32:53.564+00:00'),
  ('b6b05a3d-feff-490b-b5d3-c7fd20f1d122', 4, false, '2026-09-18T19:38:21.596+00:00'),
  ('cf2df4a6-ec0f-435a-b1a5-7dedb0f0a002', 4, false, '2026-10-28T14:31:43.55+00:00'),
  ('4cbed433-d1ab-4918-b95a-204c2dbbbd54', 4, false, '2026-10-26T13:57:21.543+00:00'),
  ('facb0d45-9bac-4ce1-a362-38030a8fbde3', 4, false, '2026-10-07T11:35:01.954+00:00'),
  ('fe89f530-edce-4f5e-b0f4-35184f7c35dd', 4, false, '2026-10-23T16:07:54.499+00:00')
on conflict do nothing;
