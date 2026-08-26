import { converterNumeroFlexivel as converterNumero } from "@/lib/numeros";
import { normalizarTexto } from "@/lib/texto";

const DATA_FIM_ORDENACAO = "9999-12-31";
const SEM_DATA = "Sem data";

export function normalizarDataPedido(valor) {
  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  const formatoBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (formatoBr) {
    return `${formatoBr[3]}-${formatoBr[2]}-${formatoBr[1]}`;
  }

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function obterDataPedidoRelatorio(item) {
  return normalizarDataPedido(
    item?.previsao ?? item?.data_previsao ?? item?.previsao_faturamento,
  );
}

function obterHojeIso() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function calcularDiasAtrasoPedido(previsao) {
  const dataIso = normalizarDataPedido(previsao);
  if (!dataIso) {
    return 0;
  }

  const hojeIso = obterHojeIso();
  if (dataIso >= hojeIso) {
    return 0;
  }

  const [anoPrevisao, mesPrevisao, diaPrevisao] = dataIso.split("-").map(Number);
  const [anoHoje, mesHoje, diaHoje] = hojeIso.split("-").map(Number);

  const dataPrevisao = new Date(anoPrevisao, mesPrevisao - 1, diaPrevisao);
  const dataHoje = new Date(anoHoje, mesHoje - 1, diaHoje);

  return Math.floor(
    (dataHoje.getTime() - dataPrevisao.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function pedidoEstaAtrasadoRelatorio(item) {
  return (
    normalizarTexto(item?.status) === "pedido" &&
    calcularDiasAtrasoPedido(item?.previsao) > 0
  );
}

function obterChavePedido(item) {
  return String(
    item?.codigoPedido ??
      item?.codigo_pedido ??
      item?.pedido ??
      item?.numero_pedido ??
      item?.id ??
      "",
  );
}

function obterNumeroPedidoVisivel(item) {
  return String(
    item?.pedido ??
      item?.numero_pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "",
  ).trim();
}

function obterCodigoProduto(item) {
  return String(
    item?.codigoProduto ?? item?.codigo_produto ?? item?.codigo ?? "-",
  ).trim() || "-";
}

function obterDescricaoProduto(item) {
  return item?.produto ?? item?.descricao_produto ?? item?.descricao ?? "-";
}

function obterUnidade(item) {
  return item?.unidade ?? item?.un ?? "-";
}

function normalizarItemPedido(item) {
  return {
    pedido:
      item?.pedido ??
      item?.numero_pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "-",
    cliente: item?.cliente ?? item?.nome_cliente ?? "-",
    data_pedido: normalizarDataPedido(item?.data ?? item?.data_pedido),
    previsao: obterDataPedidoRelatorio(item),
    codigo_produto: obterCodigoProduto(item),
    produto_pedido: obterDescricaoProduto(item),
    quantidade: converterNumero(item?.quantidade),
    unidade: obterUnidade(item),
    vendedor: item?.vendedor ?? item?.nome_vendedor ?? "-",
    status: item?.status ?? "-",
    dias_atraso: calcularDiasAtrasoPedido(item?.previsao),
  };
}

function compararPedido(a, b) {
  return String(a.pedido).localeCompare(String(b.pedido), "pt-BR", {
    numeric: true,
  });
}

function compararPrevisaoEPedido(a, b) {
  const dataA = a.previsao || DATA_FIM_ORDENACAO;
  const dataB = b.previsao || DATA_FIM_ORDENACAO;
  return dataA !== dataB ? dataA.localeCompare(dataB) : compararPedido(a, b);
}

export function prepararPedidosDetalhados(dados = []) {
  return Array.isArray(dados)
    ? dados.map(normalizarItemPedido).sort(compararPrevisaoEPedido)
    : [];
}

export function prepararPedidosAtrasados(dados = []) {
  if (!Array.isArray(dados)) {
    return [];
  }

  return dados
    .filter(pedidoEstaAtrasadoRelatorio)
    .map(normalizarItemPedido)
    .sort((a, b) =>
      b.dias_atraso !== a.dias_atraso
        ? b.dias_atraso - a.dias_atraso
        : compararPedido(a, b),
    );
}

function criarGrupoProduto(item, codigo, previsao) {
  return {
    ...(previsao !== undefined ? { previsao } : {}),
    codigo_produto: codigo,
    produto_pedido: obterDescricaoProduto(item),
    unidade: obterUnidade(item),
    quantidade: 0,
    _pedidos: new Set(),
  };
}

export function agruparPedidosPorCodigoProduto(dados = []) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const mapa = new Map();

  for (const item of dados) {
    const codigo = obterCodigoProduto(item);
    const numeroPedido = obterNumeroPedidoVisivel(item);

    if (!mapa.has(codigo)) {
      mapa.set(codigo, criarGrupoProduto(item, codigo));
    }

    const grupo = mapa.get(codigo);
    grupo.quantidade += converterNumero(item?.quantidade);

    if (numeroPedido) {
      grupo._pedidos.add(numeroPedido);
    }
  }

  return [...mapa.values()]
    .map((grupo) => {
      const pedidosOrdenados = [...grupo._pedidos].sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR", { numeric: true }),
      );

      return {
        codigo_produto: grupo.codigo_produto,
        produto_pedido: grupo.produto_pedido,
        unidade: grupo.unidade,
        quantidade: grupo.quantidade,
        pedidos: pedidosOrdenados.length,
        pedidos_atendidos: pedidosOrdenados.join(", "),
      };
    })
    .sort((a, b) => b.quantidade - a.quantidade);
}

export function agruparPedidosPorDataProduto(dados = []) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const mapa = new Map();

  for (const item of dados) {
    const previsao = obterDataPedidoRelatorio(item) || SEM_DATA;
    const codigo = obterCodigoProduto(item);
    const chavePedido = obterChavePedido(item);
    const chave = `${previsao}||${codigo}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, criarGrupoProduto(item, codigo, previsao));
    }

    const grupo = mapa.get(chave);
    grupo.quantidade += converterNumero(item?.quantidade);

    if (chavePedido) {
      grupo._pedidos.add(chavePedido);
    }
  }

  return [...mapa.values()]
    .map((grupo) => ({
      previsao: grupo.previsao,
      codigo_produto: grupo.codigo_produto,
      produto_pedido: grupo.produto_pedido,
      unidade: grupo.unidade,
      quantidade: grupo.quantidade,
      pedidos: grupo._pedidos.size,
    }))
    .sort((a, b) => {
      const dataA = a.previsao === SEM_DATA ? DATA_FIM_ORDENACAO : a.previsao;
      const dataB = b.previsao === SEM_DATA ? DATA_FIM_ORDENACAO : b.previsao;

      if (dataA !== dataB) {
        return dataA.localeCompare(dataB);
      }

      return String(a.codigo_produto).localeCompare(String(b.codigo_produto), "pt-BR", {
        numeric: true,
      });
    });
}
