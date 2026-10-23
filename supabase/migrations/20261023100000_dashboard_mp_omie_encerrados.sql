-- Dashboard MP (origem Omie): pedidos Encerrados no Omie não contam como
-- compra em aberto (23/10). A rotina marca os encerrados após gravar os pedidos.
alter table public.dashboard_mp_pedidos_omie
  add column if not exists encerrado boolean not null default false;

create or replace function public.marcar_dashboard_mp_encerrados(p_codigos bigint[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_marcados integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Restrito ao integrador Omie';
  end if;
  update public.dashboard_mp_pedidos_omie
     set encerrado = true
   where cod_ped_compra = any(coalesce(p_codigos, '{}')) and not encerrado;
  get diagnostics v_marcados = row_count;
  return jsonb_build_object('marcados', v_marcados);
end; $$;
revoke all on function public.marcar_dashboard_mp_encerrados(bigint[]) from public, anon, authenticated;
grant execute on function public.marcar_dashboard_mp_encerrados(bigint[]) to service_role;
