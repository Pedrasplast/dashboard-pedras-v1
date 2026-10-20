-- ROLLBACK: versão original (antes de 2026-10-20) de aplicar_snapshot_rapido_estoque_omie.
-- Zera todas as linhas válidas e regrava as recebidas do Omie (2 gravações por linha a cada execução).
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
  v_ignorados integer := 0;
  v_duplicados integer := 0;
begin
  if p_posicoes is null or jsonb_typeof(p_posicoes) <> 'array' then
    raise exception 'p_posicoes deve ser um array JSON';
  end if;

  select jsonb_array_length(p_posicoes) into v_recebidos;

  if v_recebidos = 0 then
    raise exception 'Snapshot rápido vazio; nenhuma alteração foi aplicada';
  end if;

  with dados as (
    select
      x.codigo_produto_omie,
      x.codigo_local_estoque
    from jsonb_to_recordset(p_posicoes) as x(
      codigo_produto_omie bigint,
      codigo_local_estoque bigint,
      saldo numeric,
      fisico numeric,
      reservado numeric
    )
  )
  select count(*) - count(distinct (codigo_produto_omie, codigo_local_estoque))
    into v_duplicados
  from dados;

  if v_duplicados > 0 then
    raise exception 'Snapshot rápido contém % chave(s) duplicada(s)', v_duplicados;
  end if;

  select count(*)
    into v_total_base
  from public.estoque_produto_acabado_omie e
  where e.ativo = true
    and e.tipo_item = '04'
    and exists (
      select 1
      from public.locais_estoque_omie l
      where l.codigo_local_estoque = e.codigo_local_estoque
        and l.inativo = false
    );

  if v_total_base = 0 then
    raise exception 'Base definitiva de estoque está vazia; snapshot rápido cancelado';
  end if;

  update public.estoque_produto_acabado_omie e
  set
    saldo = 0,
    fisico = 0,
    reservado = 0,
    data_posicao = p_data_posicao,
    sincronizado_em = p_sincronizado_em,
    atualizado_em = p_sincronizado_em
  where e.ativo = true
    and e.tipo_item = '04'
    and exists (
      select 1
      from public.locais_estoque_omie l
      where l.codigo_local_estoque = e.codigo_local_estoque
        and l.inativo = false
    );

  with dados as (
    select *
    from jsonb_to_recordset(p_posicoes) as x(
      codigo_produto_omie bigint,
      codigo_local_estoque bigint,
      saldo numeric,
      fisico numeric,
      reservado numeric
    )
  )
  update public.estoque_produto_acabado_omie e
  set
    saldo = coalesce(d.saldo, 0),
    fisico = coalesce(d.fisico, 0),
    reservado = coalesce(d.reservado, 0),
    data_posicao = p_data_posicao,
    sincronizado_em = p_sincronizado_em,
    atualizado_em = p_sincronizado_em
  from dados d
  where e.codigo_produto_omie = d.codigo_produto_omie
    and e.codigo_local_estoque = d.codigo_local_estoque
    and e.ativo = true
    and e.tipo_item = '04'
    and exists (
      select 1
      from public.locais_estoque_omie l
      where l.codigo_local_estoque = e.codigo_local_estoque
        and l.inativo = false
    );

  get diagnostics v_atualizados = row_count;
  v_ignorados := greatest(v_recebidos - v_atualizados, 0);

  return jsonb_build_object(
    'total_base', v_total_base,
    'recebidos', v_recebidos,
    'atualizados', v_atualizados,
    'ignorados', v_ignorados,
    'duplicados', v_duplicados
  );
end;
$function$;
