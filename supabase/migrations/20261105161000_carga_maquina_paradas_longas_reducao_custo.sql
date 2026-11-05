-- Duas paradas longas da INJETORA 10 que vieram sem tipo na importação
-- antiga e que não são de fim de semana. Classificadas em 05/11/2026 a
-- pedido do usuário como Tipo 3, "Parada por redução de custo":
--   - 05/01/2026 05:16 → 06/01/2026 09:07 (27:50:54)
--   - 24/07/2026 05:05 → 29/07/2026 15:41 (130:35:40)
--
-- Os valores originais estão em backup.carga_maquina_sem_tipo_20261105;
-- o rollback de 20261105160000 também desfaz esta migração.

update public.carga_maquina c
set tipo = '3',
    motivo = 'Parada por redução de custo',
    criado_em = now()
from backup.carga_maquina_sem_tipo_20261105 b
where c.id = b.id
  and c.injetora = 'INJETORA 10 DT 800 T TEDERIC'
  and c.duracao in ('27:50:54', '130:35:40')
  and c.tipo = '2'
  and c.motivo = 'Não informado';
