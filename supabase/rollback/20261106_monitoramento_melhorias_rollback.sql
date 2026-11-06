-- Desfaz 20261106120000_monitoramento_melhorias.sql e
-- 20261106111500_monitor_pausar_rotina.sql.
-- Volta monitor_rotinas, monitor_historico_execucoes e monitor_coletar ao
-- que eram em 20261022 e retoma qualquer rotina pausada pela tela.

-- Retoma o que estiver pausado pela tela antes de apagar o registro.
do $$
declare r record;
begin
  for r in select j.jobid from public.monitor_pausas p join cron.job j on j.jobname = p.rotina loop
    perform cron.alter_job(r.jobid, active := true);
  end loop;
end $$;

select cron.unschedule('monitor-retomar-pausas')
 where exists (select 1 from cron.job where jobname = 'monitor-retomar-pausas');

drop function if exists public.monitor_retomar_pausas_vencidas();
drop function if exists public.monitor_rodar_agora(text);
drop function if exists public.monitor_painel_dia();
drop function if exists public.monitor_definir_rotina_ativa(text, boolean, text, timestamptz);
drop function if exists public.monitor_definir_rotina_ativa(text, boolean);
drop table if exists public.monitor_pausas;

create or replace function public.monitor_coletar()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare v_coletadas integer;
begin
  update public.monitor_execucoes m
     set concluido_em = x.created, status_http = x.status_code, sucesso = x.ok,
         duracao_ms = case when jsonb_typeof(x.j -> 'duracao_ms') = 'number' then (x.j ->> 'duracao_ms')::numeric::integer end,
         erro = case when x.ok then null
                  when x.timed_out then 'Tempo limite excedido'
                  when x.error_msg is not null then left(x.error_msg, 500)
                  else left(coalesce(x.j ->> 'erro', x.j ->> 'message', x.j ->> 'msg', nullif(x.content, ''), 'HTTP ' || x.status_code), 500) end,
         resumo = left(x.content, 300)
    from (select r.id, r.created, r.status_code, r.content, r.error_msg, coalesce(r.timed_out, false) as timed_out, j.j,
                 coalesce(r.status_code between 200 and 299, false) and not coalesce(r.timed_out, false) and (j.j ->> 'sucesso') is distinct from 'false' as ok
            from net._http_response r
            cross join lateral (select case when pg_input_is_valid(r.content, 'jsonb') and jsonb_typeof(r.content::jsonb) = 'object' then r.content::jsonb end as j) j) x
   where x.id = m.request_id and m.concluido_em is null;
  get diagnostics v_coletadas = row_count;
  update public.monitor_execucoes set concluido_em = disparado_em, sucesso = false, erro = 'Sem resposta da função (expirou no pg_net)'
   where concluido_em is null and disparado_em < now() - interval '6 hours';
  return v_coletadas;
exception when others then return -1;
end; $function$;

alter table public.monitor_execucoes drop column if exists resultado;

drop function if exists public.monitor_rotinas();
create function public.monitor_rotinas()
 returns table(rotina text, agenda text, ativa boolean, ultima_execucao timestamp with time zone, ultima_status_cron text, ultimo_erro_cron text, ultima_chamada timestamp with time zone, ultima_concluida_em timestamp with time zone, ultimo_sucesso boolean, ultimo_status_http integer, ultimo_erro text, ultimo_sucesso_em timestamp with time zone, chamadas_24h bigint, falhas_24h bigint)
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if not private.usuario_eh_admin() then raise exception 'Acesso restrito a administradores.' using errcode = '42501'; end if;
  perform public.monitor_coletar();
  return query
  select j.jobname::text, j.schedule::text, j.active, d.start_time, d.status::text,
         case when d.status = 'failed' then left(d.return_message, 500) end,
         e.disparado_em, e.concluido_em, e.sucesso, e.status_http, e.erro, ok.disparado_em, coalesce(c.chamadas, 0), coalesce(c.falhas, 0)
    from cron.job j
    left join lateral (select rd.start_time, rd.status, rd.return_message from cron.job_run_details rd where rd.jobid = j.jobid order by rd.start_time desc limit 1) d on true
    left join lateral (select me.disparado_em, me.concluido_em, me.sucesso, me.status_http, me.erro from public.monitor_execucoes me where me.rotina = j.jobname order by me.disparado_em desc limit 1) e on true
    left join lateral (select me.disparado_em from public.monitor_execucoes me where me.rotina = j.jobname and me.sucesso order by me.disparado_em desc limit 1) ok on true
    left join lateral (select count(*) as chamadas, count(*) filter (where me.sucesso = false) as falhas from public.monitor_execucoes me where me.rotina = j.jobname and me.disparado_em > now() - interval '24 hours') c on true
   order by j.jobname;
end; $function$;
revoke all on function public.monitor_rotinas() from public, anon;
grant execute on function public.monitor_rotinas() to authenticated;

drop function if exists public.monitor_historico_execucoes(text, integer);
create function public.monitor_historico_execucoes(p_rotina text, p_limite integer default 30)
 returns table(disparado_em timestamp with time zone, duracao_ms integer, sucesso boolean, status_http integer, erro text, resumo text)
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if not private.usuario_eh_admin() then raise exception 'Acesso restrito a administradores.' using errcode = '42501'; end if;
  perform public.monitor_coletar();
  return query select me.disparado_em, me.duracao_ms, me.sucesso, me.status_http, me.erro, me.resumo
    from public.monitor_execucoes me where me.rotina = p_rotina order by me.disparado_em desc limit least(greatest(coalesce(p_limite, 30), 1), 100);
end; $function$;
revoke all on function public.monitor_historico_execucoes(text, integer) from public, anon;
grant execute on function public.monitor_historico_execucoes(text, integer) to authenticated;
