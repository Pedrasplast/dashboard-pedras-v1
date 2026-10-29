import { FiArrowLeft, FiChevronRight } from "react-icons/fi";

/** Botão de voltar e trilha "Relatórios › Categoria › Título". */
export default function NavegacaoRelatorio({ relatorio, onVoltar }) {
  return (
    <div className="relatorios-navegacao-topo">
      <button type="button" className="btn-voltar-topo" onClick={onVoltar}>
        <FiArrowLeft />

        <span>Voltar aos relatórios</span>
      </button>

      <nav className="relatorios-trilha" aria-label="Você está em">
        <span>Relatórios</span>
        {relatorio.categoria && (
          <>
            <FiChevronRight aria-hidden="true" />
            <span>{relatorio.categoria}</span>
          </>
        )}
        <FiChevronRight aria-hidden="true" />
        <strong>{relatorio.titulo}</strong>
      </nav>
    </div>
  );
}

/** Cartão de carregamento da Central de Relatórios. */
export function CarregandoRelatorios({ mensagem }) {
  return (
    <div className="relatorios-loading">
      <div className="relatorios-loading-card">
        <div className="relatorios-spinner" />

        <p>{mensagem}</p>
      </div>
    </div>
  );
}
