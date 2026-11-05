-- Classifica as paradas importadas sem tipo e sem motivo (jan–jul/2026,
-- importação de 07/08/2026). Decisão aprovada em 05/11/2026:
--   - paradas de 8 h ou mais no fim de semana → Tipo 3, "Final de Semana/ sem expediente";
--   - todas as outras → Tipo 2, "Não informado".
--
-- criado_em é atualizado para now() porque o app sincroniza o cache local
-- (IndexedDB) por criado_em: assim os navegadores baixam só estas linhas
-- corrigidas, sem precisar limpar o cache.
--
-- Backup das linhas originais: backup.carga_maquina_sem_tipo_20261105
-- (schema fora da API). Para desfazer:
-- supabase/rollback/20261105_carga_maquina_classificar_paradas_sem_tipo_rollback.sql

create schema if not exists backup;
revoke all on schema backup from public, anon, authenticated;

create table if not exists backup.carga_maquina_sem_tipo_20261105 as
select *
from public.carga_maquina
where status = 'Indisponível'
  and coalesce(tipo, '') = '';

-- Fim de semana: 8 h ou mais, começando sexta a partir das 18:00 ou sábado
-- (horário de São Paulo). São 9 paradas, que vão até segunda.
update public.carga_maquina
set tipo = '3',
    motivo = 'Final de Semana/ sem expediente',
    criado_em = now()
where status = 'Indisponível'
  and coalesce(tipo, '') = ''
  and nullif(duracao, '') is not null
  and nullif(duracao, '')::interval >= interval '8 hours'
  and (
    extract(isodow from inicio at time zone 'America/Sao_Paulo') = 6
    or (
      extract(isodow from inicio at time zone 'America/Sao_Paulo') = 5
      and extract(hour from inicio at time zone 'America/Sao_Paulo') >= 18
    )
  );

update public.carga_maquina
set tipo = '2',
    motivo = 'Não informado',
    criado_em = now()
where status = 'Indisponível'
  and coalesce(tipo, '') = '';
