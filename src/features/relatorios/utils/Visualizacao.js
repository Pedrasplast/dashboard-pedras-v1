import { converterNumeroFlexivel } from "@/lib/numeros";

export const TITULOS_COLUNAS_VISUALIZACAO = Object.freeze({
  data: "Data",
  injetora: "Injetora",
  produto: "Produto",
  descricao_produto: "Descrição do Produto",
  mp: "Matéria-Prima",
  tipo: "Tipo",
  conforme: "Conforme",
  danificada: "Danificada",
  total_produzido: "Total Produzido",
  duracao: "Duração",
  produtividade_hora: "UN/H",
  qualidade: "Qualidade",
  motivo: "Motivo",
  justificativa: "Justificativa",
  ocorrencias: "Ocorrências",
  tempo_total: "Tempo Total",
  tempo_medio: "Tempo Médio",
  percentual_impacto: "Percentual Impacto",
  op: "OP",
  descricao: "Descrição",
  quantidade_mp: "Qtd. MP",
  peso_unitario: "Peso Unitário",
  consumo_total: "Consumo Total",
  gasto_unidade: "Gasto por Unidade",
  pedido: "Pedido",
  cliente: "Cliente",
  data_pedido: "Data do Pedido",
  previsao: "Previsão Faturamento",
  dias_atraso: "Dias em Atraso",
  codigo_produto: "Código",
  produto_pedido: "Produto",
  quantidade: "Quantidade",
  unidade: "Un.",
  vendedor: "Vendedor",
  status: "Status",
  pedidos: "Pedidos",
  pedidos_atendidos: "Pedidos Atendidos",
});

export const COLUNAS_NUMERICAS = new Set([
  "conforme",
  "danificada",
  "total_produzido",
  "produtividade_hora",
  "qualidade",
  "ocorrencias",
  "percentual_impacto",
  "quantidade_mp",
  "peso_unitario",
  "consumo_total",
  "gasto_unidade",
  "dias_atraso",
  "quantidade",
  "pedidos",
]);

export function formatarDataVisualizacao(valor) {
  if (!valor) {
    return "-";
  }

  const texto = String(valor).trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : texto;
}

export function formatarTempoComMilhar(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const texto = String(valor).trim();
  const partes = texto.split(":");

  if (partes.length < 2) {
    return texto;
  }

  const horas = Number(partes[0]);
  if (!Number.isFinite(horas)) {
    return texto;
  }

  return [
    horas.toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
    ...partes.slice(1),
  ].join(":");
}

export function criarTituloAutomatico(chave) {
  return String(chave || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export function obterValorVisualizacao(item, chave) {
  switch (chave) {
    case "data":
      return formatarDataVisualizacao(item.inicio_dia || item.inicio || item.data);
    case "data_pedido":
      return formatarDataVisualizacao(item.data_pedido);
    case "previsao":
      return formatarDataVisualizacao(item.previsao);
    case "injetora":
      return item.injetora || "-";
    case "produto":
      return item.cod_prod || item.produto || "-";
    case "descricao_produto":
      return item.descricao_produto || "-";
    case "mp":
      return item.mp || item.materia_prima || "-";
    case "tipo":
      return item.tipo || "-";
    case "conforme":
    case "danificada":
    case "total_produzido":
      return converterNumeroFlexivel(item[chave]).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      });
    case "duracao":
      return formatarTempoComMilhar(item.duracao || item.tempo);
    case "produtividade_hora":
      return Math.round(converterNumeroFlexivel(item.produtividade_hora)).toLocaleString("pt-BR");
    case "qualidade":
      return `${converterNumeroFlexivel(item.qualidade).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`;
    case "motivo":
      return item.motivo || item.descricao || "-";
    case "justificativa":
      return item.justificativa || "-";
    case "ocorrencias":
      return converterNumeroFlexivel(item.ocorrencias).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      });
    case "tempo_total":
    case "tempo_medio":
      return formatarTempoComMilhar(item[chave]);
    case "percentual_impacto":
      return `${converterNumeroFlexivel(item.percentual_impacto).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`;
    case "op":
      return item.op || "-";
    case "descricao":
      return item.descricao || item.justificativa || item.natureza || item.motivo || "-";
    case "quantidade_mp":
      return converterNumeroFlexivel(item.quantidade_mp).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      });
    case "peso_unitario":
      return converterNumeroFlexivel(item.peso_unitario).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    case "consumo_total":
      return converterNumeroFlexivel(item.consumo_total).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    case "gasto_unidade":
      return converterNumeroFlexivel(item.gasto_unidade).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      });
    case "pedido":
      return item.pedido || "-";
    case "cliente":
      return item.cliente || "-";
    case "dias_atraso":
      return converterNumeroFlexivel(item.dias_atraso).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      });
    case "codigo_produto":
      return item.codigo_produto || item.codigoProduto || "-";
    case "produto_pedido":
      return item.produto_pedido || item.produto || "-";
    case "quantidade":
      return converterNumeroFlexivel(item.quantidade).toLocaleString("pt-BR", {
        maximumFractionDigits: 3,
      });
    case "pedidos":
      return converterNumeroFlexivel(item.pedidos).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      });
    case "unidade":
      return item.unidade || "-";
    case "vendedor":
      return item.vendedor || "-";
    case "status":
      return item.status || "-";
    default: {
      const valor = item?.[chave];
      return valor === null || valor === undefined || valor === "" ? "-" : String(valor);
    }
  }
}
