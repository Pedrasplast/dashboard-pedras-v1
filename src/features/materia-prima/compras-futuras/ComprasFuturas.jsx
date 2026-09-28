import { useMemo } from "react";
import { Plus } from "lucide-react";

import CompraFuturaModal from "./CompraFuturaModal";
import ConfirmarChegadaModal from "./ConfirmarChegadaModal";
import useComprasFuturas from "./useComprasFuturas";

import useFiltrosComprasFuturas from "./hooks/useFiltrosComprasFuturas";
import useAcoesComprasFuturas from "./hooks/useAcoesComprasFuturas";
import { calcularIndicadores } from "./utils/comprasFuturasUtils";

import ComprasFuturasIndicadores from "./components/ComprasFuturasIndicadores";
import ComprasFuturasFiltros from "./components/ComprasFuturasFiltros";
import ComprasFuturasTabela from "./components/ComprasFuturasTabela";
import ExclusaoCompraFutura from "./components/ExclusaoCompraFutura";
import {
  EstadoCarregando,
  EstadoErro,
  EstadoSemCompras,
  EstadoSemResultado,
} from "./components/ComprasFuturasEstado";

import "./ComprasFuturas.css";


export default function ComprasFuturas({
  isAdmin = false,
}) {
  const dados = useComprasFuturas();

  const {
    compras,
    fornecedores,
    materiais,
    fornecedorMateriais,
    carregando,
    carregado,
    erro,
    salvando,
    excluindo,
    confirmandoChegada,
    compraEstaSalvando,
    compraEstaExcluindo,
    compraEstaConfirmandoChegada,
  } = dados;


  const {
    filtros,
    alterarFiltro,
    opcoes,
    filtradas,
  } = useFiltrosComprasFuturas(
    compras,
  );


  const {
    ocupado,
    modal,
    chegada,
    exclusao,
  } = useAcoesComprasFuturas(
    dados,
  );


  const indicadores = useMemo(
    () =>
      calcularIndicadores(
        filtradas,
      ),
    [
      filtradas,
    ],
  );


  function obterProcessando(id) {
    return {
      salvando:
        compraEstaSalvando(
          id,
        ),

      excluindo:
        compraEstaExcluindo(
          id,
        ),

      confirmandoChegada:
        compraEstaConfirmandoChegada(
          id,
        ),
    };
  }


  const podeExibir =
    !carregando &&
    !erro;


  const semCompras =
    podeExibir &&
    carregado &&
    compras.length === 0;


  const semResultado =
    podeExibir &&
    compras.length > 0 &&
    filtradas.length === 0;


  const exibirTabela =
    podeExibir &&
    filtradas.length > 0;


  return (
    <>
      <div className="compras-futuras">

        <div className="compras-futuras-toolbar">

          <button
            type="button"
            className="compras-futuras-nova"
            onClick={
              modal.novo
            }
            disabled={
              ocupado
            }
          >
            <Plus
              size={17}
            />

            Nova compra
          </button>

        </div>


        <div className="compras-futuras-resumo-filtros">

          <ComprasFuturasIndicadores
            indicadores={
              indicadores
            }
          />


          <ComprasFuturasFiltros
            filtros={
              filtros
            }
            opcoes={
              opcoes
            }
            onChange={
              alterarFiltro
            }
          />

        </div>


        {carregando && (
          <EstadoCarregando />
        )}


        {!carregando &&
          erro && (
            <EstadoErro
              mensagem={
                erro
              }
            />
          )}


        {semCompras && (
          <EstadoSemCompras />
        )}


        {exibirTabela && (
          <ComprasFuturasTabela
            compras={
              filtradas
            }
            bloqueado={
              ocupado
            }
            obterProcessando={
              obterProcessando
            }
            onConfirmarChegada={
              chegada.solicitar
            }
            onEditar={
              modal.editar
            }
            onExcluir={
              exclusao.solicitar
            }
            isAdmin={
              isAdmin
            }
          />
        )}


        {semResultado && (
          <EstadoSemResultado />
        )}

      </div>


      <CompraFuturaModal
        aberto={
          modal.aberto
        }
        item={
          modal.item
        }
        fornecedores={
          fornecedores
        }
        materiais={
          materiais
        }
        fornecedorMateriais={
          fornecedorMateriais
        }
        salvando={
          salvando
        }
        onCancelar={
          modal.fechar
        }
        onSalvar={
          modal.salvar
        }
      />


      <ConfirmarChegadaModal
        aberto={
          Boolean(
            chegada.item,
          )
        }
        item={
          chegada.item
        }
        processando={
          confirmandoChegada
        }
        onCancelar={
          chegada.cancelar
        }
        onConfirmar={
          chegada.confirmar
        }
      />


      <ExclusaoCompraFutura
        compra={
          exclusao.item
        }
        erro={
          exclusao.erro
        }
        processando={
          excluindo
        }
        onCancelar={
          exclusao.cancelar
        }
        onConfirmar={
          exclusao.confirmar
        }
      />

    </>
  );
}