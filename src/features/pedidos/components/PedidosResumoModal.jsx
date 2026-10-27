import { useMemo, useState } from "react";

import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  PackageSearch,
  ShoppingCart,
  X,
} from "lucide-react";

import { formatarNumero } from "../utils/format.utils";

import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";

import "./PedidosResumoModal.css";

/* =========================================================
   IDENTIFICAÇÃO DOS PEDIDOS
========================================================= */

function obterChavePedido(pedido) {
  return String(
    pedido?.codigoPedido ??
      pedido?.codigo_pedido ??
      pedido?.pedidoOriginal ??
      pedido?.numero_pedido ??
      pedido?.pedido ??
      pedido?.id ??
      "",
  ).trim();
}

function obterNumeroPedido(pedido) {
  return (
    pedido?.pedidoExibicao ?? pedido?.pedido ?? pedido?.numero_pedido ?? pedido?.numeroPedido ?? "-"
  );
}

/* =========================================================
   IDENTIFICAÇÃO DOS PRODUTOS
========================================================= */

function obterCodigoProduto(item) {
  return (
    String(
      item?.codigoProduto ?? item?.codigo_produto ?? item?.cod_prod ?? item?.codigo ?? "",
    ).trim() || "-"
  );
}

function obterDescricaoProduto(item) {
  return (
    String(
      item?.produto ?? item?.descricao_produto ?? item?.produto_pedido ?? item?.descricao ?? "",
    ).trim() || "-"
  );
}

function obterQuantidade(item) {
  const valor = item?.quantidade;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const texto = String(valor ?? "").trim();

  if (!texto) {
    return 0;
  }

  const normalizado = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : 0;
}

/* =========================================================
   DATAS
========================================================= */

function converterData(valor) {
  if (!valor) return null;

  const texto = String(valor).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);

    return new Date(ano, mes - 1, dia);
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const data = new Date(texto);

  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarData(valor) {
  const data = converterData(valor);

  return data ? data.toLocaleDateString("pt-BR") : "-";
}

/* =========================================================
   AGRUPAMENTO DOS PEDIDOS E SEUS ITENS
========================================================= */

function prepararRegistros(pedidos, todosPedidos) {
  const linhasPorPedido = new Map();

  for (const linha of todosPedidos) {
    const chave = obterChavePedido(linha);

    if (!chave) continue;

    if (!linhasPorPedido.has(chave)) {
      linhasPorPedido.set(chave, []);
    }

    linhasPorPedido.get(chave).push(linha);
  }

  const registros = [];
  const chavesAdicionadas = new Set();

  for (const pedido of pedidos) {
    const chave = obterChavePedido(pedido);

    if (chave && chavesAdicionadas.has(chave)) {
      continue;
    }

    if (chave) {
      chavesAdicionadas.add(chave);
    }

    const linhas = linhasPorPedido.get(chave) ?? [pedido];

    const itens = linhas.map((linha, indice) => ({
      id: `${chave || "pedido"}-${indice}`,
      codigo: obterCodigoProduto(linha),
      descricao: obterDescricaoProduto(linha),
      quantidade: obterQuantidade(linha),
    }));

    const quantidade = itens.reduce((total, item) => total + item.quantidade, 0);

    registros.push({
      chave: chave || `registro-${registros.length}`,
      numero: obterNumeroPedido(pedido),
      cliente: pedido?.cliente ?? "-",
      previsao: pedido?.previsao ?? null,
      quantidade,
      itens,
    });
  }

  return registros;
}

/* =========================================================
   LINHAS DA TABELA
========================================================= */

