import { useMemo } from "react";
import { PackageCheck } from "lucide-react";

import Paginacao from "@/components/paginacao/Paginacao";
import EstadoTela from "@/shared/ui/EstadoTela";

import useEntradas from "./useEntradas";
import useFiltrosEntradas from "./hooks/useFiltrosEntradas";
import usePaginacao from "./hooks/usePaginacao";
import { calcularIndicadores } from "./utils/entradasUtils";

import EntradasIndicadores from "./components/EntradasIndicadores";
import EntradasFiltros from "./components/EntradasFiltros";
import EntradasPeriodo from "./components/EntradasPeriodo";
import EntradasTabela from "./components/EntradasTabela";

import "./Entradas.css";

const ITENS_POR_PAGINA = 8;

export default function Entradas() {
  const { entradas, carregando, carregado, erro } = useEntradas();

  const {
    filtros,
    alterarFiltro,
    limparFiltros,
    possuiFiltroAtivo,
    opcoes,
    descricaoPeriodo,
    filtradas,
  } = useFiltrosEntradas(entradas);

  const { paginaAtual, setPaginaAtual, totalItens, totalPaginas, itensDaPagina } = usePaginacao(
    filtradas,
    ITENS_POR_PAGINA,
    filtros,
  );

  const indicadores = useMemo(() => calcularIndicadores(filtradas), [filtradas]);

  const podeExibir = !carregando && !erro;
  const semEntradas = podeExibir && carregado && entradas.length === 0;
  const semResultado = podeExibir && entradas.length > 0 && filtradas.length === 0;
  const exibirTabela = podeExibir && filtradas.length > 0;

  return (
    <div className="entradas-pp">
      <div className="entradas-pp-toolbar">
        <EntradasIndicadores indicadores={indicadores} />
        <EntradasFiltros filtros={filtros} opcoes={opcoes} onChange={alterarFiltro} />
      </div>

      <EntradasPeriodo
        filtros={filtros}
        descricao={descricaoPeriodo}
        onChange={alterarFiltro}
        onLimpar={limparFiltros}
        possuiFiltroAtivo={possuiFiltroAtivo}
      />

      {carregando && <EstadoTela tipo="carregando" titulo="Carregando recebimentos" />}

      {!carregando && erro && (
        <EstadoTela tipo="erro" titulo="Erro ao carregar entradas" texto={erro} />
      )}

      {semEntradas && (
        <EstadoTela
          icone={<PackageCheck size={34} />}
          titulo="Nenhum material recebido"
          texto="Quando uma compra for alterada para Recebida, ela aparecerá automaticamente aqui."
        />
      )}

      {semResultado && (
        <EstadoTela
          icone={<PackageCheck size={34} />}
          titulo="Nenhum recebimento encontrado"
          texto="Não há entradas para os filtros selecionados."
        />
      )}

      {exibirTabela && (
        <>
          <EntradasTabela entradas={itensDaPagina} />

          {totalPaginas > 1 && (
            <Paginacao
              paginaAtual={paginaAtual}
              totalItens={totalItens}
              itensPorPagina={ITENS_POR_PAGINA}
              onChangePagina={setPaginaAtual}
            />
          )}
        </>
      )}
    </div>
  );
}
