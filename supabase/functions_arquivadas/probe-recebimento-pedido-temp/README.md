Diagnóstico temporário de 22/10 (publicado como stub 410 depois do uso). Só leitura no Omie.

Objetivo: achar situação e data de recebimento dos pedidos de compra (Dashboard MP pelo Omie).

Conclusões:
- ConsultarPedCompra / PesquisarPedCompra: por item, nQtde, nQtdeRec (quantidade recebida),
  nValMerc (sem IPI), nValorIpi, nValTot (com IPI), nDesconto, nDespesas, nFrete.
  Não traz data de recebimento. Pedido 673: 7000/7000 recebido; 14926: 0 (pendente).
- produtos/recebimentonfe ListarRecebimentos aceita dtEmissaoDe/dtEmissaoAte;
  traz cabec (NF, fornecedor, valor, cEtapa) e infoAdicionais.dRegistro / cCategCompra.
- ConsultarRecebimento (nIdReceb): infoCadastro.dRec = data do recebimento
  ("Recebido em" da tela do Omie), cRecebido, cCancelada; por item itensCabec.nIdPedido,
  nIdItPedido, nQtdeNFe, vTotalItem; itensInfoAdic.nNumPedCompra (nº do pedido);
  itensIPI.nAliqIPI/nValIPI; cabec.cNumeroNFe.
  Ex.: NF 1184 BERLIMPLAST → pedido 640, dRec 28/10/2022 (igual à tela do Omie).
