-- Monitoramento: pausar e retomar rotinas pela tela (06/11/2026).
--
-- Liga ou desliga a rotina no pg_cron (cron.alter_job ... active).
-- Pausada, a rotina não dispara até ser retomada; a agenda não muda.
-- Só administradores (mesma regra das outras funções monitor_*).
--
-- Desfazer:
--   drop function if exists public.monitor_definir_rotina_ativa(text, boolean);

create or replace function public.monitor_definir_rotina_ativa(p_rotina text, p_ativa boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jobid bigint;
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  if p_ativa is null then
    raise exception 'Informe se a rotina deve ficar ativa.' using errcode = '22004';
  end if;

  select j.jobid into v_jobid
    from cron.job j
   where j.jobname = p_rotina;

  if v_jobid is null then
    raise exception 'Rotina "%" não encontrada.', p_rotina using errcode = 'P0002';
  end if;

  perform cron.alter_job(v_jobid, active := p_ativa);

  return p_ativa;
end;
$$;

revoke all on function public.monitor_definir_rotina_ativa(text, boolean) from public, anon;
grant execute on function public.monitor_definir_rotina_ativa(text, boolean) to authenticated;
