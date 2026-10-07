import {
  RotateCcw,
} from "lucide-react";

import "./LimparFiltrosButton.css";


export default function LimparFiltrosButton({
  ativo = false,
  onClick,
  texto = "Limpar filtros",
  className = "",
  disabled = false,
}) {
  const desabilitado =
    disabled ||
    !ativo;


  return (
    <button
      type="button"
      className={
        `limpar-filtros-button ${
          ativo &&
          !disabled
            ? "is-active"
            : "is-disabled"
        } ${className}`
      }
      disabled={
        desabilitado
      }
      aria-disabled={
        desabilitado
      }
      title={
        desabilitado
          ? "Nenhum filtro aplicado"
          : texto
      }
      onClick={
        onClick
      }
    >
      <RotateCcw
        size={
          16
        }
      />

      <span>
        {texto}
      </span>
    </button>
  );
}