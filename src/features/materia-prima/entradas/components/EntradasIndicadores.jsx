import { formatarKg, formatarMoeda } from "../utils/formatadores";

export default function EntradasIndicadores({ indicadores }) {
  return (
    <div className="entradas-pp-indicadores">
      <div>
        <span>Recebimentos</span>
        <strong>{indicadores.recebimentos}</strong>
      </div>

      <div>
        <span>Total recebido</span>
        <strong>{formatarKg(indicadores.totalKg)}</strong>
      </div>

      <div>
        <span>Valor total recebido</span>
        <strong>{formatarMoeda(indicadores.totalValor)}</strong>
      </div>
    </div>
  );
}