function LinhasPedido({ registro, expandido, onAlternar }) {
  const { itens } = registro;

  const primeiroItem = itens[0];

  const itensAdicionais = itens.slice(1);

  const temItensAdicionais = itensAdicionais.length > 0;

  return (
    <>
      {/* LINHA PRINCIPAL DO PEDIDO */}

      <tr
        className={
          expandido
            ? "pedidos-resumo-modal-linha-principal pedidos-resumo-modal-linha-expandida"
            : "pedidos-resumo-modal-linha-principal"
        }
      >
        <td className="pedidos-resumo-modal-pedido">{registro.numero}</td>

        <td className="pedidos-resumo-modal-cliente">{registro.cliente}</td>

        <td className="pedidos-resumo-modal-data">{formatarData(registro.previsao)}</td>

        <td className="pedidos-resumo-modal-codigo">{primeiroItem?.codigo ?? "-"}</td>

        <td className="pedidos-resumo-modal-descricao">
          <div className="pedidos-resumo-modal-produto-conteudo">
            <span className="pedidos-resumo-modal-produto-texto">
              {primeiroItem?.descricao ?? "-"}
            </span>

            {temItensAdicionais && (
              <button
                type="button"
                className="pedidos-resumo-modal-expandir"
                onClick={onAlternar}
                aria-expanded={expandido}
                aria-label={
                  expandido
                    ? `Recolher itens do pedido ${registro.numero}`
                    : `Mostrar mais ${itensAdicionais.length} itens do pedido ${registro.numero}`
                }
                title={expandido ? "Recolher itens" : "Mostrar itens"}
              >
                <span>
                  +{itensAdicionais.length} {itensAdicionais.length === 1 ? "item" : "itens"}
                </span>

                {expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>
        </td>

        <td className="pedidos-resumo-modal-quantidade">{formatarNumero(registro.quantidade)}</td>
      </tr>

      {/* ITENS ADICIONAIS EXPANDIDOS */}

      {temItensAdicionais &&
        expandido &&
        itensAdicionais.map((item) => (
          <tr key={item.id} className="pedidos-resumo-modal-linha-item">
            <td>
              <span className="pedidos-resumo-modal-item-marcador" />
            </td>

            <td />
            <td />

            <td className="pedidos-resumo-modal-codigo pedidos-resumo-modal-item-codigo">
              {item.codigo}
            </td>

            <td className="pedidos-resumo-modal-descricao">{item.descricao}</td>

            <td className="pedidos-resumo-modal-quantidade">{formatarNumero(item.quantidade)}</td>
          </tr>
        ))}
    </>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function PedidosResumoModal({
  aberto,
  titulo,
  descricao,
  pedidos = [],
  todosPedidos = [],
  onFechar,
}) {
  const [pedidosExpandidos, setPedidosExpandidos] = useState(() => new Set());

  const registros = useMemo(
    () => prepararRegistros(pedidos, todosPedidos),
    [pedidos, todosPedidos],
  );

  const quantidadeTotal = useMemo(
    () => registros.reduce((total, registro) => total + registro.quantidade, 0),
    [registros],
  );

  function alternarPedido(chave) {
    setPedidosExpandidos((anterior) => {
      const proximo = new Set(anterior);

      if (proximo.has(chave)) {
        proximo.delete(chave);
      } else {
        proximo.add(chave);
      }

      return proximo;
    });
  }

  if (!aberto) {
    return null;
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} tamanho="grande" className="pedidos-resumo-modal">
      {/* CABEÇALHO */}

      <header className="pedidos-resumo-modal-header" data-modal-header="">
        <div className="pedidos-resumo-modal-titulo">
          <div className="pedidos-resumo-modal-icone" data-modal-icone="">
            <CalendarClock size={21} />
          </div>

          <div>
            <span>Pedidos</span>

            <ModalTitulo>
              <h2>{titulo}</h2>
            </ModalTitulo>

            {descricao && <p>{descricao}</p>}
          </div>
        </div>

        <button
          type="button"
          className="pedidos-resumo-modal-fechar"
          onClick={onFechar}
          aria-label="Fechar"
          data-modal-fechar=""
        >
          <X size={20} />
        </button>
      </header>

      {/* INDICADORES */}

      <div className="pedidos-resumo-modal-indicadores">
        <div>
          <ShoppingCart size={18} />
          <span>Pedidos</span>
          <strong>{registros.length}</strong>
        </div>

        <div>
          <PackageSearch size={18} />
          <span>Quantidade</span>
          <strong>{formatarNumero(quantidadeTotal)}</strong>
        </div>
      </div>

      {/* TABELA */}

      {registros.length === 0 ? (
        <div className="pedidos-resumo-modal-vazio">
          Nenhum pedido encontrado para este indicador.
        </div>
      ) : (
        <div className="pedidos-resumo-modal-tabela-wrapper">
          <table className="pedidos-resumo-modal-tabela">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Previsão faturamento</th>
                <th>Código produto</th>
                <th>Descrição do produto</th>
                <th className="pedidos-resumo-modal-coluna-quantidade">Quantidade</th>
              </tr>
            </thead>

            <tbody>
              {registros.map((registro) => (
                <LinhasPedido
                  key={registro.chave}
                  registro={registro}
                  expandido={pedidosExpandidos.has(registro.chave)}
                  onAlternar={() => alternarPedido(registro.chave)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RODAPÉ */}

      <footer className="pedidos-resumo-modal-footer" data-modal-footer="">
        <span>
          {registros.length === 1
            ? "1 pedido encontrado"
            : `${registros.length} pedidos encontrados`}
        </span>

        <button type="button" onClick={onFechar} data-modal-acao="primaria" data-modal-fechar="">
          Fechar
        </button>
      </footer>
    </Modal>
  );
}
