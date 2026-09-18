import { normalizarTexto } from "@/lib/texto";
import { obterDataDoRegistro } from "./Data";
import { obterDataPedidoRelatorio } from "../pedidos/PedidosRelatorios";

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
});

function dentroDoPeriodo(data, filtros) {
  if ((filtros.dataInicio || filtros.dataFim) && !data) return false;
  if (filtros.dataInicio && data < filtros.dataInicio) return false;
  if (filtros.dataFim && data > filtros.dataFim) return false;
  return true;
}

export function filtrarDadosRelatorio(dados, relatorio, filtros) {
  if (!relatorio || !Array.isArray(dados)) return [];

  const configuracao = relatorio.filtros || {};
  const pedidos = relatorio.fonteDados === "pedidos";

  return dados.filter((item) => {
    if (typeof relatorio.filtroFixo === "function" && !relatorio.filtroFixo(item)) {
      return false;
    }

    if (configuracao.periodo) {
      const data = pedidos
        ? obterDataPedidoRelatorio(item)
        : obterDataDoRegistro(item);
      if (!dentroDoPeriodo(data, filtros)) return false;
    }

    if (pedidos) {
      if (
        configuracao.status && filtros.status && filtros.status !== "todos" &&
        normalizarTexto(item.status) !== normalizarTexto(filtros.status)
      ) return false;

      if (
        configuracao.cliente && filtros.cliente && filtros.cliente !== "todos" &&
        String(item.cliente || "").trim() !== String(filtros.cliente).trim()
      ) return false;

      if (
        configuracao.vendedor && filtros.vendedor && filtros.vendedor !== "todos" &&
        String(item.vendedor || "").trim() !== String(filtros.vendedor).trim()
      ) return false;

      if (configuracao.produto && filtros.cod_prod && filtros.cod_prod !== "Todos") {
        const codigo = String(
          item.codigoProduto ?? item.codigo_produto ?? item.codigo ?? ""
        ).trim();
        if (codigo !== String(filtros.cod_prod).trim()) return false;
      }
      return true;
    }

    if (
      configuracao.injetora && filtros.injetora && filtros.injetora !== "Todos" &&
      String(item.injetora || "").trim() !== String(filtros.injetora).trim()
    ) return false;

    if (configuracao.produto && filtros.cod_prod && filtros.cod_prod !== "Todos") {
      const produto = String(item.cod_prod || item.produto || "").trim();
      if (produto !== String(filtros.cod_prod).trim()) return false;
    }

    if (configuracao.mp && filtros.mp && filtros.mp !== "Todos") {
      const mp = String(item.mp || item.materia_prima || "").trim();
      if (mp !== String(filtros.mp).trim()) return false;
    }

    if (configuracao.tipo && Array.isArray(filtros.tipo) && filtros.tipo.length) {
      const tipo = String(item.tipo || "").trim();
      if (!filtros.tipo.map((valor) => String(valor).trim()).includes(tipo)) {
        return false;
      }
    }

    return true;
  });
}
