import { normalizarCodigoProduto } from "@/lib/cargaMaquina";
import { valoresUnicos } from "@/shared/lib/colecoes";
import { normalizarTexto } from "@/shared/lib/texto";

import { obterDataPedidoRelatorio } from "../pedidos/PedidosRelatorios";
import { obterDataDoRegistro } from "./Data";
import { obterNumeroPedidoOriginal, obterNumeroPedidoVisual } from "./Pedidos";
import {
  COLUNAS_NUMERICAS,
  TITULOS_COLUNAS_VISUALIZACAO,
  criarTituloAutomatico,
} from "./Visualizacao";

/* =====================================================
   REGRAS DA CENTRAL DE RELATÓRIOS (FUNÇÕES PURAS)

   Filtros, colunas, opções dos filtros e contagem.
   A tela só guarda o estado e chama estas funções.
===================================================== */

/* =====================================================
   FILTROS INICIAIS
===================================================== */

export const criarFiltrosIniciais = (fonteDados = "producao") => ({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  tipo: [],
  status: fonteDados === "pedidos" ? "Pedido" : "todos",
  cliente: "todos",
  vendedor: "todos",
  pedidos: "",
});

/* =====================================================
   FILTRO POR UM OU VÁRIOS PEDIDOS
===================================================== */

export function normalizarListaPedidosFiltro(valor) {
  return String(valor ?? "")
    .split(/[;,\n\r\t ]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizarTexto(item));
}

// "123" encontra 123, 123/1, 123/2...; "123/1" encontra só o desdobramento.
function pedidoCorrespondeAoFiltro(item, pedidosFiltro) {
  if (pedidosFiltro.length === 0) {
    return true;
  }

  const numeroVisual = normalizarTexto(obterNumeroPedidoVisual(item));

  const numeroOriginal = normalizarTexto(obterNumeroPedidoOriginal(item));

  return pedidosFiltro.some((numeroFiltro) => {
    if (numeroFiltro.includes("/")) {
      return numeroVisual === numeroFiltro;
    }

    return (
      numeroOriginal === numeroFiltro ||
      numeroVisual === numeroFiltro ||
      numeroVisual.startsWith(`${numeroFiltro}/`)
    );
  });
}

/* =====================================================
   FILTRAGEM DOS DADOS
===================================================== */

function foraDoPeriodo(dataRegistro, filtros) {
  if ((filtros.dataInicio || filtros.dataFim) && !dataRegistro) {
    return true;
  }

  if (filtros.dataInicio && dataRegistro < filtros.dataInicio) {
    return true;
  }

  return Boolean(filtros.dataFim && dataRegistro > filtros.dataFim);
}

function filtrarPedidos(dados, relatorio, filtros) {
  // Calculados uma vez por filtragem, não por linha.
  const pedidosFiltro = filtros.pedidos ? normalizarListaPedidosFiltro(filtros.pedidos) : [];

  const filtrarStatus = Boolean(
    relatorio.filtros.status && filtros.status && filtros.status !== "todos",
  );

  const statusFiltro = filtrarStatus ? normalizarTexto(filtros.status) : "";

  return dados.filter((item) => {
    /* FILTRO FIXO */

    if (relatorio.filtroFixo && !relatorio.filtroFixo(item)) {
      return false;
    }

    /* PEDIDO(S) */

    if (!pedidoCorrespondeAoFiltro(item, pedidosFiltro)) {
      return false;
    }

    /* STATUS */

    if (filtrarStatus && normalizarTexto(item.status) !== statusFiltro) {
      return false;
    }

    /* PERÍODO */

    if (relatorio.filtros.periodo && foraDoPeriodo(obterDataPedidoRelatorio(item), filtros)) {
      return false;
    }

    /* CLIENTE */

    if (relatorio.filtros.cliente && filtros.cliente && filtros.cliente !== "todos") {
      if (String(item.cliente || "").trim() !== String(filtros.cliente).trim()) {
        return false;
      }
    }

    /* VENDEDOR */

    if (relatorio.filtros.vendedor && filtros.vendedor && filtros.vendedor !== "todos") {
      if (String(item.vendedor || "").trim() !== String(filtros.vendedor).trim()) {
        return false;
      }
    }

    /* PRODUTO */

    if (relatorio.filtros.produto && filtros.cod_prod && filtros.cod_prod !== "Todos") {
      const codigo = String(item.codigoProduto ?? item.codigo_produto ?? item.codigo ?? "").trim();

      if (codigo !== String(filtros.cod_prod).trim()) {
        return false;
      }
    }

    return true;
  });
}

