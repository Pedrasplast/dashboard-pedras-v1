/* =========================================================
   MONITORAMENTO DAS ROTINAS — CONSTANTES
========================================================= */

/* Plano free: leitura a cada 5 min (regra do README). */
export const INTERVALO_ATUALIZACAO = 5 * 60 * 1000;
export const TEMPO_DADOS_FRESCOS = 2 * 60 * 1000;

export const QUERY_KEY_ROTINAS = ["monitoramento", "rotinas"];
export const QUERY_KEY_BANCO = ["monitoramento", "banco"];
export const QUERY_KEY_RESUMO = ["monitoramento", "resumo"];
export const queryKeyHistorico = (rotina) => ["monitoramento", "historico", rotina];

export const LIMITE_HISTORICO = 30;

/* Nome amigável e o que cada rotina faz (chave = nome do cron). */
export const ROTINAS = Object.freeze({
  "sincronizar-pedidos-omie-15min": {
    nome: "Pedidos de venda",
    descricao: "Traz do Omie os pedidos de venda novos e alterados.",
  },
  "reconciliar-status-pedidos-omie-horario": {
    nome: "Conferência de status dos pedidos de venda",
    descricao: "Confere no Omie o status dos pedidos ativos, um grupo por vez.",
  },
  "sincronizar-estoque-omie-rapido-5min": {
    nome: "Estoque de produto acabado (rápido)",
    descricao: "Atualiza saldo, físico e reservado dos produtos acabados.",
  },
  "sincronizar-estoque-omie-completo-horario": {
    nome: "Estoque de produto acabado (completo)",
    descricao: "Atualização completa, inclusive o estoque mínimo.",
  },
  "sincronizar-estoque-mp-matriz-30min": {
    nome: "Estoque de matéria-prima",
    descricao: "Saldo e estoque mínimo da matéria-prima no local Matriz.",
  },
  "sincronizar-pedidos-compra-omie-1min": {
    nome: "Pedidos de compra",
    descricao: "Traz do Omie os pedidos de compra novos e alterados.",
  },
  "conferencia-completa-pedidos-compra-madrugada": {
    nome: "Conferência completa dos pedidos de compra (início)",
    descricao: "Começa a conferência de todos os pedidos de compra do Omie.",
  },
  "continuar-conferencia-completa-pedidos-compra": {
    nome: "Conferência completa dos pedidos de compra (continuação)",
    descricao: "Continua a conferência completa até a última página.",
  },
  "sincronizar-requisicoes-compra-omie-2min": {
    nome: "Requisições de compra",
    descricao: "Traz do Omie as requisições de compra ativas.",
  },
  "atualizar-compras-futuras-mp-30min": {
    nome: "Compras futuras de matéria-prima",
    descricao: "Pedidos de compra pendentes dos materiais acompanhados.",
  },
  "atualizar-precos-compras-mp-omie": {
    nome: "Preços médios de matéria-prima",
    descricao: "Busca no Omie as compras dos últimos 60 dias para as médias da Tabela de Preços.",
  },
  "sincronizar-financeiro-omie-05h-12h": {
    nome: "Financeiro",
    descricao: "Atualiza os dados financeiros do Omie.",
  },
  "limpar-historico-cron-14d": {
    nome: "Limpeza de históricos (14 dias)",
    descricao: "Apaga histórico de execuções e do monitoramento com mais de 14 dias.",
  },
  "limpar-sincronizacao-omie-historico-60d": {
    nome: "Limpeza do histórico de sincronização (60 dias)",
    descricao: "Apaga o histórico de sincronizações com mais de 60 dias.",
  },
  "monitorar-tamanho-banco-diario": {
    nome: "Tamanho do banco de dados",
    descricao: "Registra o tamanho do banco uma vez por dia.",
  },
});

/* Rotinas que rodam só no banco (não chamam funções nem o Omie). */
export const ROTINAS_SO_BANCO = Object.freeze(new Set([
  "limpar-historico-cron-14d",
  "limpar-sincronizacao-omie-historico-60d",
  "monitorar-tamanho-banco-diario",
]));

export const SITUACAO = Object.freeze({
  ERRO: "erro",
  RODANDO: "rodando",
  OK: "ok",
  DESATIVADA: "desativada",
  SEM_DADOS: "sem_dados",
});

export const ROTULO_SITUACAO = Object.freeze({
  [SITUACAO.ERRO]: "Com erro",
  [SITUACAO.RODANDO]: "Rodando",
  [SITUACAO.OK]: "OK",
  [SITUACAO.DESATIVADA]: "Desativada",
  [SITUACAO.SEM_DADOS]: "Sem execução",
});

/* Ordem na tela: problemas primeiro. */
export const ORDEM_SITUACAO = Object.freeze({
  [SITUACAO.ERRO]: 0,
  [SITUACAO.RODANDO]: 1,
  [SITUACAO.SEM_DADOS]: 2,
  [SITUACAO.OK]: 3,
  [SITUACAO.DESATIVADA]: 4,
});

/* Níveis gravados pela rotina diária de tamanho do banco (plano free: 500 MB). */
export const NIVEIS_BANCO_ALERTA = Object.freeze(new Set(["ALERTA", "CRITICO"]));

export const ROTULO_NIVEL_BANCO = Object.freeze({
  OK: "OK",
  ATENCAO: "Atenção",
  ALERTA: "Alerta",
  CRITICO: "Crítico",
});
