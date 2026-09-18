import { FiArrowLeft } from "react-icons/fi";

import "./NavegacaoRelatorios.css";

export default function NavegacaoRelatorios({ titulo, onVoltar }) {
  return (
    <nav className="relatorios-navegacao-topo" aria-label="Navegação do relatório">
      {/* ============================================
          BOTÃO DE RETORNO
      ============================================ */}

      <button
        type="button"
        className="btn-voltar-topo"
        onClick={onVoltar}
        aria-label="Voltar para a central de relatórios"
      >
        {/* ÍCONE */}

        <span className="btn-voltar-topo-icone" aria-hidden="true">
          <FiArrowLeft />
        </span>

        {/* TEXTO */}

        <span className="btn-voltar-topo-textos">
          <strong>Voltar aos relatórios</strong>

          <small>Retornar ao catálogo</small>
        </span>
      </button>

      {/* ============================================
          IDENTIFICAÇÃO DO RELATÓRIO ABERTO
      ============================================ */}

      <div className="relatorios-navegacao-contexto" aria-label={`Relatório atual: ${titulo}`}>
        <span>RELATÓRIO ATUAL</span>

        <strong title={titulo}>{titulo}</strong>
      </div>
    </nav>
  );
}
