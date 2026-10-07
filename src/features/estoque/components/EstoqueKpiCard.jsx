export default function EstoqueKpiCard({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  tipo,
}) {
  return (
    <article
      className={
        `estoque-kpi estoque-kpi--${tipo}`
      }
    >

      <div className="estoque-kpi__topo">

        <span>
          {titulo}
        </span>


        <div className="estoque-kpi__icone">

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