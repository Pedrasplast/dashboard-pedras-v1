-- Desfaz 20261022100000_monitoramento_objetos.sql e 20261022100100_monitoramento_crons.sql
-- Volta os crons para net.http_post e remove os objetos de monitoramento.
do $$
declare
  j record;
begin
  for j in
    select jobid, command from cron.job where command like '%public.monitor_disparar(%'
  loop
    perform cron.alter_job(
      job_id  := j.jobid,
      command := regexp_replace(j.command,
                   'public\.monitor_disparar\(''[^'']*'', ', 'net.http_post(', 'g')
    );
  end loop;
end;
$$;

select cron.alter_job(
  job_id  := (select jobid from cron.job where jobname = 'limpar-historico-cron-14d'),
  command := 'delete from cron.job_run_details where start_time < now() - interval ''14 days'';'
);

drop function if exists public.monitor_resumo();
drop function if exists public.monitor_banco();
drop function if exists public.monitor_limpar_antigos();
drop function if exists public.monitor_historico_execucoes(text, integer);
drop function if exists public.monitor_historico(text, integer);
drop function if exists public.monitor_rotinas();
drop function if exists public.monitor_disparar(text, text, jsonb, jsonb, jsonb, integer);
drop function if exists public.monitor_coletar();
drop table if exists public.monitor_execucoes;
