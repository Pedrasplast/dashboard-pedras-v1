-- Monitoramento das rotinas automáticas (tela de administrador).
--
-- Problema: o pg_cron guarda o histórico de execuções (14 dias), mas a
-- resposta de cada chamada às Edge Functions (onde aparece o erro) fica em
-- net._http_response só por 6 horas e sem indicar de qual rotina veio.
--
-- Solução:
--   1. monitor_execucoes: uma linha por chamada disparada pelos crons
--      (rotina + request_id do pg_net), completada com o resultado.
--   2. monitor_disparar(): igual a net.http_post, mas anota a rotina.
--      Os crons passam a chamar public.monitor_disparar('<rotina>', ...).
--   3. monitor_coletar(): copia as respostas do pg_net antes que expirem.
--      Roda a cada disparo e a cada consulta da tela (sem cron novo).
--      monitor_limpar_antigos() apaga o que tem mais de 14 dias e roda na
--      limpeza diária já existente (limpar-historico-cron-14d).
--   4. monitor_rotinas() / monitor_historico_execucoes(): leitura só admin.
--
-- Aplicada em partes em 22/10 (o MCP cancelava o script inteiro). A primeira
-- versão public.monitor_historico (sem duração) foi removida em
-- 20261022110000_remover_monitor_historico_antigo.sql.

create table if not exists public.monitor_execucoes (
  id            bigint generated always as identity primary key,
  rotina        text        not null,
  request_id    bigint      not null unique,
  disparado_em  timestamptz not null default now(),
  concluido_em  timestamptz,
  status_http   integer,
  sucesso       boolean,
  erro          text,
  resumo        text,
  duracao_ms    integer
);

create index if not exists monitor_execucoes_rotina_idx
  on public.monitor_execucoes (rotina, disparado_em desc);
create index if not exists monitor_execucoes_pendentes_idx
  on public.monitor_execucoes (request_id) where concluido_em is null;

alter table public.monitor_execucoes enable row level security;
revoke all on public.monitor_execucoes from public, anon, authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.monitor_coletar()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coletadas integer;
begin
  update public.monitor_execucoes m
     set concluido_em = x.created,
         status_http  = x.status_code,
         sucesso      = x.ok,
         -- created do pg_net é a hora do pedido; a duração vem da própria função.
         duracao_ms   = case when jsonb_typeof(x.j -> 'duracao_ms') = 'number'
                             then (x.j ->> 'duracao_ms')::numeric::integer end,
         erro = case
                  when x.ok then null
                  when x.timed_out then 'Tempo limite excedido'
                  when x.error_msg is not null then left(x.error_msg, 500)
                  else left(coalesce(x.j ->> 'erro', x.j ->> 'message', x.j ->> 'msg',
                                     nullif(x.content, ''), 'HTTP ' || x.status_code), 500)
                end,
         resumo = left(x.content, 300)
    from (
      select r.id, r.created, r.status_code, r.content, r.error_msg,
             coalesce(r.timed_out, false) as timed_out,
             j.j,
             coalesce(r.status_code between 200 and 299, false)
               and not coalesce(r.timed_out, false)
               and (j.j ->> 'sucesso') is distinct from 'false' as ok
        from net._http_response r
        cross join lateral (
          select case when pg_input_is_valid(r.content, 'jsonb')
                       and jsonb_typeof(r.content::jsonb) = 'object'
                      then r.content::jsonb end as j
        ) j
    ) x
   where x.id = m.request_id
     and m.concluido_em is null;
  get diagnostics v_coletadas = row_count;

  -- O pg_net apaga respostas após 6 h: o que não voltou até lá ficou sem resposta.
  update public.monitor_execucoes
     set concluido_em = disparado_em, sucesso = false,
         erro = 'Sem resposta da função (expirou no pg_net)'
   where concluido_em is null
     and disparado_em < now() - interval '6 hours';

  return v_coletadas;
exception when others then
  -- O monitoramento nunca pode derrubar uma rotina.
  return -1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Mesma assinatura (argumentos nomeados) de net.http_post, com a rotina antes.
