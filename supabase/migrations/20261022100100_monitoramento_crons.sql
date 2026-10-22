-- Parte 2 do monitoramento: crons passam a anotar a rotina.
-- Depende de 20261022100000_monitoramento_objetos.sql.
-- ---------------------------------------------------------------------------
-- Crons que chamam Edge Functions passam a anotar a rotina.
-- Troca apenas "net.http_post(" por "public.monitor_disparar('<rotina>', ";
-- horários e demais argumentos ficam iguais.
do $$
declare
  j record;
begin
  for j in
    select jobid, jobname, command
      from cron.job
     where command like '%net.http_post(%'
  loop
    perform cron.alter_job(
      job_id  := j.jobid,
      command := replace(j.command, 'net.http_post(',
                         'public.monitor_disparar(' || quote_literal(j.jobname) || ', ')
    );
  end loop;
end;
$$;

-- Limpeza diária passa a incluir o monitoramento (14 dias).
select cron.alter_job(
  job_id  := (select jobid from cron.job where jobname = 'limpar-historico-cron-14d'),
  command := (select command from cron.job where jobname = 'limpar-historico-cron-14d') || ' select public.monitor_limpar_antigos();'
);
