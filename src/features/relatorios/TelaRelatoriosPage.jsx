import React, { useEffect, useMemo, useState } from "react";

import { FiArrowLeft, FiChevronRight, FiDownload, FiEye, FiFileText, FiX } from "react-icons/fi";

import {
  useCargaMaquina,
  useDescricoesProdutos,
  normalizarCodigoProduto,
} from "@/lib/cargaMaquina";

import { usePedidosSupabase } from "@/features/pedidos/usePedidosSupabase";
import { valoresUnicos } from "@/lib/colecoes";
import { normalizarTexto } from "@/lib/texto";
import { supabase } from "@/lib/supabaseClient";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";
import PageHeader from "@/components/layout/PageHeader";

import { RELATORIOS } from "./config/Relatorio.config";

import { obterDataDoRegistro } from "./utils/Data";

import {
  COLUNAS_NUMERICAS,
  TITULOS_COLUNAS_VISUALIZACAO,
  criarTituloAutomatico,
  obterValorVisualizacao,
} from "./utils/Visualizacao";

import { obterDataPedidoRelatorio } from "./pedidos/PedidosRelatorios";

import FiltrosPedidosRelatorio from "./pedidos/FiltrosPedidosRelatorio";

import "./TelaRelatorios.css";

/* =========================================================
   FILTROS INICIAIS
========================================================= */

