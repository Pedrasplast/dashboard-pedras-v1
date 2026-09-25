import {
  formatarMoeda,
  formatarMoedaKg,
} from "../dashboardMateriaPrimaUtils.js";


export default function TooltipFinanceiro({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="dmp-tooltip">

      {label && (

        <strong>
          {label}
        </strong>

      )}

      {payload.map(
        (
          item,
        ) => {
          const chave =
            String(
              item.dataKey ??
              "",
            ).toLowerCase();

          const porKg =
            chave.includes(
              "preco",
            ) ||
            chave.includes(
              "custo",
            );

          return (
            <span
              key={
                item.dataKey
              }
            >
              {item.name}:{" "}
              {porKg
                ? formatarMoedaKg(
                    item.value,
                    3,
                  )
                : formatarMoeda(
                    item.value,
                    2,
                  )}
            </span>
          );
        },
      )}

    </div>
  );
}
