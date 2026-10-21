-- Desfaz 20261021120000_monitoramento_rotinas.sql
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

drop function if exists public.monitor_historico(text, integer);
drop function if exists public.monitor_rotinas();
drop function if exists public.monitor_disparar(text, text, jsonb, jsonb, jsonb, integer);
drop function if exists public.monitor_coletar();
drop table if exists public.monitor_execucoes;
