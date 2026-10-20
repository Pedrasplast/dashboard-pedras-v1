-- Estoque rápido: grava somente as linhas cujo saldo/físico/reservado mudou.
--
-- Antes: a cada execução (a cada 15 min) zerava todas as linhas válidas e
-- depois regravava as recebidas do Omie -> ~1.330 gravações por execução,
-- mesmo sem nenhuma mudança (11 milhões de updates acumulados).
-- Agora: calcula o valor final de cada linha (valor do Omie ou 0 se o item
-- não veio) e só atualiza quando difere do atual. Resultado final idêntico.
--
-- Datas por linha (data_posicao, sincronizado_em, atualizado_em) passam a
-- mudar só quando a linha muda. A hora da última sincronização continua em
-- public.sincronizacao_estoque_omie. Retorno compatível + 'linhas_alteradas'.
--
-- Rollback: supabase/rollback/20261020_aplicar_snapshot_rapido_estoque_omie_ORIGINAL.sql
CREATE OR REPLACE FUNCTION public.aplicar_snapshot_rapido_estoque_omie(p_sincronizado_em timestamp with time zone, p_data_posicao date, p_posicoes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_total_base integer := 0;
  v_recebidos integer := 0;
  v_atualizados integer := 0;
  v_alterados integer := 0;
  v_duplicados integer := 0;
begin
  if p_posicoes is null or jsonb_typeof(p_posicoes) <> 'array' then
    raise exception 'p_posicoes deve ser um array JSON';
  end if;

  v_recebidos := jsonb_array_length(p_posicoes);

  if v_recebidos = 0 then
    raise exception 'Snapshot rápido vazio; nenhuma alteração foi aplicada';
  end if;

  select count(*) - count(distinct (codigo_produto_omie, codigo_local_estoque))
    into v_duplicados
  from jsonb_to_recordset(p_posicoes) as x(codigo_produto_omie bigint, codigo_local_estoque bigint);

  if v_duplicados > 0 then
    raise exception 'Snapshot rápido contém % chave(s) duplicada(s)', v_duplicados;
  end if;

  select count(*)
    into v_total_base
  from public.estoque_produto_acabado_omie e
  where e.ativo = true
    and e.tipo_item = '04'
    and exists (
      select 1 from public.locais_estoque_omie l
      where l.codigo_local_estoque = e.codigo_local_estoque and l.inativo = false
    );

  if v_total_base = 0 then
    raise exception 'Base definitiva de estoque está vazia; snapshot rápido cancelado';
  end if;

  -- Quantas posições recebidas existem na base válida (mesma contagem da versão anterior).
  with dados as (
    select * from jsonb_to_recordset(p_posicoes) as x(
      codigo_produto_omie bigint, codigo_local_estoque bigint,
      saldo numeric, fisico numeric, reservado numeric)
  )
  select count(*)
    into v_atualizados
  from dados d
  join public.estoque_produto_acabado_omie e
    on e.codigo_produto_omie = d.codigo_produto_omie
   and e.codigo_local_estoque = d.codigo_local_estoque
  where e.ativo = true
    and e.tipo_item = '04'
    and exists (
      select 1 from public.locais_estoque_omie l
      where l.codigo_local_estoque = e.codigo_local_estoque and l.inativo = false
    );

  -- Valor final de cada linha válida: o recebido do Omie, ou 0 se não veio.
  -- Só grava quando muda.
  with dados as (
    select * from jsonb_to_recordset(p_posicoes) as x(
      codigo_produto_omie bigint, codigo_local_estoque bigint,
      saldo numeric, fisico numeric, reservado numeric)
  ),
  alvo as (
    select
      e.id,
      coalesce(d.saldo, 0) as saldo,
      coalesce(d.fisico, 0) as fisico,
      coalesce(d.reservado, 0) as reservado
    from public.estoque_produto_acabado_omie e
    left join dados d
      on d.codigo_produto_omie = e.codigo_produto_omie
     and d.codigo_local_estoque = e.codigo_local_estoque
    where e.ativo = true
      and e.tipo_item = '04'
      and exists (
        select 1 from public.locais_estoque_omie l
        where l.codigo_local_estoque = e.codigo_local_estoque and l.inativo = false
      )
  )
  update public.estoque_produto_acabado_omie e
  set
    saldo = a.saldo,
    fisico = a.fisico,
    reservado = a.reservado,
    data_posicao = p_data_posicao,
    sincronizado_em = p_sincronizado_em,
    atualizado_em = p_sincronizado_em
  from alvo a
  where e.id = a.id
    and (e.saldo, e.fisico, e.reservado) is distinct from (a.saldo, a.fisico, a.reservado);

  get diagnostics v_alterados = row_count;

  return jsonb_build_object(
    'total_base', v_total_base,
    'recebidos', v_recebidos,
    'atualizados', v_atualizados,
    'ignorados', greatest(v_recebidos - v_atualizados, 0),
    'duplicados', v_duplicados,
    'linhas_alteradas', v_alterados
  );
end;
$function$;
