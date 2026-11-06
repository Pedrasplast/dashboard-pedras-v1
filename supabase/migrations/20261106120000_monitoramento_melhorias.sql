-- =========================================================
-- Monitoramento das rotinas — melhorias (06/11/2026)
--
--  1. monitor_execucoes guarda mais da resposta (erro e resumo até 4.000
--     caracteres) e um "resultado" compacto com os números da resposta
--     (novos, alterados, páginas...).
--  2. Pausa com quem pausou, motivo e "pausar até" (volta sozinha).
--  3. "Rodar agora": dispara a rotina na hora, com trava contra execução
--     dupla.
--  4. monitor_painel_dia(): numa consulta pequena, a linha do dia de cada
--     rotina, o termômetro do Omie (últimos 30 min) e o progresso da
--     conferência completa de pedidos de compra.
--  5. monitor_rotinas() e monitor_historico_execucoes() devolvem os campos
--     novos. A lista continua com o erro curto (300 caracteres); o texto
--     completo só vem no histórico, quando a rotina é aberta.
--
-- Tudo só para administradores, como as demais funções monitor_*.
-- Desfazer: supabase/rollback/20261106_monitoramento_melhorias_rollback.sql
-- =========================================================

-- ---------------------------------------------------------
-- 1. Resposta mais completa
-- ---------------------------------------------------------

alter table public.monitor_execucoes add column if not exists resultado jsonb;

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
                  when x.error_msg is not null then left(x.error_msg, 4000)
                  else left(coalesce(x.j ->> 'erro', x.j ->> 'message', x.j ->> 'msg', nullif(x.content, ''), 'HTTP ' || x.status_code), 4000) end,
         resumo = left(x.content, 4000),
         -- Só os números e sim/não do primeiro nível da resposta (máx. 12).
         resultado = (
           select jsonb_object_agg(e.key, e.value)
             from (select k.key, k.value
                     from jsonb_each(coalesce(x.j, '{}'::jsonb)) k
                    where jsonb_typeof(k.value) in ('number', 'boolean')
                      and k.key not in ('sucesso', 'dry_run', 'duracao_ms', 'criou_cron', 'versao_logica')
                    limit 12) e
         )
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

-- ---------------------------------------------------------
-- 2. Pausas: quem, quando, por quê e até quando
-- ---------------------------------------------------------

create table if not exists public.monitor_pausas (
  rotina text primary key,
  pausada_em timestamptz not null default now(),
  pausada_por uuid,
  pausada_por_email text,
  motivo text,
  retomar_em timestamptz
);

alter table public.monitor_pausas enable row level security;
revoke all on public.monitor_pausas from public, anon, authenticated;

drop function if exists public.monitor_definir_rotina_ativa(text, boolean);

create or replace function public.monitor_definir_rotina_ativa(
  p_rotina text,
  p_ativa boolean,
  p_motivo text default null,
  p_retomar_em timestamptz default null
)
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

  select j.jobid into v_jobid from cron.job j where j.jobname = p_rotina;

  if v_jobid is null then
    raise exception 'Rotina "%" não encontrada.', p_rotina using errcode = 'P0002';
  end if;

  if not p_ativa and p_retomar_em is not null
     and (p_retomar_em <= now() or p_retomar_em > now() + interval '7 days') then
    raise exception 'O horário para retomar precisa estar entre agora e 7 dias.' using errcode = '22023';
  end if;

  perform cron.alter_job(v_jobid, active := p_ativa);

  if p_ativa then
    delete from public.monitor_pausas where rotina = p_rotina;
  else
    insert into public.monitor_pausas (rotina, pausada_em, pausada_por, pausada_por_email, motivo, retomar_em)
    values (
      p_rotina, now(), auth.uid(),
      (select p.email from public.perfis p where p.id = auth.uid()),
      nullif(left(btrim(coalesce(p_motivo, '')), 300), ''),
      p_retomar_em
    )
    on conflict (rotina) do update
      set pausada_em = excluded.pausada_em,
          pausada_por = excluded.pausada_por,
          pausada_por_email = excluded.pausada_por_email,
          motivo = excluded.motivo,
          retomar_em = excluded.retomar_em;
  end if;

  return p_ativa;
