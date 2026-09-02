import "./PageHeader.css";

export default function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className = "",
  titleAs: Title = "h1",
}) {
  const classes = ["page-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="page-header__main">
        {Icon && (
          <div className="page-header__icon" aria-hidden="true">
            <Icon />
          </div>
        )}

        <div className="page-header__content">
          {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
          <Title className="page-header__title">{title}</Title>
          {description && (
            <p className="page-header__description">{description}</p>
          )}
        </div>
      </div>

      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
