export default function KpiCard({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  tipo = "padrao",
}) {
  return (
    <article
      className={
        `dmp-kpi dmp-kpi-${tipo}`
      }
    >

      <div className="dmp-kpi-topo">

        <span>
          {titulo}
        </span>

        <div className="dmp-kpi-icone">

          <Icone
            size={18}
          />

        </div>

      </div>

      <strong>
        {valor}
      </strong>

      <small>
        {subtitulo}
      </small>

    </article>
  );
}
