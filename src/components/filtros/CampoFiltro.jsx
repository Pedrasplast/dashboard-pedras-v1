import { memo } from "react";

import "./CampoFiltro.css";


/* =========================================================
   CAMPO DE FILTRO COMPARTILHADO
   ---------------------------------------------------------
   Estrutura visual padrao para campos utilizados em filtros.

   A classe recebida pela tela continua sendo preservada para
   manter compatibilidade com os estilos existentes durante a
   migracao gradual para o Design System.
========================================================= */

function CampoFiltro({
  titulo,
  className = "",
  children,
}) {
  const classes = [
    "campo-filtro",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes}>
      <span className="campo-filtro__label">
        {titulo}
      </span>

      {children}
    </label>
  );
}

export default memo(CampoFiltro);