export default function InsightsMateriaPrima({
  insights,
}) {
  if (
    !Array.isArray(
      insights,
    ) ||
    insights.length ===
      0
  ) {
    return null;
  }


  return (
    <section className="dmp-secao">

      <div className="dmp-secao-titulo">

        <div>
          <span>
            Destaques
          </span>

          <h2>
            Destaques do período
          </h2>
        </div>

        <small>
          Informações descritivas calculadas a partir das compras
        </small>

      </div>


      <div className="dmp-insights">

        {insights.map(
          (
            item,
            indice,
          ) => (
            <article
              key={
                `${item.titulo}_${indice}`
              }
            >
              <span>
                {item.titulo}
              </span>

              <strong>
                {item.valor}
              </strong>

              <small>
                {item.detalhe}
              </small>
            </article>
          ),
        )}

      </div>

    </section>
  );
}