function filtrarProducao(dados, relatorio, filtros) {
  const tiposSelecionados =
    relatorio.filtros.tipo && Array.isArray(filtros.tipo) && filtros.tipo.length > 0
      ? filtros.tipo.map((valor) => String(valor).trim())
      : null;

  return dados.filter((item) => {
    /* FILTRO FIXO */

    if (relatorio.filtroFixo && !relatorio.filtroFixo(item)) {
      return false;
    }

    /* PERÍODO */

    if (relatorio.filtros.periodo && foraDoPeriodo(obterDataDoRegistro(item), filtros)) {
      return false;
    }

    /* INJETORA */

    if (relatorio.filtros.injetora && filtros.injetora && filtros.injetora !== "Todos") {
      if (String(item.injetora || "").trim() !== String(filtros.injetora).trim()) {
        return false;
      }
    }

    /* PRODUTO */

    if (relatorio.filtros.produto && filtros.cod_prod && filtros.cod_prod !== "Todos") {
      const produto = String(item.cod_prod || item.produto || "").trim();

      if (produto !== String(filtros.cod_prod).trim()) {
        return false;
      }
    }

    /* MATÉRIA-PRIMA */

    if (relatorio.filtros.mp && filtros.mp && filtros.mp !== "Todos") {
      const mp = String(item.mp || item.materia_prima || "").trim();

      if (mp !== String(filtros.mp).trim()) {
        return false;
      }
    }

    /* TIPO */

    if (tiposSelecionados && !tiposSelecionados.includes(String(item.tipo || "").trim())) {
      return false;
    }

    return true;
  });
}

export function filtrarDadosRelatorio(dados, relatorio, filtros) {
  if (!Array.isArray(dados) || !relatorio) {
    return [];
  }

  return relatorio.fonteDados === "pedidos"
    ? filtrarPedidos(dados, relatorio, filtros)
    : filtrarProducao(dados, relatorio, filtros);
}

/* =====================================================
   OPÇÕES DOS FILTROS (PRODUÇÃO)
===================================================== */

export function listarProdutosDisponiveis(dados, injetora) {
  let lista = Array.isArray(dados) ? dados : [];

  if (injetora && injetora !== "Todos") {
    lista = lista.filter((item) => String(item.injetora || "").trim() === String(injetora).trim());
  }

  return valoresUnicos(lista.map((item) => item.cod_prod || item.produto));
}

export function listarMpsDisponiveis(dados) {
  return valoresUnicos(dados.map((item) => item.mp || item.materia_prima));
}

// Tipos de parada 1, 2 e 3, em ordem.
export function listarTiposDisponiveis(dados) {
  return [
    ...new Set(
      dados
        .map((item) => String(item.tipo ?? "").trim())
        .filter((tipo) => ["1", "2", "3"].includes(tipo)),
    ),
  ].sort((a, b) => Number(a) - Number(b));
}

/* =====================================================
   COLUNAS DA VISUALIZAÇÃO
===================================================== */

export function montarColunasVisualizacao(relatorio) {
  if (!relatorio || !Array.isArray(relatorio.colunas)) {
    return [];
  }

  const chaves = [...relatorio.colunas];

  /* PRODUÇÃO POR PRODUTO */

  if (relatorio.id === "producao-produto") {
    const indiceProduto = chaves.indexOf("produto");

    if (indiceProduto !== -1 && !chaves.includes("descricao_produto")) {
      chaves.splice(indiceProduto + 1, 0, "descricao_produto");
    }
  }

  return chaves.map((chave) => ({
    chave,

    titulo: TITULOS_COLUNAS_VISUALIZACAO[chave] || criarTituloAutomatico(chave),

    numerica: COLUNAS_NUMERICAS.has(chave),
  }));
}

