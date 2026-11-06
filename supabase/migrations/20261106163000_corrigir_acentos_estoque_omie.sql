-- Acentos "codificados duas vezes" vindos do Omie (ListarPosEstoque):
-- "REFORÇO" estava gravado como "REFORÃ\u0087O" (UTF-8 lido como Latin-1).
-- Afetava 1.288 de 1.320 descrições de estoque_produto_acabado_omie
-- (06/11/2026).
--
-- Esta migration só consegue consertar os textos em que o Omie mandou os
-- dois bytes de cada letra (12 linhas). Em "Á" e "Í" o Omie perde um byte
-- ("PLÁSTICO" chega "PLÃSTICO") e não dá para reconstruir com certeza.
-- O conserto completo vem da função sincronizar-estoque-omie (v8), que
-- recoloca também os bytes perdidos (Á, Í, "às"); na primeira sincronização
-- depois do deploy, todas as descrições são regravadas.
--
-- private.corrigir_acentos_omie: se o texto tem o padrão Ã/Â + caractere
-- de 0x80–0xBF, refaz a leitura como UTF-8; se não der, devolve igual.

create or replace function private.corrigir_acentos_omie(p_texto text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_texto is null or p_texto !~ '[ÃÂ][\u0080-\u00BF]' then
    return p_texto;
  end if;
  return convert_from(convert_to(p_texto, 'LATIN1'), 'UTF8');
exception when others then
  return p_texto;
end;
$$;

revoke all on function private.corrigir_acentos_omie(text) from public, anon, authenticated;

update public.estoque_produto_acabado_omie
   set descricao = private.corrigir_acentos_omie(descricao)
 where descricao ~ '[ÃÂ][\u0080-\u00BF]';
