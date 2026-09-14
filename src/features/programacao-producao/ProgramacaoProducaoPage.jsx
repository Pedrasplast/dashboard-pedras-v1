import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Factory,
  PackageCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import ExcluirProgramacaoModal from "./components/ExcluirProgramacaoModal";
import Kpi from "./components/Kpi";
import ProdutoProgramacaoCard from "./components/ProdutoProgramacaoCard";
import ProgramacaoProducaoModal from "./components/ProgramacaoProducaoModal";
import { useProgramacaoProducao } from "./hooks/useProgramacaoProducao";

import "./ProgramacaoProducaoPage.css";

const ABAS = [
  {
    chave: "programados",
    titulo: "Programados",
    descricao: "Produtos com cadastro de ciclo que precisam de produção.",
    icone: Factory,
  },
  {
    chave: "atendidos",
    titulo: "Atendidos",
    descricao: "Produtos cuja carteira já está coberta pelo estoque.",
    icone: CheckCircle2,
  },
  {
    chave: "falta-cadastro",
    titulo: "Falta de cadastro",
    descricao: "Produtos que precisam produzir, mas não têm ciclo cadastrado.",
    icone: CircleAlert,
  },
];

function obterCategoriaProduto(produto) {
  const precisaProduzir = Number(produto.necessidade_producao ?? 0) > 0;

  if (!precisaProduzir) return "atendidos";
  if (!produto.tem_ciclo) return "falta-cadastro";

  // Aqui ficam tanto os já programados quanto os que ainda aguardam programação,
  // desde que tenham ciclo cadastrado e precisem produzir.
  return "programados";
}

export default function ProgramacaoProducaoPage() {
  const {
    programacao,
    resumo,
    loading,
    erro,
    atualizadoEm,
    carregarDados,
  } = useProgramacaoProducao();

  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("programados");
  const [mensagem, setMensagem] = useState("");
  const [erroOperacao, setErroOperacao] = useState("");
  const [editorProduto, setEditorProduto] = useState(null);
  const [excluirProduto, setExcluirProduto] = useState(null);

  const contadoresAbas = useMemo(() => {
    const contadores = {
      programados: 0,
      atendidos: 0,
      "falta-cadastro": 0,
    };

    for (const produto of programacao) {
      const categoria = obterCategoriaProduto(produto);
      contadores[categoria] += 1;
    }

    return contadores;
  }, [programacao]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return programacao.filter((produto) => {
      if (obterCategoriaProduto(produto) !== abaAtiva) return false;
      if (!termo) return true;

      const texto = [
        produto.codigo_produto,
        produto.produto,
        ...produto.pedidos.flatMap((pedido) => [pedido.numero_pedido, pedido.cliente]),
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [programacao, busca, abaAtiva]);

  const abaSelecionada = ABAS.find((aba) => aba.chave === abaAtiva) ?? ABAS[0];

  async function atualizarAposOperacao(mensagemSucesso) {
    setMensagem(mensagemSucesso);
    setErroOperacao("");
    await carregarDados();
  }

  return (
    <div className="programacao-producao-page">
      <header className="programacao-header">
        <div>
          <span className="programacao-eyebrow">Produção</span>
          <h1>Estoque, pedidos e prazo de produção</h1>
          <p>
            Informe apenas quando cada produto começa e quantas horas por dia serão
            trabalhadas. O sistema calcula automaticamente até quando produzir e quais
            pedidos serão atendidos no prazo.
          </p>
        </div>

        <div className="programacao-header-actions">
          {atualizadoEm && (
            <span className="programacao-atualizado">
              Atualizado às{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(atualizadoEm)}
            </span>
          )}
          <button
            type="button"
            className="programacao-refresh"
            onClick={carregarDados}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "girando" : ""} />
            Atualizar
          </button>
        </div>
      </header>

      <section className="programacao-kpis">
        <Kpi icon={<PackageCheck size={20} />} label="Pedidos no Omie" value={resumo.pedidosOmie} />
        <Kpi icon={<Boxes size={20} />} label="Produtos na carteira" value={resumo.produtos} />
        <Kpi
          icon={<Factory size={20} />}
          label="Produtos para produzir"
          value={resumo.produtosComFalta}
          tipo="alerta"
        />
        <Kpi
          icon={<AlertTriangle size={20} />}
          label="Pedidos em risco"
          value={resumo.pedidosRisco}
          tipo="perigo"
        />
      </section>

      <section className="programacao-controles programacao-controles-com-abas">
        <label className="programacao-busca">
          <Search size={18} />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Produto, código, pedido ou cliente..."
          />
        </label>
      </section>

      <nav className="programacao-abas" aria-label="Situação dos produtos">
        {ABAS.map((aba) => {
          const Icone = aba.icone;
          const ativa = abaAtiva === aba.chave;

          return (
            <button
              key={aba.chave}
              type="button"
              className={`programacao-aba programacao-aba-${aba.chave} ${ativa ? "ativa" : ""}`.trim()}
              onClick={() => setAbaAtiva(aba.chave)}
              aria-pressed={ativa}
            >
              <span className="programacao-aba-icone">
                <Icone size={17} />
              </span>
              <span className="programacao-aba-texto">
                <strong>{aba.titulo}</strong>
                <small>{contadoresAbas[aba.chave]}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="programacao-aba-contexto">
        <strong>{abaSelecionada.titulo}</strong>
        <span>{abaSelecionada.descricao}</span>
      </div>

      {mensagem && (
        <div className="programacao-sucesso">
          <CheckCircle2 size={18} /> {mensagem}
        </div>
      )}
      {(erro || erroOperacao) && (
        <div className="programacao-erro">{erro || erroOperacao}</div>
      )}
      {loading && (
        <div className="programacao-loading">
          <RefreshCw size={22} className="girando" /> Carregando...
        </div>
      )}

      {!loading && !erro && (
        <section className="programacao-produtos">
          {produtosFiltrados.length > 0 ? (
            produtosFiltrados.map((produto) => (
              <ProdutoProgramacaoCard
                key={produto.codigo_produto}
                produto={produto}
                onProgramar={() => {
                  setMensagem("");
                  setErroOperacao("");
                  setEditorProduto(produto);
                }}
                onExcluir={() => {
                  setMensagem("");
                  setErroOperacao("");
                  setExcluirProduto(produto);
                }}
              />
            ))
          ) : (
            <div className="programacao-vazio">
              <span className={`programacao-vazio-icone vazio-${abaAtiva}`}>
                {(() => {
                  const Icone = abaSelecionada.icone;
                  return <Icone size={22} />;
                })()}
              </span>
              <div>
                <strong>Nenhum produto nesta aba</strong>
                <span>
                  {busca.trim()
                    ? "Não encontramos produtos com esse termo dentro da situação selecionada."
                    : abaSelecionada.descricao}
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      <ExcluirProgramacaoModal
        produto={excluirProduto}
        onClose={() => setExcluirProduto(null)}
        onDeleted={async (mensagemSucesso) => {
          try {
            await atualizarAposOperacao(mensagemSucesso);
          } catch (error) {
            setErroOperacao(error?.message || "Não foi possível atualizar a tela.");
          }
        }}
      />

      <ProgramacaoProducaoModal
        produto={editorProduto}
        onClose={() => setEditorProduto(null)}
        onSaved={async (mensagemSucesso) => {
          try {
            await atualizarAposOperacao(mensagemSucesso);
          } catch (error) {
            setErroOperacao(error?.message || "Não foi possível atualizar a tela.");
          }
        }}
      />
    </div>
  );
}
