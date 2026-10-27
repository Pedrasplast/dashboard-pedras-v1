import { useMemo, useState } from "react";
import { AlertTriangle, Calculator } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useNecessidadeMateriaPrima } from "./hooks/useNecessidadeMateriaPrima";
import { consolidarNecessidade } from "./utils/calculosNecessidade";
import {
  filtrarPedidosPorPrevisao,
  agruparProducaoPorMaterial,
  resumirConsumoDaProducao,
} from "./utils/seletoresNecessidade";
import { aplicarEstruturaOmie } from "./utils/estruturaOmie";
import AlertaPendencias from "./components/AlertaPendencias";
import AbasMateriais from "./components/AbasMateriais";
import ProdutosDoMaterial from "./components/ProdutosDoMaterial";
import FiltroPeriodoNecessidade from "./components/FiltroPeriodoNecessidade";
import ResumoMaterialNecessidade from "./components/ResumoMaterialNecessidade";
import { paraNumero } from "@/shared/lib/numeros";
import "./NecessidadeMateriaPrima.css";

export default function NecessidadeMateriaPrimaPage() {
  const [materialSelecionado, setMaterialSelecionado] = useState(null);

  const [ajustes, setAjustes] = useState({});
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data, isLoading, isFetching, isError, error } = useNecessidadeMateriaPrima();

  /* ========================================================
     AJUSTES EDITÁVEIS

     Apenas percentual de compra e teto.
  ======================================================== */

  function alterarAjuste(id, campo, valor) {
    if (campo !== "percentual" && campo !== "teto") {
      return;
    }

    const convertido = Math.max(0, paraNumero(valor));

    const valorFinal = campo === "percentual" ? Math.min(100, convertido) : convertido;

    setAjustes((anterior) => ({
      ...anterior,

      [String(id)]: {
        ...anterior[String(id)],
        [campo]: valorFinal,
      },
    }));
  }

  /* ========================================================
     DADOS CONSOLIDADOS
  ======================================================== */

  const periodoInvalido = Boolean(dataInicio && dataFim && dataInicio > dataFim);
  const periodoAtivo = Boolean(dataInicio || dataFim);

  const pedidosAbertos = useMemo(() => {
    const pedidos = data?.pedidosAbertos ?? [];
    if (periodoInvalido) return [];
    return filtrarPedidosPorPrevisao(pedidos, dataInicio, dataFim);
  }, [data?.pedidosAbertos, dataInicio, dataFim, periodoInvalido]);

  /* KG/UN e matéria-prima da estrutura do Omie; o que faltar vira pendência
     e o produto fica fora do consumo (23/10). */
  const estruturaAplicada = useMemo(
    () =>
      aplicarEstruturaOmie(pedidosAbertos, {
        estrutura: data?.estrutura,
        vinculos: data?.vinculosHistoricos ?? [],
        materiais: data?.materiais ?? [],
        estoqueProdutos: data?.estoqueProdutos ?? [],
        decisoes: data?.decisoesPeso ?? [],
      }),
    [
      pedidosAbertos,
      data?.estrutura,
      data?.vinculosHistoricos,
      data?.materiais,
      data?.estoqueProdutos,
      data?.decisoesPeso,
    ],
  );

  // Sempre derivar o consumo da produção necessária, inclusive sem filtro.
  const produtosPorMaterial = useMemo(
    () => agruparProducaoPorMaterial(estruturaAplicada.pedidos, data?.estoqueProdutos ?? []),
    [estruturaAplicada.pedidos, data?.estoqueProdutos],
  );

  const consumosProducao = useMemo(
    () => resumirConsumoDaProducao(produtosPorMaterial),
    [produtosPorMaterial],
  );

  const dadosDoPeriodo = useMemo(
    () => (data ? { ...data, consumos: consumosProducao } : null),
    [data, consumosProducao],
  );

  const materiais = useMemo(
    () => consolidarNecessidade(dadosDoPeriodo, ajustes),
    [dadosDoPeriodo, ajustes],
  );

  const materialAtual =
    materiais.find((material) => String(material.id) === String(materialSelecionado)) ??
    materiais[0] ??
    null;

  const produtosDoMaterial = materialAtual
    ? (produtosPorMaterial.get(String(materialAtual.id)) ?? [])
    : [];

  const codigosSemVinculo = data?.pendenciasCodigos ?? [];

  const materiaisSemEstoque = data?.materiaisSemEstoque ?? [];

  const semEstoqueGlobal = Boolean(data) && (data.estoques ?? []).length === 0;

  const necessitaValidacao =
    Boolean(data) &&
    (estruturaAplicada.pendencias.length > 0 ||
      codigosSemVinculo.length > 0 ||
      materiaisSemEstoque.length > 0 ||
      !data.validacao?.calculoHomologado);

  /* ========================================================
     INTERFACE
  ======================================================== */

  return (
    <main className="necessidade-page">
      <div className="necessidade-container">
        <PageHeader
          eyebrow="Compras"
          title="Necessidade de Matéria-Prima"
          description="Planejamento da produção para atender pedidos e recompor o estoque mínimo dos produtos, com dados do Omie."
          icon={Calculator}
        />

        {isLoading ? (
          <div className="necessidade-estado">Carregando dados de matéria-prima...</div>
        ) : isError ? (
          <div className="necessidade-erro" role="alert">
            Não foi possível consultar os dados: {error?.message || "Erro desconhecido."}
          </div>
        ) : (
          <>
            <FiltroPeriodoNecessidade
              dataInicio={dataInicio}
              dataFim={dataFim}
              setDataInicio={setDataInicio}
              setDataFim={setDataFim}
              periodoAtivo={periodoAtivo}
              periodoInvalido={periodoInvalido}
              pedidosAbertos={pedidosAbertos}
            />
            {/* PENDÊNCIAS DOS PRODUTOS */}

            <AlertaPendencias
              pendencias={estruturaAplicada.pendencias}
              pesosAceitos={estruturaAplicada.pesosAceitos}
            />

            {/* CÓDIGOS OMIE PENDENTES */}

            {codigosSemVinculo.length > 0 && (
              <div className="necessidade-alerta" role="alert">
                <AlertTriangle size={18} aria-hidden="true" />

                <div>
                  <strong>Matérias-primas com pendências de código Omie</strong>

                  <ul>
                    {codigosSemVinculo.map((item) => (
                      <li key={`${item.material_id}-${item.motivo}`}>
                        {item.material} — {item.codigo_omie || "Sem código"}
                        {" — "}
                        {item.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ALERTAS DE ESTOQUE */}

            {semEstoqueGlobal && (
              <div className="necessidade-alerta" role="alert">
                <AlertTriangle size={18} aria-hidden="true" />
                Nenhum estoque de matéria-prima foi encontrado na integração Omie.
              </div>
            )}

            {materiaisSemEstoque.length > 0 && (
              <div className="necessidade-alerta" role="alert">
                <AlertTriangle size={18} aria-hidden="true" />

                <div>
                  <strong>Estoques ainda não encontrados no Omie</strong>

                  <ul>
                    {materiaisSemEstoque.map((item) => (
                      <li key={item.material_id}>
                        {item.material} — {item.codigo_omie || "Sem código"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ABAS DAS MATÉRIAS-PRIMAS */}

            {materiais.length > 0 ? (
              <>
                <AbasMateriais
                  materiais={materiais}
                  selecionado={materialAtual?.id}
                  onSelecionar={setMaterialSelecionado}
                />

                {materialAtual && (
                  <section
                    id="necessidade-painel-material"
                    role="tabpanel"
                    aria-labelledby={`necessidade-aba-${materialAtual.id}`}
                  >
                    {/* RESUMO PRINCIPAL */}

                    <ResumoMaterialNecessidade
                      materialAtual={materialAtual}
                      alterarAjuste={alterarAjuste}
                    />

                    {/* PRODUTOS PAGINADOS */}

                    <ProdutosDoMaterial
                      key={materialAtual.id}
                      material={materialAtual}
                      produtos={produtosDoMaterial}
                    />
                  </section>
                )}
              </>
            ) : (
              <div className="necessidade-estado">Nenhuma matéria-prima habilitada.</div>
            )}

            {/* AVISO DE VALIDAÇÃO */}

            {necessitaValidacao && (
              <p className="necessidade-observacao necessidade-observacao-final" role="status">
                Os valores apresentados são preliminares e não representam uma recomendação de
                compra homologada. Confira os cadastros, pedidos e estoques antes de comprar.
              </p>
            )}

            {isFetching && (
              <span className="necessidade-atualizando" role="status">
                Atualizando dados automaticamente...
              </span>
            )}
          </>
        )}
      </div>
    </main>
  );
}
