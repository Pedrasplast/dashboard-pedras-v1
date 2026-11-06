/*
 * Uma marca por execução de hoje: verde = ok, amarelo = lenta,
 * vermelho = erro, azul = rodando. Passar o mouse mostra hora e duração.
 */
const ROTULO = Object.freeze({ o: "OK", l: "Lenta", e: "Erro", r: "Rodando" });

const dois = (n) => String(n).padStart(2, "0");

export default function LinhaDoDia({ execucoes }) {
  if (!Array.isArray(execucoes) || execucoes.length === 0) return null;

  const erros = execucoes.filter((e) => e[1] === "e").length;
  const lentas = execucoes.filter((e) => e[1] === "l").length;

  return (
    <div
      className="mon-linha-dia"
      role="img"
      aria-label={`Hoje: ${execucoes.length} execuções, ${erros} com erro, ${lentas} lentas`}
    >
      <span className="mon-linha-dia__rotulo">Hoje</span>
      <span className="mon-linha-dia__marcas">
        {execucoes.map(([minuto, estado, segundos], indice) => (
          <span
            key={`${minuto}-${indice}`}
            className={`mon-linha-dia__marca mon-linha-dia__marca--${estado}`}
            title={`${dois(Math.floor(minuto / 60))}:${dois(minuto % 60)} · ${ROTULO[estado] ?? estado} · ${segundos} s`}
          />
        ))}
      </span>
    </div>
  );
}
