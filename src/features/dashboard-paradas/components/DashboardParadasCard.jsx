import { memo } from "react";

import {
  AlertCircle,
} from "lucide-react";

/* =========================================================
   CARD PADRÃO DO DASHBOARD DE PARADAS

   Objetivo:
   - evitar repetir estrutura visual;
   - padronizar títulos;
   - padronizar subtítulos;
   - padronizar estado vazio;
   - facilitar manutenção futura.
========================================================= */

function DashboardParadasCard({
  title,
  subtitle,

  icon: Icon,

  actions,

  children,

  className = "",

  contentClassName = "",

  empty = false,

  emptyTitle = "Sem dados para exibir",

  emptyMessage = "Não existem registros para os filtros selecionados.",
}) {
  return (
    <section
      className={[
        "dp-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <header className="dp-card__header">
        <div className="dp-card__heading">
          {Icon && (
            <span className="dp-card__header-icon">
              <Icon
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />
            </span>
          )}

          <div className="dp-card__titles">
            <h2>
              {title}
            </h2>

            {subtitle && (
              <p>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="dp-card__actions">
            {actions}
          </div>
        )}
      </header>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <div
        className={[
          "dp-card__content",
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {empty ? (
          <div className="dp-card__empty">
            <span className="dp-card__empty-icon">
              <AlertCircle
                size={24}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>

            <strong>
              {emptyTitle}
            </strong>

            <p>
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default memo(
  DashboardParadasCard,
);