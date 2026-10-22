-- Tela de Monitoramento: tamanho do banco e resumo para o aviso do menu.
-- Ambas só para administradores.

-- Lê o que a rotina diária "monitorar-tamanho-banco-diario" grava (antes
-- ninguém usava esse dado).
create or replace function public.monitor_banco()
returns table (tamanho_bytes bigint, limite_bytes bigint, percentual numeric, nivel text, atualizado_em timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;
  return query
  select mb.tamanho_bytes, mb.limite_bytes, mb.percentual::numeric, mb.nivel::text, mb.atualizado_em
    from public.monitoramento_banco mb where mb.id = 1;
end; $$;

-- Aviso do menu: rotinas ativas cuja última execução falhou (~40 ms).
-- Percorre o histórico do cron uma vez só (job_run_details não tem índice
-- por jobid; a versão com subconsulta por rotina levava ~120 ms).
create or replace function public.monitor_resumo()
returns table (rotinas_com_erro integer, banco_nivel text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;
  perform public.monitor_coletar();
  return query
  with ultimo_cron as (
    select distinct on (rd.jobid) rd.jobid, rd.status
      from cron.job_run_details rd
     where rd.start_time > now() - interval '8 days'
     order by rd.jobid, rd.start_time desc
  ), ultima_chamada as (
    select distinct on (me.rotina) me.rotina, me.sucesso
      from public.monitor_execucoes me
     order by me.rotina, me.disparado_em desc
  )
  select (select count(*)::integer
            from cron.job j
            left join ultimo_cron uc on uc.jobid = j.jobid
            left join ultima_chamada ul on ul.rotina = j.jobname
           where j.active and (uc.status = 'failed' or ul.sucesso = false)),
         (select mb.nivel::text from public.monitoramento_banco mb where mb.id = 1);
end; $$;

revoke all on function public.monitor_banco() from public, anon;
revoke all on function public.monitor_resumo() from public, anon;
grant execute on function public.monitor_banco() to authenticated;
grant execute on function public.monitor_resumo() to authenticated;
