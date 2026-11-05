-- Desfaz 20261105160000_carga_maquina_classificar_paradas_sem_tipo.sql:
-- volta tipo e motivo das 474 paradas para o que estava antes (vazio).
--
-- criado_em recebe now() de novo (e não o valor antigo) para que o cache
-- local dos navegadores baixe a correção.

update public.carga_maquina c
set tipo = b.tipo,
    motivo = b.motivo,
    criado_em = now()
from backup.carga_maquina_sem_tipo_20261105 b
where c.id = b.id;

-- Depois de conferir, o backup pode ser apagado:
-- drop table backup.carga_maquina_sem_tipo_20261105;
