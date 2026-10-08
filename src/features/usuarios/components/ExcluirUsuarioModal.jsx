import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
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
    <Modal
      asChild
      aberto={Boolean(usuario)}
      onFechar={onCancelar}
      bloqueado={false}
      tamanho="pequeno"
      fecharAoClicarFora={false}
    >

      <div className="modal-content">

        <header data-modal-header><div><div className="modal-icon-alert">
          <FiAlertTriangle />
        </div>


        <ModalTitulo>
          <h3>
            Confirmar Exclusão
          </h3>
        </ModalTitulo>


        <p>
          Tem certeza que deseja excluir completamente
          o acesso de{" "}

          <strong>
            {usuario.email}
          </strong>

          ? Esta ação não poderá ser desfeita.
        </p></div></header>


        <div className="modal-actions" data-modal-footer="">

          <button
            type="button"
            className="btn-modal-cancelar"
            onClick={
              onCancelar
            }
            data-modal-acao="secundaria"
          >
            Cancelar
          </button>


          <button
            type="button"
            className="btn-modal-confirmar"
            onClick={
              onConfirmar
            }
            data-modal-acao="perigo"
          >
            Sim, excluir
          </button>

        </div>

      </div>

    </Modal>
  );
}