/* =====================================================
   ASSOCIAÇÃO DA DESCRIÇÃO DO PRODUTO
   (relatório Produção por Produto)
===================================================== */

export function associarDescricaoProduto(dados, descricoesProdutos) {
  return dados.map((item) => {
    const codigo = normalizarCodigoProduto(
      item.produto || item.cod_prod || item.codigo_produto || "",
    );

    const descricaoCadastrada =
      descricoesProdutos instanceof Map
        ? descricoesProdutos.get(codigo)
        : descricoesProdutos?.[codigo];

    const descricaoExistente = String(item.descricao_produto ?? "").trim();

    return {
      ...item,

      descricao_produto:
        descricaoCadastrada ||
        (descricaoExistente && descricaoExistente !== "-" ? descricaoExistente : "-"),
    };
  });
}

/* =====================================================
   CONTAGEM DE REGISTROS

   Pedidos em aberto:
   contabiliza números únicos.

   Demais relatórios:
   contabiliza linhas.
===================================================== */

export function contarRegistrosRelatorio(relatorio, dados = []) {
  if (!Array.isArray(dados)) {
    return 0;
  }

  if (relatorio?.id !== "pedidos-abertos") {
    return dados.length;
  }

  const pedidosUnicos = new Set();

  for (const item of dados) {
    const numeroPedido = String(
      item?.pedido ?? item?.numero_pedido ?? item?.codigoPedido ?? item?.codigo_pedido ?? "",
    ).trim();

    if (numeroPedido) {
      pedidosUnicos.add(numeroPedido);
    }
  }

  return pedidosUnicos.size;
}

/* =====================================================
   TEXTO DOS FILTROS

   Usado nos indicadores, na pré-visualização e no
   cabeçalho do PDF e do Excel.
===================================================== */

function dataParaTexto(dataISO) {
  return dataISO.split("-").reverse().join("/");
}

export function montarTextoFiltrosRelatorio({
  relatorio,
  filtros,
  fonteEhPedidos,
  relatorioEhCustom,
}) {
  if (relatorioEhCustom) {
    return "Filtros internos do relatório";
  }

  const lista = [];

  if (fonteEhPedidos) {
    if (filtros.pedidos) {
      const pedidosSelecionados = normalizarListaPedidosFiltro(filtros.pedidos);

      if (pedidosSelecionados.length > 0) {
        lista.push(`Pedidos: ${pedidosSelecionados.join(", ")}`);
      }
    }

    if (filtros.cliente && filtros.cliente !== "todos") {
      lista.push(`Cliente: ${filtros.cliente}`);
    }

    if (filtros.vendedor && filtros.vendedor !== "todos") {
      lista.push(`Vendedor: ${filtros.vendedor}`);
    }

    if (filtros.cod_prod && filtros.cod_prod !== "Todos") {
      lista.push(`Produto: ${filtros.cod_prod}`);
    }

    if (relatorio?.filtros?.status && filtros.status && filtros.status !== "todos") {
      lista.push(`Status: ${filtros.status}`);
    }
  } else {
    if (filtros.injetora && filtros.injetora !== "Todos") {
      lista.push(`Injetora: ${filtros.injetora}`);
    }

    if (filtros.cod_prod && filtros.cod_prod !== "Todos") {
      lista.push(`Produto: ${filtros.cod_prod}`);
    }

    if (filtros.mp && filtros.mp !== "Todos") {
      lista.push(`MP: ${filtros.mp}`);
    }
  }

  if (filtros.dataInicio) {
    lista.push(`De: ${dataParaTexto(filtros.dataInicio)}`);
  }

  if (filtros.dataFim) {
    lista.push(`Até: ${dataParaTexto(filtros.dataFim)}`);
  }

  return lista.length > 0
    ? lista.join(" | ")
    : fonteEhPedidos
      ? "Status Pedido"
      : "Sem filtros adicionais";
}
