export default function CardResumo({ titulo, valor, subtitulo, icone: Icone }) {
  return (
    <article className="cadastros-resumo-card">
      <div className="cadastros-resumo-card__topo">
        <span>{titulo}</span>
        <Icone size={19} />
      </div>
      <strong>{valor}</strong>
      <small>{subtitulo}</small>
    </article>
  );
}
