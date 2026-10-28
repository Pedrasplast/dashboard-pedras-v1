-- Conferência rápida da coluna "Aprovação" (etapa 15) dos pedidos de compra.
--
-- Problema (28/10/2026): pedidos encerrados/cancelados/excluídos no Omie só
-- saíam da tela na conferência completa diária (~08h), e pedidos que entravam
-- na Aprovação sem "alteração" registrada no Omie não chegavam pela
-- incremental. A tela chegou a mostrar 96 abertos / 70 atrasados contra
-- 82 / 58 no Omie.
--
-- A cada execução incremental (5 em 5 min), a Edge Function cron-pedidos-compra-omie
-- consulta no Omie todos os pedidos ABERTOS (pendentes, faturados e parciais,
-- sem recebidos, cancelados e encerrados) — 2 páginas hoje — grava-os e chama
-- esta função com os códigos devolvidos.
--
-- Esta função:
--   1. Devolve à tela (ausencias_varreduras = 0) os pedidos abertos no Omie.
--   2. Esconde da tela (ausencias_varreduras = 1) os pedidos da etapa 15 que
--      ainda têm saldo no Supabase mas não estão mais abertos no Omie.
--      A view pedidos_compra_front já ignora ausencias_varreduras > 0.
--   3. Não apaga nada. A conferência completa diária confirma: se o pedido
--      continuar na coluna (ex.: recebido), volta com ausencias = 0; se não,
--      chega a 2 ausências e é arquivado/removido pela rotina existente.
--
-- Travas: não age com lista vazia, nem quando esconderia mais de p_limite
-- pedidos ou mais de 40% dos abertos (resposta anormal da API).
--
-- Rollback: supabase/rollback/20261028_pedidos_compra_conferencia_rapida_rollback.sql

create or replace function public.conciliar_rapida_pedidos_compra_aprovacao(
  p_codigos bigint[],
  p_limite integer default 25
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_abertos integer;
  v_candidatos bigint[];
  v_numeros text[];
  v_reativados integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Apenas o integrador pode conciliar pedidos de compra.';
  end if;

  if p_codigos is null or cardinality(p_codigos) = 0 then
    return jsonb_build_object('revisao_necessaria', true, 'motivo', 'Lista de abertos do Omie vazia; nada alterado.');
  end if;

  -- Pedidos que o Supabase considera abertos (etapa 15, visíveis e com saldo).
  with abertos as (
    select p.cod_ped_compra, p.snapshot->>'numero' as numero
    from public.pedidos_compra_omie p
    where p.ausencias_varreduras = 0
      and p.snapshot->>'etapa' = '15'
      and exists (
        select 1 from jsonb_array_elements(p.snapshot->'itens') i
        where coalesce(nullif(i->>'quantidade','')::numeric, 0)
            > least(coalesce(nullif(i->>'quantidade_recebida','')::numeric, 0),
                    coalesce(nullif(i->>'quantidade','')::numeric, 0))
      )
  )
  select count(*)::integer,
         coalesce(array_agg(cod_ped_compra) filter (where not (cod_ped_compra = any(p_codigos))), '{}'),
         coalesce(array_agg(numero order by numero) filter (where not (cod_ped_compra = any(p_codigos))), '{}')
    into v_abertos, v_candidatos, v_numeros
  from abertos;

  if cardinality(v_candidatos) > p_limite
     or (v_abertos > 0 and cardinality(v_candidatos) * 100 > v_abertos * 40) then
    return jsonb_build_object(
      'revisao_necessaria', true,
      'motivo', 'Quantidade anormal de pedidos fora da lista do Omie; nada escondido.',
      'abertos_supabase', v_abertos,
      'fora_do_omie', cardinality(v_candidatos),
      'numeros', to_jsonb(v_numeros)
    );
  end if;

  update public.pedidos_compra_omie
     set ausencias_varreduras = 0
   where cod_ped_compra = any(p_codigos)
     and ausencias_varreduras <> 0;
  get diagnostics v_reativados = row_count;

  update public.pedidos_compra_omie
     set ausencias_varreduras = 1
   where cod_ped_compra = any(v_candidatos)
     and ausencias_varreduras = 0;

  return jsonb_build_object(
    'revisao_necessaria', false,
    'abertos_supabase', v_abertos,
    'abertos_omie', cardinality(p_codigos),
    'escondidos', cardinality(v_candidatos),
    'numeros_escondidos', to_jsonb(v_numeros),
    'reativados', v_reativados
  );
end;
$function$;

revoke all on function public.conciliar_rapida_pedidos_compra_aprovacao(bigint[], integer) from public, anon, authenticated;
grant execute on function public.conciliar_rapida_pedidos_compra_aprovacao(bigint[], integer) to service_role;
