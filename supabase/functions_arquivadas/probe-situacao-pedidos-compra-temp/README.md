Diagnóstico temporário de 22/10 (publicado como stub 410 depois do uso).

Consultou o Omie (PesquisarPedCompra, sem cancelados x só cancelados) para os
pedidos de PP, PE/PET e PP Extrusado. Conclusões:
- nenhum pedido cancelado no período; os que "sumiram" da sincronização de
  compras estão encerrados/em outra situação, e devem entrar na média;
- o filtro dDataInicial/dDataFinal do Omie não é a data de inclusão
  (o pedido 14926, incluído em 16/10 com previsão 23/10, só aparece com
  dDataFinal >= 23/10).
A lógica virou a rotina sincronizar-precos-compras-mp-omie.
