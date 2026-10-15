import {
  RotateCcw,
  Search,
} from "lucide-react";

import {
  SITUACOES_RECEBIMENTO,
  TIPOS_DOCUMENTO,
} from "../constants/pedidosCompra.constants";

import "./PedidosCompraFiltros.css";

export default function PedidosCompraFiltros({
  filtros,
  fornecedores,
  compradores,
  possuiFiltro,
  onChange,
  onLimpar,
}) {
  const somenteRequisicoes =
    filtros.tipoDocumento ===
    TIPOS_DOCUMENTO.REQUISICAO;

  return (
    <section className="compras-filtros">
      <div className="compras-filtros-linha-principal">
        <div className="compras-pesquisa">
          <Search
            size={18}
          />

          <input
            type="text"
            value={
              filtros.pesquisa
            }
            onChange={(
              event,
            ) =>
              onChange(
                "pesquisa",
                event.target.value,
              )
            }
            placeholder="Buscar por requisição, pedido, código, produto, categoria ou observação..."
          />
        </div>

        <select
          value={
            filtros.tipoDocumento
          }
          onChange={(
            event,
          ) =>
            onChange(
              "tipoDocumento",
              event.target.value,
            )
          }
        >
          <option
            value={
              TIPOS_DOCUMENTO.TODOS
            }
          >
            Pedidos e requisições
          </option>

          <option
            value={
              TIPOS_DOCUMENTO.PEDIDO
            }
          >
            Somente pedidos
          </option>

          <option
            value={
              TIPOS_DOCUMENTO.REQUISICAO
            }
          >
            Somente requisições
          </option>
        </select>

        <select
          value={
            filtros.fornecedor
          }
          disabled={
            somenteRequisicoes
          }
          onChange={(
            event,
          ) =>
            onChange(
              "fornecedor",
              event.target.value,
            )
          }
          title={
            somenteRequisicoes
              ? "Filtro não utilizado em requisições"
              : undefined
          }
        >
          <option value="todos">
            {somenteRequisicoes
              ? "Fornecedor não se aplica"
              : "Todos os fornecedores"}
          </option>

          {!somenteRequisicoes &&
            fornecedores.map(
              (
                nome,
              ) => (
                <option
                  key={
                    nome
                  }
                  value={
                    nome
                  }
                >
                  {nome}
                </option>
              ),
            )}
        </select>

        <select
          value={
            filtros.comprador
          }
          disabled={
            somenteRequisicoes
          }
          onChange={(
            event,
          ) =>
            onChange(
              "comprador",
              event.target.value,
            )
          }
          title={
            somenteRequisicoes
              ? "Filtro não utilizado em requisições"
              : undefined
          }
        >
          <option value="todos">
            {somenteRequisicoes
              ? "Comprador não se aplica"
              : "Todos os compradores"}
          </option>

          {!somenteRequisicoes &&
            compradores.map(
              (
                nome,
              ) => (
                <option
                  key={
                    nome
                  }
                  value={
                    nome
                  }
                >
                  {nome}
                </option>
              ),
            )}
        </select>

        <select
          value={
            filtros.recebimento
          }
          disabled={
            somenteRequisicoes
          }
          onChange={(
            event,
          ) =>
            onChange(
              "recebimento",
              event.target.value,
            )
          }
          title={
            somenteRequisicoes
              ? "Filtro não utilizado em requisições"
              : undefined
          }
        >
          <option
            value={
              SITUACOES_RECEBIMENTO.TODOS
            }
          >
            {somenteRequisicoes
              ? "Situação não se aplica"
              : "Todas as situações"}
          </option>

          {!somenteRequisicoes && (
            <>
              <option
                value={
                  SITUACOES_RECEBIMENTO.EM_ABERTO
                }
              >
                Em aberto
              </option>

              <option
                value={
                  SITUACOES_RECEBIMENTO.EM_ATRASO
                }
              >
                Em atraso
              </option>

              <option
                value={
                  SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE
                }
              >
                Recebido parcialmente
              </option>

              <option
                value={
                  SITUACOES_RECEBIMENTO.RECEBIDO
                }
              >
                Recebido
              </option>
            </>
          )}
        </select>
      </div>

      <div className="compras-filtros-linha-periodo">
        <div className="compras-filtro-data">
          <label
            htmlFor="compras-data-inicio"
          >
            De
          </label>

          <input
            id="compras-data-inicio"
            type="date"
            value={
              filtros.dataInicio
            }
            max={
              filtros.dataFim ||
              undefined
            }
            onChange={(
              event,
            ) =>
              onChange(
                "dataInicio",
                event.target.value,
              )
            }
          />
        </div>

        <div className="compras-filtro-data">
          <label
            htmlFor="compras-data-fim"
          >
            Até
          </label>

          <input
            id="compras-data-fim"
            type="date"
            value={
              filtros.dataFim
            }
            min={
              filtros.dataInicio ||
              undefined
            }
            onChange={(
              event,
            ) =>
              onChange(
                "dataFim",
                event.target.value,
              )
            }
          />
        </div>

        <div className="compras-periodo-info">
          {filtros.dataInicio ||
          filtros.dataFim
            ? "Período aplicado."
            : "Sem período definido — exibindo todo o histórico disponível."}
        </div>

        <button
          type="button"
          className={`compras-btn-limpar${
            possuiFiltro
              ? " compras-btn-limpar--ativo"
              : ""
          }`}
          onClick={
            possuiFiltro
              ? onLimpar
              : undefined
          }
          disabled={
            !possuiFiltro
          }
        >
          <RotateCcw
            size={16}
          />

          Limpar filtros
        </button>
      </div>
    </section>
  );
}