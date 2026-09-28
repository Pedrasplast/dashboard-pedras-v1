import { formatarKg, formatarMoeda } from "../utils/formatadores";

export default function ComprasFuturasIndicadores({ indicadores }) {
  return (
    <div className="compras-futuras-indicadores">
      <div>
        <span>Compras abertas</span>
        <strong>{indicadores.abertas}</strong>
      </div>

      <div>
        <span>Matéria-prima a receber</span>
        <strong>{formatarKg(indicadores.quantidadeAberta)}</strong>
      </div>

      <div>
        <span>Valor em aberto</span>
        <strong>{formatarMoeda(indicadores.valorAberto)}</strong>
      </div>
    </div>
  );
}