create or replace function public.monitor_disparar(
  p_rotina             text,
  url                  text,
  params               jsonb   default '{}'::jsonb,
  body                 jsonb   default '{}'::jsonb,
  headers              jsonb   default '{"Content-Type": "application/json"}'::jsonb,
  timeout_milliseconds integer default 5000
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id bigint;
begin
  v_request_id := net.http_post(
    url := url, params := params, body := body,
    headers := headers, timeout_milliseconds := timeout_milliseconds
  );

  begin
    insert into public.monitor_execucoes (rotina, request_id)
    values (p_rotina, v_request_id);
    perform public.monitor_coletar();
  exception when others then
    null; -- falha ao anotar não impede a chamada
  end;

  return v_request_id;
end;
$$;

-- ---------------------------------------------------------------------------
create or replace function public.monitor_rotinas()
returns table (
  rotina               text,
  agenda               text,
  ativa                boolean,
  ultima_execucao      timestamptz,
  ultima_status_cron   text,
  ultimo_erro_cron     text,
  ultima_chamada       timestamptz,
  ultima_concluida_em  timestamptz,
  ultimo_sucesso       boolean,
  ultimo_status_http   integer,
  ultimo_erro          text,
  ultimo_sucesso_em    timestamptz,
  chamadas_24h         bigint,
  falhas_24h           bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  perform public.monitor_coletar();

  return query
  select j.jobname::text,
         j.schedule::text,
         j.active,
         d.start_time,
         d.status::text,
         case when d.status = 'failed' then left(d.return_message, 500) end,
         e.disparado_em,
         e.concluido_em,
         e.sucesso,
         e.status_http,
         e.erro,
         ok.disparado_em,
         coalesce(c.chamadas, 0),
         coalesce(c.falhas, 0)
    from cron.job j
    left join lateral (
      select rd.start_time, rd.status, rd.return_message
        from cron.job_run_details rd
       where rd.jobid = j.jobid
       order by rd.start_time desc
       limit 1
    ) d on true
    left join lateral (
      select me.disparado_em, me.concluido_em, me.sucesso, me.status_http, me.erro
        from public.monitor_execucoes me
       where me.rotina = j.jobname
       order by me.disparado_em desc
       limit 1
    ) e on true
    left join lateral (
      select me.disparado_em
        from public.monitor_execucoes me
       where me.rotina = j.jobname and me.sucesso
       order by me.disparado_em desc
       limit 1
    ) ok on true
    left join lateral (
      select count(*) as chamadas,
             count(*) filter (where me.sucesso = false) as falhas
        from public.monitor_execucoes me
       where me.rotina = j.jobname
         and me.disparado_em > now() - interval '24 hours'
    ) c on true
   order by j.jobname;
end;
$$;

create or replace function public.monitor_historico_execucoes(p_rotina text, p_limite integer default 30)
returns table (
  disparado_em  timestamptz,
  duracao_ms    integer,
  sucesso       boolean,
  status_http   integer,
  erro          text,
  resumo        text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  perform public.monitor_coletar();

  return query
  select me.disparado_em, me.duracao_ms, me.sucesso, me.status_http, me.erro, me.resumo
    from public.monitor_execucoes me
   where me.rotina = p_rotina
   order by me.disparado_em desc
   limit least(greatest(coalesce(p_limite, 30), 1), 100);
end;
$$;

revoke all on function public.monitor_coletar() from public, anon, authenticated;
revoke all on function public.monitor_disparar(text, text, jsonb, jsonb, jsonb, integer) from public, anon, authenticated;
revoke all on function public.monitor_rotinas() from public, anon;
revoke all on function public.monitor_historico_execucoes(text, integer) from public, anon;
grant execute on function public.monitor_rotinas() to authenticated;
grant execute on function public.monitor_historico_execucoes(text, integer) to authenticated;


create or replace function public.monitor_limpar_antigos()
returns integer language sql security definer set search_path = '' as $$
  with apagados as (
    delete from public.monitor_execucoes where disparado_em < now() - interval '14 days' returning 1
  ) select count(*)::integer from apagados;
$$;
revoke all on function public.monitor_limpar_antigos() from public, anon, authenticated;
