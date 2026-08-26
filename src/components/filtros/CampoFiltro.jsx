import { memo } from "react";

function CampoFiltro({ titulo, className = "", children }) {
  const classes = [className].filter(Boolean).join(" ");

  return (
    <label className={classes}>
      <span>{titulo}</span>
      {children}
    </label>
  );
}

export default memo(CampoFiltro);
