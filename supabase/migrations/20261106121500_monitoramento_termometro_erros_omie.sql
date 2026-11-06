-- Termômetro do Omie passa a contar também os erros internos do Omie
-- (SOAP-ERROR), além da demora. Mesmo conteúdo da função em
-- 20261106120000_monitoramento_melhorias.sql (aplicada em produção como
-- migration separada em 06/11/2026).

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

