import {
  Clock3,
} from "lucide-react";

import {
  formatarDataHora,
  obterModoSincronizacao,
} from "../utils/estoque.utils";


export default function EstoqueStatusSincronizacao({
  status,
}) {
  const modo =
    obterModoSincronizacao(
      status,
    );


  return (
    <div
      className="estoque-atualizacao"
      title={
        status?.mensagem ||
        "Sincronização automática do estoque"
      }
    >
      <Clock3
        size={18}
      />


      <div className="estoque-atualizacao__textos">

        <span className="estoque-atualizacao__titulo">
          Última atualização
        </span>


        <span className="estoque-atualizacao__horario">

          <strong>
            {formatarDataHora(
              status
                ?.ultima_sincronizacao,
            )}
          </strong>


          <span>
            •
          </span>


          <span>
            {modo}
          </span>

        </span>

      </div>
    </div>
  );
}