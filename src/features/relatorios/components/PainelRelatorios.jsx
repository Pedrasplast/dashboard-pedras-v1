import { useMemo, useState } from "react";
import { FiClock, FiSearch, FiStar } from "react-icons/fi";

import {
  GRUPO_FAVORITOS,
  GRUPO_RECENTES,
  GRUPO_TODOS,
  agruparPorCategoria,
  alternarFavorito,
  gravarLista,
  lerLista,
  montarLista,
  quando,
  registrarRecente,
} from "../utils/painelRelatorios.utils";

import "./PainelRelatorios.css";

/* =========================================================
   TELA INICIAL DOS RELATÓRIOS — versão C (06/11/2026)
   Duas colunas: atalhos e áreas à esquerda, relatórios à
   direita, só com o nome (a descrição aparece ao parar o
   mouse em cima). Um clique no nome abre o relatório; a estrela
   marca como favorito. Sem cores por área nem ícones, para
   continuar limpa quando a lista crescer.
   Só apresentação: usa a mesma lista de relatórios liberados.
========================================================= */

const CHAVE_RECENTES = "relatorios:recentes";
const CHAVE_FAVORITOS = "relatorios:favoritos";

// Área escolhida por último, para voltar nela ao sair de um relatório.
let ultimoGrupo = null;

export default function PainelRelatorios({
  relatoriosDisponiveis = [],
  categoriasCatalogo = [],
  categoriaSelecionada,
  onCategoria,
  busca,
  onBusca,
  onAbrir,
}) {
  const [recentes, setRecentes] = useState(() => lerLista(CHAVE_RECENTES));
  const [favoritos, setFavoritos] = useState(() => lerLista(CHAVE_FAVORITOS));

  const idsDisponiveis = useMemo(
    () => new Set(relatoriosDisponiveis.map((relatorio) => relatorio.id)),
    [relatoriosDisponiveis],
  );
  const qtdFavoritos = favoritos.filter((id) => idsDisponiveis.has(id)).length;
  const qtdRecentes = recentes.filter((item) => idsDisponiveis.has(item?.id)).length;

  // Volta na última área usada; na primeira vez, abre em Favoritos se houver algum.
  const [grupo, setGrupo] = useState(
    () => ultimoGrupo || (qtdFavoritos > 0 ? GRUPO_FAVORITOS : categoriaSelecionada || GRUPO_TODOS),
  );

  const termo = String(busca || "").trim();
  const itens = montarLista({ relatorios: relatoriosDisponiveis, grupo, busca: termo, favoritos, recentes });
  const agrupar = Boolean(termo) || grupo === GRUPO_TODOS;

  const escolherGrupo = (nome) => {
    ultimoGrupo = nome;
    setGrupo(nome);
    if (nome !== GRUPO_FAVORITOS && nome !== GRUPO_RECENTES) onCategoria?.(nome);
    if (termo) onBusca("");
  };

  const abrir = (id) => {
    setRecentes(gravarLista(CHAVE_RECENTES, registrarRecente(recentes, id)));
    onAbrir(id);
  };

  const favoritar = (id) => {
    setFavoritos(gravarLista(CHAVE_FAVORITOS, alternarFavorito(favoritos, id)));
  };

  const titulo = termo
    ? "Resultado da busca"
    : grupo === GRUPO_FAVORITOS
      ? "Favoritos"
      : grupo === GRUPO_RECENTES
        ? "Abertos recentemente"
        : grupo === GRUPO_TODOS
          ? "Todos os relatórios"
          : grupo;

  const vazio = termo
    ? "Nenhum relatório encontrado para essa busca."
    : grupo === GRUPO_FAVORITOS
      ? "Nenhum favorito ainda. Clique na estrela ao lado de um relatório para guardá-lo aqui."
      : grupo === GRUPO_RECENTES
        ? "Os relatórios que você abrir aparecem aqui."
        : "Nenhum relatório nesta área.";

  const linha = ({ relatorio, em }) => {
    const favorito = favoritos.includes(relatorio.id);
    return (
      <li key={relatorio.id} className="pr-linha">
        <button
          type="button"
          className="pr-abrir"
          onClick={() => abrir(relatorio.id)}
          title={relatorio.descricao || undefined}
        >
          <strong>{relatorio.titulo}</strong>
        </button>
        {em && <span className="pr-quando">{quando(em)}</span>}
        <button
          type="button"
          className={`pr-estrela ${favorito ? "pr-estrela-on" : ""}`}
          onClick={() => favoritar(relatorio.id)}
          aria-pressed={favorito}
          aria-label={favorito ? `Tirar ${relatorio.titulo} dos favoritos` : `Favoritar ${relatorio.titulo}`}
          title={favorito ? "Tirar dos favoritos" : "Favoritar"}
        >
          <FiStar aria-hidden="true" />
        </button>
      </li>
    );
  };

  const botaoGrupo = (nome, rotulo, quantidade, Icone) => {
    const ativo = !termo && grupo === nome;
    return (
      <button
        key={nome}
        type="button"
        className={`pr-grupo ${ativo ? "pr-grupo-ativo" : ""}`}
        aria-pressed={ativo}
        onClick={() => escolherGrupo(nome)}
      >
        {Icone && <Icone aria-hidden="true" />}
        <span>{rotulo}</span>
        <b>{quantidade}</b>
      </button>
    );
  };

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
          placeholder="Buscar relatório"
          aria-label="Buscar relatório"
        />
        <span>{relatoriosDisponiveis.length}</span>
      </label>

      <div className="pr-corpo">
        <nav className="pr-grupos" aria-label="Áreas dos relatórios">
          {botaoGrupo(GRUPO_FAVORITOS, "Favoritos", qtdFavoritos, FiStar)}
          {botaoGrupo(GRUPO_RECENTES, "Recentes", qtdRecentes, FiClock)}
          <hr />
          {categoriasCatalogo.map((categoria) =>
            botaoGrupo(categoria.nome, categoria.nome, categoria.quantidade),
          )}
        </nav>

        <section className="pr-lista" aria-label={titulo}>
          <h2>
            {titulo}
            <span> · {itens.length}</span>
          </h2>

          {itens.length === 0 ? (
            <p className="pr-vazio">{vazio}</p>
          ) : agrupar ? (
            agruparPorCategoria(itens).map((secao) => (
              <div key={secao.nome} className="pr-secao">
                <h3>{secao.nome}</h3>
                <ul>{secao.itens.map(linha)}</ul>
              </div>
            ))
          ) : (
            <ul>{itens.map(linha)}</ul>
          )}
        </section>
      </div>
    </div>
  );
}
