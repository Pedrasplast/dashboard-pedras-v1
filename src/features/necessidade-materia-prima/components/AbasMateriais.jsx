import { AlertTriangle, Package } from "lucide-react";

function AbasMateriais({ materiais, selecionado, onSelecionar }) {
  return (
    <div className="necessidade-abas" role="tablist" aria-label="Selecionar matéria-prima">
      {materiais.map((material) => {
        const ativo = String(material.id) === String(selecionado);

        return (
          <button
            key={material.id}
            type="button"
            role="tab"
            id={`necessidade-aba-${material.id}`}
            aria-selected={ativo}
            aria-controls="necessidade-painel-material"
            className={ativo ? "necessidade-aba necessidade-aba-ativa" : "necessidade-aba"}
            onClick={() => onSelecionar(String(material.id))}
          >
            <Package size={16} aria-hidden="true" />

            {material.material}

            {!material.estoqueDisponivel && (
              <AlertTriangle
                size={14}
                className="necessidade-aba-alerta"
                aria-label="Estoque não encontrado"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AbasMateriais;
