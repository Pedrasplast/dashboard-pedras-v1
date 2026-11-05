import { useMemo, useState } from "react";
import {
  FiArrowRight,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShoppingCart,
} from "react-icons/fi";

import "./PainelRelatorios.css";

/* =========================================================
   TELA INICIAL DOS RELATÓRIOS — versão B (23/10)
   Categorias na lateral, lista com descrição e "Abrir",
   atalhos dos relatórios abertos recentemente.
   Só apresentação: usa as mesmas listas, filtros e permissões.
========================================================= */

const CATEGORIAS = {
  Todos: { cor: "#0b1f5c", icone: FiGrid },
  Produção: { cor: "#2563eb", icone: FiSettings },
  Paradas: { cor: "#ea580c", icone: FiClock },
  Pedidos: { cor: "#7c3aed", icone: FiFileText },
  Compras: { cor: "#0891b2", icone: FiShoppingCart },
  Financeiro: { cor: "#16a34a", icone: FiDollarSign },
  "Matéria-Prima": { cor: "#b45309", icone: FiPackage },
};

const CHAVE_RECENTES = "relatorios:recentes";
const MAX_RECENTES = 4;

function estiloCategoria(nome) {
  return CATEGORIAS[nome] || { cor: "#475569", icone: FiFileText };
}

function lerRecentes() {
  try {
    const valor = JSON.parse(window.localStorage.getItem(CHAVE_RECENTES) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function gravarRecente(id) {
  const atual = lerRecentes().filter((item) => item?.id !== id);
  const novo = [{ id, em: Date.now() }, ...atual].slice(0, MAX_RECENTES);
  try {
    window.localStorage.setItem(CHAVE_RECENTES, JSON.stringify(novo));
  } catch {
    // Sem armazenamento: só não guarda os recentes.
  }
  return novo;
}

function quando(ms) {
  const data = new Date(ms);
  if (Number.isNaN(data.getTime())) return "";
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return "hoje";
  if (data.toDateString() === ontem.toDateString()) return "ontem";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function IconeCategoria({ categoria, icone: IconeProprio, pequeno = false }) {
  const { cor, icone } = estiloCategoria(categoria);
  const Icone = IconeProprio || icone;
  return (
    <span
      className={`pr-icone ${pequeno ? "pr-icone-pequeno" : ""}`}
      style={{ color: cor, background: `${cor}14` }}
      aria-hidden="true"
    >
      <Icone />
    </span>
  );
}

export default function PainelRelatorios({
  relatoriosDisponiveis = [],
  relatoriosCatalogo = [],
  categoriasCatalogo = [],
  categoriaSelecionada,
  onCategoria,
  busca,
  onBusca,
  onAbrir,
}) {
  const [recentes, setRecentes] = useState(lerRecentes);

  const porId = useMemo(
    () => new Map(relatoriosDisponiveis.map((relatorio) => [relatorio.id, relatorio])),
    [relatoriosDisponiveis],
  );

  // Só os recentes que o usuário ainda pode abrir.
  const recentesValidos = recentes
    .map((item) => ({ ...item, relatorio: porId.get(item.id) }))
    .filter((item) => item.relatorio);

  const abrir = (id) => {
    setRecentes(gravarRecente(id));
    onAbrir(id);
  };

  const termo = String(busca || "").trim();
  const tituloLista = termo
    ? "Resultado da busca"
    : categoriaSelecionada === "Todos"
      ? "Todos os relatórios"
      : categoriaSelecionada;

  return (
    <div className="pr">
      <header className="pr-cabecalho">
        <img src="/Logo_Pedrasplast.png" alt="Pedrasplast" className="pr-logo" />
        <div>
          <small>Central de relatórios</small>
          <h1>Relatórios</h1>
          <p>Consulte e exporte informações operacionais e gerenciais com os dados do sistema.</p>
        </div>
      </header>

      <label className="pr-busca">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={busca}
          onChange={(evento) => onBusca(evento.target.value)}
          placeholder="Buscar relatório por nome, categoria ou descrição..."
          aria-label="Buscar relatório"
        />
        <span>
          {relatoriosCatalogo.length} de {relatoriosDisponiveis.length}
        </span>
      </label>

      {recentesValidos.length > 0 && (
        <div className="pr-recentes" aria-label="Abertos recentemente">
          <span className="pr-recentes-titulo">
            <FiClock aria-hidden="true" />
            Recentes:
          </span>
          {recentesValidos.map(({ id, em, relatorio }) => (
            <button key={id} type="button" className="pr-recente" onClick={() => abrir(id)}>
              {relatorio.titulo}
              <small>{quando(em)}</small>
            </button>
          ))}
        </div>
      )}

      <div className="pr-corpo">
        <nav className="pr-categorias" aria-label="Categorias de relatórios">
          <h2>Categorias</h2>
          {categoriasCatalogo.map((categoria) => {
            const ativa = categoriaSelecionada === categoria.nome;
            return (
              <button
                key={categoria.nome}
                type="button"
                className={`pr-categoria ${ativa ? "pr-categoria-ativa" : ""}`}
                aria-pressed={ativa}
                onClick={() => onCategoria(categoria.nome)}
              >
                <IconeCategoria categoria={categoria.nome} pequeno />
                <span className="pr-categoria-nome">{categoria.nome}</span>
                <b>{categoria.quantidade}</b>
              </button>
            );
          })}
        </nav>

        <section className="pr-lista">
          <div className="pr-lista-topo">
            <h2>
              {tituloLista}
              <span>
                {" · "}
                {relatoriosCatalogo.length} relatório{relatoriosCatalogo.length === 1 ? "" : "s"}
              </span>
            </h2>
          </div>

          {relatoriosCatalogo.length > 0 ? (
            <ul>
              {relatoriosCatalogo.map((relatorio) => {
                const { cor } = estiloCategoria(relatorio.categoria);
                return (
                  <li key={relatorio.id}>
                    <button type="button" className="pr-item" onClick={() => abrir(relatorio.id)}>
                      <IconeCategoria categoria={relatorio.categoria} icone={relatorio.icone} />
                      <span className="pr-item-texto">
                        <strong>{relatorio.titulo}</strong>
                        {relatorio.descricao && <small>{relatorio.descricao}</small>}
                      </span>
                      <span
                        className="pr-item-categoria"
                        style={{ color: cor, background: `${cor}14` }}
                      >
                        {relatorio.categoria}
                      </span>
                      <span className="pr-item-abrir">
                        Abrir
                        <FiArrowRight aria-hidden="true" />
                      </span>
                      <FiChevronRight className="pr-item-seta" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="pr-vazio">
              <FiSearch aria-hidden="true" />
              <strong>Nenhum relatório encontrado</strong>
              <span>Ajuste a busca ou escolha outra categoria.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
