import {
  FiAlertTriangle,
} from "react-icons/fi";


export default function ExcluirUsuarioModal({
  usuario,
  onCancelar,
  onConfirmar,
}) {
  if (
    !usuario
  ) {
    return null;
  }

  return (
    <div className="modal-overlay">

      <div className="modal-content">

        <div className="modal-icon-alert">
          <FiAlertTriangle />
        </div>


        <h3>
          Confirmar Exclusão
        </h3>


        <p>
          Tem certeza que deseja excluir completamente
          o acesso de{" "}

          <strong>
            {usuario.email}
          </strong>

          ? Esta ação não poderá ser desfeita.
        </p>


        <div className="modal-actions">

          <button
            type="button"
            className="btn-modal-cancelar"
            onClick={
              onCancelar
            }
          >
            Cancelar
          </button>


          <button
            type="button"
            className="btn-modal-confirmar"
            onClick={
              onConfirmar
            }
          >
            Sim, excluir
          </button>

        </div>

      </div>

    </div>
  );
}