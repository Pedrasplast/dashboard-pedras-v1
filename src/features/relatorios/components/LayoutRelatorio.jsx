import { useEffect, useState } from "react";
import { FiDownload, FiEye, FiFileText, FiFilter, FiRotateCcw, FiX } from "react-icons/fi";

import "./LayoutRelatorio.css";

/* =========================================================
   LAYOUT PADRÃO DOS RELATÓRIOS (versão 4 — 23/10)

   - Filtros numa coluna à esquerda (no celular/tablet viram
     uma gaveta que abre por cima).
   - Cabeçalho com logo e linha verde.
   - Faixa única de indicadores.
   - Conteúdo (tabela/pré-visualização) ocupando o resto.

   Só apresentação: não altera dados, filtros nem exportação.
========================================================= */

function Botao({ onClick, desabilitado, carregando, classe, icone: Icone, children, titulo }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      className={`rl-btn ${classe || ""}`}
      onClick={onClick}
      disabled={Boolean(desabilitado || carregando)}
      title={titulo}
    >
      <Icone aria-hidden="true" />
      <span>{carregando ? "Gerando..." : children}</span>
    </button>
  );
}

export default function LayoutRelatorio({
  relatorio,
  titulo,
  descricao,
  categoria,
  filtros,
  filtrosAtivos = 0,
  acoes = {},
  indicadores = [],
  extrasCabecalho = null,
  fixo = false,
  children,
}) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // Fecha a gaveta com Esc.
  useEffect(() => {
    if (!filtrosAbertos) return undefined;
    const aoTeclar = (evento) => {
      if (evento.key === "Escape") setFiltrosAbertos(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [filtrosAbertos]);

  const {
    onVisualizar,
    onPdf,
    onExcel,
    onLimpar,
    desabilitado = false,
    gerandoPdf = false,
    gerandoExcel = false,
    limparDesabilitado = false,
  } = acoes;

  const nomeCategoria = categoria ?? relatorio?.categoria;
  const nomeTitulo = titulo ?? relatorio?.titulo;
  const textoDescricao = descricao ?? relatorio?.descricao;
  const indicadoresValidos = indicadores.filter(Boolean);

  return (
    <div className={`rl ${fixo ? "rl--fixo" : ""}`}>
      <aside
        className={`rl-filtros ${filtrosAbertos ? "rl-filtros-aberto" : ""}`}
        aria-label="Filtros do relatório"
      >
        <div className="rl-filtros-topo">
          <h3>
            <FiFilter aria-hidden="true" />
            Filtros
          </h3>

          {filtrosAtivos > 0 && (
            <span className="rl-filtros-ativos">
              {filtrosAtivos} ativo{filtrosAtivos === 1 ? "" : "s"}
            </span>
          )}

          <button
            type="button"
            className="rl-filtros-fechar"
            onClick={() => setFiltrosAbertos(false)}
            aria-label="Fechar filtros"
          >
            <FiX />
          </button>
        </div>

        <div className="rl-filtros-corpo">{filtros}</div>

        <div className="rl-acoes">
          <Botao onClick={onVisualizar} desabilitado={desabilitado} icone={FiEye} classe="rl-btn-ver">
            Visualizar
          </Botao>
          <Botao onClick={onPdf} desabilitado={desabilitado} carregando={gerandoPdf} icone={FiFileText} classe="rl-btn-pdf">
            PDF
          </Botao>
          <Botao onClick={onExcel} desabilitado={desabilitado} carregando={gerandoExcel} icone={FiDownload} classe="rl-btn-excel">
            Excel
          </Botao>
          <Botao
            onClick={onLimpar}
            desabilitado={limparDesabilitado}
            icone={FiRotateCcw}
            classe="rl-btn-limpar"
            titulo="Voltar os filtros ao padrão"
          >
            Limpar
          </Botao>
        </div>

        <button
          type="button"
          className="rl-filtros-aplicar"
          onClick={() => setFiltrosAbertos(false)}
        >
          Ver resultado
        </button>
      </aside>

      {filtrosAbertos && (
        <div
          className="rl-sombra"
          onClick={() => setFiltrosAbertos(false)}
          aria-hidden="true"
        />
      )}

      <section className="rl-conteudo">
        <header className="rl-cabecalho">
          <img src="/Logo_Pedrasplast.png" alt="Pedrasplast" className="rl-logo" />
          <div className="rl-cabecalho-texto">
            {nomeCategoria && <small>{nomeCategoria}</small>}
            <h2>{nomeTitulo}</h2>
            {textoDescricao && <p>{textoDescricao}</p>}
          </div>
          {extrasCabecalho}
          <button
            type="button"
            className="rl-abrir-filtros"
            onClick={() => setFiltrosAbertos(true)}
          >
            <FiFilter aria-hidden="true" />
            Filtros
            {filtrosAtivos > 0 && <span>{filtrosAtivos}</span>}
          </button>
        </header>

        {indicadoresValidos.length > 0 && (
          <div className="rl-indicadores">
            {indicadoresValidos.map((item) => (
              <div
                key={item.rotulo}
                className={`rl-indicador ${item.destaque ? "rl-indicador-destaque" : ""} ${item.texto ? "rl-indicador-texto" : ""}`}
              >
                <span>{item.rotulo}</span>
                <strong title={typeof item.valor === "string" ? item.valor : undefined}>
                  {item.valor}
                </strong>
              </div>
            ))}
          </div>
        )}

        {children}
      </section>
    </div>
  );
}