end;
$$;

revoke all on function public.monitor_definir_rotina_ativa(text, boolean, text, timestamptz) from public, anon;
grant execute on function public.monitor_definir_rotina_ativa(text, boolean, text, timestamptz) to authenticated;

-- Retoma as pausas com horário vencido. Roda no banco a cada 5 min.
create or replace function public.monitor_retomar_pausas_vencidas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_total integer := 0;
begin
  for r in
    select p.rotina, j.jobid
      from public.monitor_pausas p
      left join cron.job j on j.jobname = p.rotina
     where p.retomar_em is not null and p.retomar_em <= now()
  loop
    if r.jobid is not null then
      perform cron.alter_job(r.jobid, active := true);
    end if;
    delete from public.monitor_pausas where rotina = r.rotina;
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;

revoke all on function public.monitor_retomar_pausas_vencidas() from public, anon, authenticated;

select cron.unschedule('monitor-retomar-pausas')
 where exists (select 1 from cron.job where jobname = 'monitor-retomar-pausas');

select cron.schedule('monitor-retomar-pausas', '*/5 * * * *',
  $cron$select public.monitor_retomar_pausas_vencidas();$cron$);

-- ---------------------------------------------------------
-- 3. Rodar agora
-- ---------------------------------------------------------

create or replace function public.monitor_rodar_agora(p_rotina text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comando text;
  v_ultima timestamptz;
  v_antes bigint;
  v_depois bigint;
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  select j.command into v_comando from cron.job j where j.jobname = p_rotina;

  if v_comando is null then
    raise exception 'Rotina "%" não encontrada.', p_rotina using errcode = 'P0002';
  end if;

  -- Só as rotinas que chamam funções (as de limpeza não precisam).
  if position('monitor_disparar' in v_comando) = 0 then
    raise exception 'Esta rotina não pode ser disparada pela tela.' using errcode = '42501';
  end if;

  perform public.monitor_coletar();

  -- Trava: uma execução sem resposta nos últimos 10 min = ainda rodando.
  if exists (
    select 1 from public.monitor_execucoes me
     where me.rotina = p_rotina and me.concluido_em is null
       and me.disparado_em > now() - interval '10 minutes'
  ) then
    raise exception 'A rotina ainda está rodando. Espere ela terminar.' using errcode = '55P03';
  end if;

  select max(me.disparado_em) into v_ultima from public.monitor_execucoes me where me.rotina = p_rotina;
  if v_ultima > now() - interval '1 minute' then
    raise exception 'A rotina acabou de rodar. Espere um minuto.' using errcode = '55P03';
  end if;

  select count(*) into v_antes from public.monitor_execucoes me where me.rotina = p_rotina;

  -- O comando é o próprio comando agendado da rotina (só o dono do
  -- pg_cron consegue gravá-lo).
  execute v_comando;

  select count(*) into v_depois from public.monitor_execucoes me where me.rotina = p_rotina;

  return jsonb_build_object('disparada', v_depois > v_antes);
end;
$$;

revoke all on function public.monitor_rodar_agora(text) from public, anon;
grant execute on function public.monitor_rodar_agora(text) to authenticated;

-- ---------------------------------------------------------
-- 4. Painel do dia: linha do dia, termômetro do Omie, conferência
-- ---------------------------------------------------------

create or replace function public.monitor_painel_dia()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inicio_dia timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  v_linha jsonb;
  v_termometro jsonb;
  v_conferencia jsonb;
begin
  if not private.usuario_eh_admin() then
    raise exception 'Acesso restrito a administradores.' using errcode = '42501';
  end if;

  perform public.monitor_coletar();

  -- "b" = tempo normal de cada rotina: mediana das execuções com sucesso
  -- em 7 dias. Lenta = mais que max(10 s, 3x a mediana, mediana + 20 s).

  -- Linha do dia: [minuto do dia, estado, segundos] por execução.
  -- Estado: o = ok, l = lenta, e = erro, r = rodando.
  select coalesce(jsonb_object_agg(t.rotina, t.execucoes), '{}'::jsonb) into v_linha
    from (
      select me.rotina,
             jsonb_agg(jsonb_build_array(
               (extract(hour from me.disparado_em at time zone 'America/Sao_Paulo') * 60
                + extract(minute from me.disparado_em at time zone 'America/Sao_Paulo'))::int,
               case
                 when me.concluido_em is null then 'r'
                 when me.sucesso is not true then 'e'
                 when extract(epoch from me.concluido_em - me.disparado_em)
                      > greatest(10, 3 * coalesce(b.mediana_s, 0), coalesce(b.mediana_s, 0) + 20) then 'l'
                 else 'o'
               end,
               round(extract(epoch from coalesce(me.concluido_em, now()) - me.disparado_em))::int
             ) order by me.disparado_em) as execucoes
        from public.monitor_execucoes me
        left join (select me2.rotina,
                         percentile_cont(0.5) within group (order by extract(epoch from me2.concluido_em - me2.disparado_em)) as mediana_s
                    from public.monitor_execucoes me2
                   where me2.sucesso and me2.disparado_em > now() - interval '7 days' and me2.concluido_em is not null
                   group by me2.rotina) b on b.rotina = me.rotina
       where me.disparado_em >= v_inicio_dia
       group by me.rotina
    ) t;

  -- Termômetro: execuções dos últimos 30 min de todas as rotinas que chamam o Omie.
  select jsonb_build_object(
           'execucoes', count(*),
           'falhas', count(*) filter (where me.concluido_em is not null and me.sucesso is not true),
           'lentas', count(*) filter (
             where me.sucesso and extract(epoch from me.concluido_em - me.disparado_em)
                   > greatest(10, 3 * coalesce(b.mediana_s, 0), coalesce(b.mediana_s, 0) + 20)),
           -- Falhas que vêm do Omie: demora (tempo esgotado, função sem recursos,
           -- consulta ocupada) ou erro interno do Omie (SOAP-ERROR).
           'falhas_omie', count(*) filter (
             where me.sucesso is false and (
               me.erro ilike '%aborted%' or me.erro ilike '%tempo limite%' or me.erro ilike '%timeout%'
               or me.erro ilike '%compute resources%' or me.erro ilike '%sendo executada%'
               or me.erro ilike '%redundant%' or me.erro ilike '%soap-error%'
               or me.erro ilike '%application server%' or me.status_http in (504, 546))),
           'ultima_em', max(me.disparado_em)
         ) into v_termometro
    from public.monitor_execucoes me
    left join (select me2.rotina,
                         percentile_cont(0.5) within group (order by extract(epoch from me2.concluido_em - me2.disparado_em)) as mediana_s
                    from public.monitor_execucoes me2
                   where me2.sucesso and me2.disparado_em > now() - interval '7 days' and me2.concluido_em is not null
                   group by me2.rotina) b on b.rotina = me.rotina
   where me.disparado_em > now() - interval '30 minutes';

  select to_jsonb(s) into v_conferencia
    from (
      select sp.status, sp.mensagem, sp.varredura_iniciada_em, sp.iniciado_em, sp.finalizado_em,
             sp.atualizado_em, sp.pagina_proxima, sp.total_paginas_previstas, sp.proxima_tentativa_em
        from public.sincronizacao_pedidos_compra_omie sp
       where sp.id = 1
    ) s;

  return jsonb_build_object(
    'gerado_em', now(),
    'linha', v_linha,
    'termometro', v_termometro,
    'conferencia', v_conferencia
  );
end;
$$;

revoke all on function public.monitor_painel_dia() from public, anon;
grant execute on function public.monitor_painel_dia() to authenticated;

-- ---------------------------------------------------------
-- 5. Lista e histórico com os campos novos
-- ---------------------------------------------------------

drop function if exists public.monitor_rotinas();

create function public.monitor_rotinas()
returns table(
  rotina text, agenda text, ativa boolean,
  ultima_execucao timestamptz, ultima_status_cron text, ultimo_erro_cron text,
  ultima_chamada timestamptz, ultima_concluida_em timestamptz, ultimo_sucesso boolean,
  ultimo_status_http integer, ultimo_erro text, ultimo_sucesso_em timestamptz,
  chamadas_24h bigint, falhas_24h bigint,
  ultimo_resultado jsonb, ultimo_resultado_em timestamptz,
  pausada_em timestamptz, pausada_por text, pausa_motivo text, retomar_em timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.usuario_eh_admin() then raise exception 'Acesso restrito a administradores.' using errcode = '42501'; end if;
  perform public.monitor_coletar();
  return query
  select j.jobname::text, j.schedule::text, j.active, d.start_time, d.status::text,
         case when d.status = 'failed' then left(d.return_message, 300) end,
         e.disparado_em, e.concluido_em, e.sucesso, e.status_http, left(e.erro, 300), ok.disparado_em,
         coalesce(c.chamadas, 0), coalesce(c.falhas, 0),
         ok.resultado, ok.disparado_em,
         case when not j.active then pz.pausada_em end,
         case when not j.active then pz.pausada_por_email end,
         case when not j.active then pz.motivo end,
         case when not j.active then pz.retomar_em end
    from cron.job j
    left join lateral (select rd.start_time, rd.status, rd.return_message from cron.job_run_details rd where rd.jobid = j.jobid order by rd.start_time desc limit 1) d on true
    left join lateral (select me.disparado_em, me.concluido_em, me.sucesso, me.status_http, me.erro from public.monitor_execucoes me where me.rotina = j.jobname order by me.disparado_em desc limit 1) e on true
    left join lateral (select me.disparado_em, me.resultado from public.monitor_execucoes me where me.rotina = j.jobname and me.sucesso order by me.disparado_em desc limit 1) ok on true
    left join lateral (select count(*) as chamadas, count(*) filter (where me.sucesso = false) as falhas from public.monitor_execucoes me where me.rotina = j.jobname and me.disparado_em > now() - interval '24 hours') c on true
    left join public.monitor_pausas pz on pz.rotina = j.jobname
   order by j.jobname;
end; $function$;

revoke all on function public.monitor_rotinas() from public, anon;
grant execute on function public.monitor_rotinas() to authenticated;

drop function if exists public.monitor_historico_execucoes(text, integer);

create function public.monitor_historico_execucoes(p_rotina text, p_limite integer default 30)
returns table(
  disparado_em timestamptz, duracao_ms integer, sucesso boolean, status_http integer,
  erro text, resumo text, resultado jsonb, segundos integer
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not private.usuario_eh_admin() then raise exception 'Acesso restrito a administradores.' using errcode = '42501'; end if;
  perform public.monitor_coletar();
  return query
  select me.disparado_em, me.duracao_ms, me.sucesso, me.status_http, me.erro,
         -- Com erro, o texto completo já vem em "erro"; com sucesso, só o começo da resposta.
         case when me.sucesso is not true then null else left(me.resumo, 300) end,
         me.resultado,
         case when me.concluido_em is not null
              then round(extract(epoch from me.concluido_em - me.disparado_em))::int end
    from public.monitor_execucoes me
   where me.rotina = p_rotina
   order by me.disparado_em desc
   limit least(greatest(coalesce(p_limite, 30), 1), 100);
end; $function$;

revoke all on function public.monitor_historico_execucoes(text, integer) from public, anon;
grant execute on function public.monitor_historico_execucoes(text, integer) to authenticated;
