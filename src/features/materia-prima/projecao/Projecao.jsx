import {
  ChartNoAxesCombined,
  Scale,
} from "lucide-react";

import ProjecaoDiaria from "./ProjecaoDiaria";
import SaldosIniciais from "./saldo-inicial/SaldosIniciais";
import "./Projecao.css";


export default function Projecao() {
  return (
    <div className="projecao-pp">

      <div className="projecao-pp-etapa">

        <div className="projecao-pp-etapa-icone">

          <Scale
            size={20}
            aria-hidden="true"
          />

        </div>


        <div>

          <strong>
            Saldos-base
          </strong>

          <p>
            Cadastre ou atualize os inventários
            físicos utilizados como ponto de
            partida da projeção.
          </p>

        </div>

      </div>


      <SaldosIniciais />


      <div className="projecao-pp-separador">

        <div className="projecao-pp-etapa-icone">

          <ChartNoAxesCombined
            size={20}
            aria-hidden="true"
          />

        </div>


        <div>

          <strong>
            Projeção diária de matéria-prima
          </strong>

          <p>
            O saldo é calculado por fornecedor,
            considerando saldo-base, materiais
            recebidos, compras futuras e consumo
            da programação conforme a receita
            de cada produto.
          </p>

        </div>

      </div>


      <ProjecaoDiaria />

    </div>
  );
}