const criarFiltrosIniciais = (fonteDados = "producao") => ({
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

/* =========================================================
   CONTAGEM DE REGISTROS

   Para Pedidos em Aberto:
   - a tabela continua mostrando todos os itens;
   - o contador considera pedidos únicos.
========================================================= */

function contarRegistrosRelatorio(relatorio, dados = []) {
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

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState(null);

  const [filtros, setFiltros] = useState(() => criarFiltrosIniciais());

  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);

  const [permissoesRelatoriosCarregadas, setPermissoesRelatoriosCarregadas] =
    useState(false);

  const [relatoriosPermitidosIds, setRelatoriosPermitidosIds] = useState(
    () => new Set(),
  );

  const [erroPermissoesRelatorios, setErroPermissoesRelatorios] = useState("");

  /* =====================================================
     CARREGAR PERMISSÕES DOS RELATÓRIOS

     ADMIN:
     - acesso a todos os relatórios configurados.

     OPERADOR:
     - acesso somente aos relatórios liberados em
       usuario_relatorio_permissoes.
  ===================================================== */

  useEffect(() => {
    let ativo = true;

    async function carregarPermissoesRelatorios() {
      try {
        if (ativo) {
          setPermissoesRelatoriosCarregadas(false);
          setErroPermissoesRelatorios("");
        }

        const { data: dadosUsuario, error: erroUsuario } =
          await supabase.auth.getUser();

        if (erroUsuario) {
          throw erroUsuario;
        }

        const usuario = dadosUsuario?.user;

        if (!usuario?.id) {
          if (ativo) {
            setRelatoriosPermitidosIds(new Set());
          }

          return;
        }

        const { data: perfil, error: erroPerfil } = await supabase
          .from("perfis")
          .select("regra")
          .eq("id", usuario.id)
          .maybeSingle();

        if (erroPerfil) {
          throw erroPerfil;
        }

        if (perfil?.regra === "admin") {
          if (ativo) {
            setRelatoriosPermitidosIds(
              new Set(RELATORIOS.map((relatorio) => relatorio.id)),
            );
          }

          return;
        }

        const [respostaRelatorios, respostaPermissoes] = await Promise.all([
          supabase
            .from("relatorios_sistema")
            .select("id, chave, ativo")
            .eq("ativo", true),

          supabase
            .from("usuario_relatorio_permissoes")
            .select("relatorio_id, permitido")
            .eq("usuario_id", usuario.id)
            .eq("permitido", true),
        ]);

        if (respostaRelatorios.error) {
          throw respostaRelatorios.error;
        }

        if (respostaPermissoes.error) {
          throw respostaPermissoes.error;
        }

        const idsPermitidos = new Set(
          (respostaPermissoes.data || []).map((permissao) =>
            String(permissao.relatorio_id),
          ),
        );

        const chavesPermitidas = new Set(
          (respostaRelatorios.data || [])
            .filter((relatorio) => idsPermitidos.has(String(relatorio.id)))
            .map((relatorio) => String(relatorio.chave || "").trim())
            .filter(Boolean),
        );

        if (ativo) {
          setRelatoriosPermitidosIds(
            new Set(
              RELATORIOS.filter((relatorio) =>
                chavesPermitidas.has(relatorio.id),
              ).map((relatorio) => relatorio.id),
            ),
          );
        }
      } catch (error) {
        console.error("Erro ao carregar permissões dos relatórios:", error);

        if (ativo) {
          setRelatoriosPermitidosIds(new Set());

          setErroPermissoesRelatorios(
            error?.message ||
              "Não foi possível verificar as permissões dos relatórios.",
          );
        }
      } finally {
        if (ativo) {
          setPermissoesRelatoriosCarregadas(true);
        }
      }
    }

    carregarPermissoesRelatorios();

    return () => {
      ativo = false;
    };
  }, []);

  /* =====================================================
     RELATÓRIOS DISPONÍVEIS AO USUÁRIO
  ===================================================== */

  const relatoriosDisponiveis = useMemo(
    () =>
      RELATORIOS.filter((relatorio) =>
        relatoriosPermitidosIds.has(relatorio.id),
      ),
    [relatoriosPermitidosIds],
  );

  const relatoriosPorCategoria = useMemo(() => {
    const mapa = new Map();

    for (const relatorio of relatoriosDisponiveis) {
      if (!mapa.has(relatorio.categoria)) {
        mapa.set(relatorio.categoria, []);
      }

      mapa.get(relatorio.categoria).push(relatorio);
    }

    return mapa;
  }, [relatoriosDisponiveis]);

  const categorias = useMemo(
    () => [...relatoriosPorCategoria.keys()],
    [relatoriosPorCategoria],
  );

  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado = useMemo(
    () =>
      relatoriosDisponiveis.find(
        (relatorio) => relatorio.id === relatorioSelecionadoId,
      ) || null,

    [relatorioSelecionadoId, relatoriosDisponiveis],
  );

  const fonteEhPedidos = relatorioSelecionado?.fonteDados === "pedidos";

  const relatorioEhCustom =
    relatorioSelecionado?.tipoRelatorio === "custom" ||
    relatorioSelecionado?.fonteDados === "custom";

  const ComponenteCustomizado = relatorioEhCustom
    ? relatorioSelecionado?.componenteCustomizado
    : null;

  /* =====================================================
     GARANTIR QUE UM RELATÓRIO SEM PERMISSÃO NÃO CONTINUE
     ABERTO CASO A PERMISSÃO SEJA REMOVIDA.
  ===================================================== */

  useEffect(() => {
    if (
      !permissoesRelatoriosCarregadas ||
      !relatorioSelecionadoId
    ) {
      return;
    }

    if (!relatoriosPermitidosIds.has(relatorioSelecionadoId)) {
      setRelatorioSelecionadoId(null);
      setFiltros(criarFiltrosIniciais());
      setVisualizacaoAberta(false);
    }
  }, [
    permissoesRelatoriosCarregadas,
    relatorioSelecionadoId,
    relatoriosPermitidosIds,
  ]);

  /* =====================================================
     PRODUÇÃO
  ===================================================== */

  const temDadosExternos = Array.isArray(dadosExternos) && dadosExternos.length > 0;

  const {
    dados: dadosProducao,

    loading: carregandoProducao,
  } = useCargaMaquina({
    enabled:
      Boolean(relatorioSelecionado) && !temDadosExternos && !fonteEhPedidos && !relatorioEhCustom,
  });

  const dadosProducaoBrutos = temDadosExternos ? dadosExternos : dadosProducao;

  /* =====================================================
     PEDIDOS

     A consulta é compartilhada com a tela de Pedidos por
     meio da mesma chave do React Query. Isso evita uma nova
     leitura desnecessária ao navegar entre as telas.
  ===================================================== */

  const {
    pedidos: pedidosBrutos,
    error: erroPedidos,
    isLoading: carregandoPedidos,
  } = usePedidosSupabase({
    enabled: fonteEhPedidos,
    staleTime: 30 * 1000,
  });

  /* =====================================================
     FONTE ATUAL
  ===================================================== */

  const dadosBrutos = relatorioEhCustom
    ? []
    : fonteEhPedidos
      ? pedidosBrutos
      : Array.isArray(dadosProducaoBrutos)
        ? dadosProducaoBrutos
        : [];

  const loading = relatorioEhCustom
    ? false
    : fonteEhPedidos
      ? carregandoPedidos
      : relatorioSelecionado
        ? carregandoProducao
        : false;

  /* =====================================================
     DESCRIÇÕES PRODUTOS DA PRODUÇÃO
  ===================================================== */

  const { descricoesProdutos } = useDescricoesProdutos({
    enabled: !relatorioEhCustom && relatorioSelecionadoId === "producao-produto",
  });

  /* =====================================================
     COLUNAS
  ===================================================== */

  const colunasVisualizacao = useMemo(() => {
    if (
      relatorioEhCustom ||
      !relatorioSelecionado ||
      !Array.isArray(relatorioSelecionado.colunas)
    ) {
      return [];
    }

    const chaves = [...relatorioSelecionado.colunas];

    /* Produção por produto */

    if (relatorioSelecionado.id === "producao-produto") {
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
  }, [relatorioEhCustom, relatorioSelecionado]);

  /* =====================================================
     PRODUTOS DA PRODUÇÃO
  ===================================================== */

  const produtosDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom) {
      return [];
    }

    let lista = Array.isArray(dadosBrutos) ? dadosBrutos : [];

    if (filtros.injetora && filtros.injetora !== "Todos") {
      lista = lista.filter(
        (item) => String(item.injetora || "").trim() === String(filtros.injetora).trim(),
      );
    }

    return valoresUnicos(lista.map((item) => item.cod_prod || item.produto));
  }, [dadosBrutos, filtros.injetora, fonteEhPedidos, relatorioEhCustom]);

  /* =====================================================
     MATÉRIAS-PRIMAS
  ===================================================== */

  const mpsDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom || !Array.isArray(dadosBrutos)) {
      return [];
    }

    return valoresUnicos(dadosBrutos.map((item) => item.mp || item.materia_prima));
  }, [dadosBrutos, fonteEhPedidos, relatorioEhCustom]);

  /* =====================================================
     TIPOS
  ===================================================== */

  const tiposDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom || !Array.isArray(dadosBrutos)) {
      return [];
    }

    return [
      ...new Set(
        dadosBrutos
          .map((item) => String(item.tipo ?? "").trim())
          .filter((tipo) => ["1", "2", "3"].includes(tipo)),
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [dadosBrutos, fonteEhPedidos, relatorioEhCustom]);

  /* =====================================================
     FILTRAGEM
  ===================================================== */

  const dadosFiltrados = useMemo(() => {
    if (relatorioEhCustom || !Array.isArray(dadosBrutos) || !relatorioSelecionado) {
      return [];
    }

    /* =================================================
       PEDIDOS
    ================================================= */

    if (fonteEhPedidos) {
      return dadosBrutos.filter((item) => {
        /* FILTRO FIXO */

        if (relatorioSelecionado.filtroFixo && !relatorioSelecionado.filtroFixo(item)) {
          return false;
        }

        /* STATUS */

        if (relatorioSelecionado.filtros.status && filtros.status && filtros.status !== "todos") {
          if (normalizarTexto(item.status) !== normalizarTexto(filtros.status)) {
            return false;
          }
        }

        /* PERÍODO */

        if (relatorioSelecionado.filtros.periodo) {
          const dataRegistro = obterDataPedidoRelatorio(item);

          if ((filtros.dataInicio || filtros.dataFim) && !dataRegistro) {
            return false;
          }

          if (filtros.dataInicio && dataRegistro < filtros.dataInicio) {
            return false;
          }

          if (filtros.dataFim && dataRegistro > filtros.dataFim) {
            return false;
          }
        }

        /* CLIENTE */

        if (
          relatorioSelecionado.filtros.cliente &&
          filtros.cliente &&
          filtros.cliente !== "todos"
        ) {
          if (String(item.cliente || "").trim() !== String(filtros.cliente).trim()) {
            return false;
          }
        }

        /* VENDEDOR */

        if (
          relatorioSelecionado.filtros.vendedor &&
          filtros.vendedor &&
          filtros.vendedor !== "todos"
        ) {
          if (String(item.vendedor || "").trim() !== String(filtros.vendedor).trim()) {
            return false;
          }
        }

        /* PRODUTO */

        if (
          relatorioSelecionado.filtros.produto &&
          filtros.cod_prod &&
          filtros.cod_prod !== "Todos"
        ) {
          const codigo = String(
            item.codigoProduto ?? item.codigo_produto ?? item.codigo ?? "",
          ).trim();

          if (codigo !== String(filtros.cod_prod).trim()) {
            return false;
          }
        }

        return true;
      });
    }

    /* =================================================
       PRODUÇÃO E PARADAS
    ================================================= */

    return dadosBrutos.filter((item) => {
      /* FILTRO FIXO */

      if (relatorioSelecionado.filtroFixo && !relatorioSelecionado.filtroFixo(item)) {
        return false;
      }

      /* PERÍODO */

      if (relatorioSelecionado.filtros.periodo) {
        const dataRegistro = obterDataDoRegistro(item);

        if ((filtros.dataInicio || filtros.dataFim) && !dataRegistro) {
          return false;
        }

        if (filtros.dataInicio && dataRegistro < filtros.dataInicio) {
          return false;
        }

        if (filtros.dataFim && dataRegistro > filtros.dataFim) {
          return false;
        }
      }

      /* INJETORA */

      if (
        relatorioSelecionado.filtros.injetora &&
        filtros.injetora &&
        filtros.injetora !== "Todos"
      ) {
        if (String(item.injetora || "").trim() !== String(filtros.injetora).trim()) {
          return false;
        }
      }

      /* PRODUTO */

      if (
        relatorioSelecionado.filtros.produto &&
        filtros.cod_prod &&
        filtros.cod_prod !== "Todos"
      ) {
        const produto = String(item.cod_prod || item.produto || "").trim();

        if (produto !== String(filtros.cod_prod).trim()) {
          return false;
        }
      }

      /* MP */

      if (relatorioSelecionado.filtros.mp && filtros.mp && filtros.mp !== "Todos") {
        const mp = String(item.mp || item.materia_prima || "").trim();

        if (mp !== String(filtros.mp).trim()) {
          return false;
        }
      }

      /* TIPO */

      if (
        relatorioSelecionado.filtros.tipo &&
        Array.isArray(filtros.tipo) &&
        filtros.tipo.length > 0
      ) {
        const tipo = String(item.tipo || "").trim();

        const selecionados = filtros.tipo.map((valor) => String(valor).trim());

        if (!selecionados.includes(tipo)) {
          return false;
        }
      }

      return true;
    });
  }, [dadosBrutos, filtros, fonteEhPedidos, relatorioEhCustom, relatorioSelecionado]);

  /* =====================================================
     TRANSFORMAR DADOS
  ===================================================== */

  const dadosRelatorio = useMemo(() => {
    if (!relatorioSelecionado || relatorioEhCustom) {
      return [];
    }

    if (typeof relatorioSelecionado.transformarDados === "function") {
      return relatorioSelecionado.transformarDados(dadosFiltrados);
    }

    return dadosFiltrados;
  }, [dadosFiltrados, relatorioEhCustom, relatorioSelecionado]);

  /* =====================================================
     DESCRIÇÃO DO PRODUTO
  ===================================================== */

  const dadosRelatorioFinal = useMemo(() => {
    if (relatorioEhCustom) {
      return [];
    }

    if (relatorioSelecionado?.id !== "producao-produto") {
      return dadosRelatorio;
    }

    return dadosRelatorio.map((item) => {
      const codigo = normalizarCodigoProduto(item.produto || item.cod_prod || "");

      let descricao = "-";

      if (descricoesProdutos instanceof Map) {
        descricao = descricoesProdutos.get(codigo) || "-";
      } else if (descricoesProdutos && typeof descricoesProdutos === "object") {
        descricao = descricoesProdutos[codigo] || "-";
      }

      return {
        ...item,

        descricao_produto: descricao,
      };
    });
  }, [dadosRelatorio, descricoesProdutos, relatorioEhCustom, relatorioSelecionado]);

  /* =====================================================
     TOTAL DE REGISTROS

     Pedidos em Aberto:
     conta pedidos únicos.

     Demais relatórios:
     mantém a quantidade de linhas.
  ===================================================== */

  const totalRegistrosRelatorio = useMemo(
    () => contarRegistrosRelatorio(relatorioSelecionado, dadosRelatorioFinal),
    [relatorioSelecionado, dadosRelatorioFinal],
  );

  /* =====================================================
     SELECIONAR RELATÓRIO
  ===================================================== */

  const selecionarRelatorio = (id) => {
    const relatorio = relatoriosDisponiveis.find((item) => item.id === id);

    if (!relatorio) {
      return;
    }

    setRelatorioSelecionadoId(id);

    setFiltros(criarFiltrosIniciais(relatorio?.fonteDados || "producao"));

    setVisualizacaoAberta(false);
  };

  /* =====================================================
     VOLTAR
  ===================================================== */

  const voltarListaRelatorios = () => {
    setRelatorioSelecionadoId(null);

    setFiltros(criarFiltrosIniciais());

    setVisualizacaoAberta(false);
  };

  /* =====================================================
     TEXTO DOS FILTROS
  ===================================================== */

  const montarTextoFiltros = () => {
    if (relatorioEhCustom) {
      return "Filtros internos do relatório";
    }

    const lista = [];

    /* PEDIDOS */

    if (fonteEhPedidos) {
      if (filtros.cliente && filtros.cliente !== "todos") {
        lista.push(`Cliente: ${filtros.cliente}`);
      }

      if (filtros.vendedor && filtros.vendedor !== "todos") {
        lista.push(`Vendedor: ${filtros.vendedor}`);
      }

      if (filtros.cod_prod && filtros.cod_prod !== "Todos") {
        lista.push(`Produto: ${filtros.cod_prod}`);
      }

      if (relatorioSelecionado?.filtros?.status && filtros.status && filtros.status !== "todos") {
        lista.push(`Status: ${filtros.status}`);
      }
    } else {
      /* PRODUÇÃO */

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

    /* DATA INICIAL */

    if (filtros.dataInicio) {
      lista.push(`De: ${filtros.dataInicio.split("-").reverse().join("/")}`);
    }

    /* DATA FINAL */

    if (filtros.dataFim) {
      lista.push(`Até: ${filtros.dataFim.split("-").reverse().join("/")}`);
    }

    return lista.length > 0
      ? lista.join(" | ")
      : fonteEhPedidos
        ? "Status Pedido"
        : "Sem filtros adicionais";
  };

  /* =====================================================
     PDF
  ===================================================== */

  const handleGerarPDF = async () => {
    if (relatorioEhCustom) {
      return;
    }

    const { gerarPdfRelatorio } = await import("./exportacao/GerarPDF");

    gerarPdfRelatorio({
      relatorio: relatorioSelecionado,

      dados: dadosRelatorioFinal,

      textoFiltros: montarTextoFiltros(),
    });
  };

  /* =====================================================
     EXCEL
  ===================================================== */

  const handleGerarExcel = async () => {
    if (relatorioEhCustom) {
      return;
    }

    const { gerarExcelRelatorio } = await import("./exportacao/GerarExcel");

    await gerarExcelRelatorio({
      relatorio: relatorioSelecionado,

      dados: dadosRelatorioFinal,

      textoFiltros: montarTextoFiltros(),
    });
  };

  /* =====================================================
     CARREGANDO PERMISSÕES
  ===================================================== */

  if (!permissoesRelatoriosCarregadas) {
    return (
      <div className="relatorios-loading">
        <div className="relatorios-loading-card">
          <div className="relatorios-spinner" />

          <p>Verificando permissões dos relatórios...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     CARREGANDO DADOS
  ===================================================== */

  if (loading && relatorioSelecionado) {
    return (
      <div className="relatorios-loading">
        <div className="relatorios-loading-card">
          <div className="relatorios-spinner" />

          <p>Carregando dados do relatório...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relatorios-container">
      {/* =================================================
          VOLTAR
      ================================================= */}

      {relatorioSelecionado && (
        <div className="relatorios-navegacao-topo">
          <button type="button" className="btn-voltar-topo" onClick={voltarListaRelatorios}>
            <FiArrowLeft />

            <span>Painel de Relatórios</span>
          </button>
        </div>
      )}

      {/* =================================================
          CABEÇALHO
          APARECE SOMENTE NO MENU DE RELATÓRIOS
      ================================================= */}

      {!relatorioSelecionado && (
        <PageHeader
          eyebrow="Central de Relatórios"
          title="Relatórios"
          description="Consulte produção, paradas, pedidos e financeiro utilizando dados já sincronizados no sistema."
          icon={FiFileText}
          className="relatorios-header"
        />
      )}

      {/* =================================================
          ERRO DE PERMISSÕES
      ================================================= */}

      {!relatorioSelecionado && erroPermissoesRelatorios && (
        <div className="relatorios-erro">{erroPermissoesRelatorios}</div>
      )}

      {/* =================================================
          SEM RELATÓRIOS LIBERADOS
      ================================================= */}

      {!relatorioSelecionado &&
        !erroPermissoesRelatorios &&
        relatoriosDisponiveis.length === 0 && (
          <div className="relatorios-erro">
            Você não possui relatórios liberados. Solicite a um administrador a
            permissão necessária.
          </div>
        )}

      {/* =================================================
          LISTA DOS RELATÓRIOS
      ================================================= */}

      {!relatorioSelecionado && relatoriosDisponiveis.length > 0 && (
        <div className="relatorios-lista">
          {categorias.map((categoria) => {
            const relatoriosCategoria = relatoriosPorCategoria.get(categoria) || [];

            return (
              <section key={categoria} className="relatorios-categoria">
                <div className="relatorios-categoria-header">
                  <h2>{categoria}</h2>

                  <span>{relatoriosCategoria.length} relatório(s)</span>
                </div>

                <div className="relatorios-grid">
                  {relatoriosCategoria.map((relatorio) => {
                    const Icone = relatorio.icone;

                    return (
                      <button
                        key={relatorio.id}
                        type="button"
                        className="relatorio-card"
                        onClick={() => selecionarRelatorio(relatorio.id)}
                      >
                        <div className="relatorio-card-icone">
                          <Icone />
                        </div>

                        <div className="relatorio-card-conteudo">
                          <span className="relatorio-card-categoria">{relatorio.categoria}</span>

                          <h3>{relatorio.titulo}</h3>

                          <p>{relatorio.descricao}</p>
                        </div>

                        <FiChevronRight className="relatorio-card-seta" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* =================================================
          RELATÓRIO SELECIONADO
      ================================================= */}

      {relatorioSelecionado && (
        <div className="relatorio-selecionado">
          {/* ===============================================
              CABEÇALHO
          =============================================== */}

          {!relatorioEhCustom && (
            <div className="relatorio-selecionado-header">
              <div className="relatorio-selecionado-icone">
                {React.createElement(relatorioSelecionado.icone)}
              </div>

              <div>
                <span className="relatorio-selecionado-categoria">
                  {relatorioSelecionado.categoria}
                </span>

                <h2>{relatorioSelecionado.titulo}</h2>

                <p>{relatorioSelecionado.descricao}</p>
              </div>
            </div>
          )}

          {/* ===============================================
              RELATÓRIO CUSTOMIZADO
          =============================================== */}

          {relatorioEhCustom && ComponenteCustomizado && (
            <ComponenteCustomizado relatorio={relatorioSelecionado} />
          )}

          {/* ===============================================
              ERRO PEDIDOS
          =============================================== */}

          {fonteEhPedidos && erroPedidos && (
            <div className="relatorios-erro">
              {erroPedidos.message || "Não foi possível carregar os pedidos."}
            </div>
          )}

          {/* ===============================================
              AÇÕES
          =============================================== */}

          {!relatorioEhCustom && (
            <>
              <div className="relatorio-acoes">
                <button
                  type="button"
                  className="btn-relatorio"
                  onClick={() => setVisualizacaoAberta(true)}
                  disabled={dadosRelatorioFinal.length === 0}
                >
                  <FiEye />

                  <div>
                    <strong>Visualizar</strong>

                    <span>Conferir antes de exportar</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn-relatorio btn-relatorio-pdf"
                  onClick={handleGerarPDF}
                  disabled={dadosRelatorioFinal.length === 0}
                >
                  <FiFileText />

                  <div>
                    <strong>Baixar PDF</strong>

                    <span>Relatório formatado</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="btn-relatorio btn-relatorio-csv"
                  onClick={handleGerarExcel}
                  disabled={dadosRelatorioFinal.length === 0}
                >
                  <FiDownload />

                  <div>
                    <strong>Exportar Excel</strong>

                    <span>Tabela XLSX</span>
                  </div>
                </button>
              </div>

              {/* ===============================================
                  FILTROS
              =============================================== */}

              <div className="relatorio-filtros-card">
                <div className="relatorio-filtros-header">
                  <div>
                    <h3>Parâmetros do relatório</h3>

                    <p>Refine os dados antes de visualizar ou exportar.</p>
                  </div>
                </div>

                {fonteEhPedidos ? (
                  <FiltrosPedidosRelatorio
                    filtros={filtros}
                    setFiltros={setFiltros}
                    pedidos={pedidosBrutos}
                    relatorio={relatorioSelecionado}
                  />
                ) : (
                  <FiltrosDashboard
                    filtros={filtros}
                    setFiltros={setFiltros}
                    rawDados={dadosBrutos}
                    exibirPeriodo={relatorioSelecionado.filtros.periodo}
                    exibirInjetora={relatorioSelecionado.filtros.injetora}
                    exibirTurno={false}
                    exibirProduto={relatorioSelecionado.filtros.produto}
                    exibirMp={relatorioSelecionado.filtros.mp}
                    exibirTipo={relatorioSelecionado.filtros.tipo}
                    tiposDisponiveis={tiposDisponiveis}
                    produtosDisponiveis={produtosDisponiveis}
                    mpsDisponiveis={mpsDisponiveis}
                    modoRelatorio={true}
                  />
                )}
              </div>

              {/* ===============================================
                  RESUMO
              =============================================== */}

              <div className="relatorio-resumo-grid">
                <div className="relatorio-resumo-card">
                  <span>Registros no relatório</span>

                  <strong>{totalRegistrosRelatorio}</strong>
                </div>

                <div className="relatorio-resumo-card">
                  <span>Relatório selecionado</span>

                  <strong className="relatorio-resumo-texto">{relatorioSelecionado.titulo}</strong>
                </div>

                <div className="relatorio-resumo-card">
                  <span>Filtros aplicados</span>

                  <strong className="relatorio-resumo-texto">{montarTextoFiltros()}</strong>
                </div>
              </div>

              {/* ===============================================
                  VISUALIZAÇÃO
              =============================================== */}

              {visualizacaoAberta && (
                <section className="relatorio-visualizacao">
                  <div className="relatorio-visualizacao-header">
                    <div>
                      <span className="relatorio-visualizacao-eyebrow">Pré-visualização</span>

                      <h3>{relatorioSelecionado.titulo}</h3>
                    </div>

                    <button
                      type="button"
                      className="relatorio-visualizacao-fechar"
                      onClick={() => setVisualizacaoAberta(false)}
                      aria-label="Fechar visualização"
                    >
                      <FiX />
                    </button>
                  </div>

                  <div className="relatorio-visualizacao-info">
                    <div className="relatorio-visualizacao-info-item">
                      <span>Filtros</span>

                      <strong>{montarTextoFiltros()}</strong>
                    </div>

                    <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                      <span>Registros</span>

                      <strong>{totalRegistrosRelatorio}</strong>
                    </div>
                  </div>

                  {dadosRelatorioFinal.length > 0 ? (
                    <div className="relatorio-visualizacao-tabela-wrapper">
                      <table className="relatorio-visualizacao-tabela">
                        <thead>
                          <tr>
                            {colunasVisualizacao.map((coluna) => (
                              <th
                                key={coluna.chave}
                                className={coluna.numerica ? "coluna-numerica" : ""}
                              >
                                {coluna.titulo}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {dadosRelatorioFinal.map((item, indice) => (
                            <tr key={`${relatorioSelecionado.id}-${indice}`}>
                              {colunasVisualizacao.map((coluna) => (
                                <td
                                  key={coluna.chave}
                                  className={coluna.numerica ? "coluna-numerica" : ""}
                                >
                                  {obterValorVisualizacao(item, coluna.chave)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="relatorio-visualizacao-vazia">
                      <FiFileText />

                      <strong>Nenhum registro encontrado</strong>

                      <span>Ajuste os filtros para visualizar os dados.</span>
                    </div>
                  )}

                  <div className="relatorio-visualizacao-footer">
                    <span>{dadosRelatorioFinal.length} linha(s) exibida(s)</span>

                    <span>Visualização atualizada conforme os filtros</span>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TelaRelatorios;
