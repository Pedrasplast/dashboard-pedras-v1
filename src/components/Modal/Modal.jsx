import { cloneElement, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import "./Modal.css";

/** Janela do sistema. asChild preserva formularios, classes e eventos da tela. */
export default function Modal({
  aberto,
  onFechar,
  bloqueado = false,
  fecharAoClicarFora = true,
  overlayClassName,
  className,
  tamanho = "grande",
  asChild = false,
  children,
}) {
  const focoAnterior = useRef(null);
  const estavaAberto = useRef(false);
  // Capturar antes de campos com autoFocus receberem o foco.
  if (aberto && !estavaAberto.current && typeof document !== "undefined") {
    focoAnterior.current = document.activeElement;
  }
  estavaAberto.current = Boolean(aberto);
  const conteudo = asChild ? (
    children
  ) : (
    <section className={className}>{children}</section>
  );
  const classes = ["sistema-modal", conteudo.props.className]
    .filter(Boolean)
    .join(" ");
  return (
    <Dialog.Root
      open={Boolean(aberto)}
      onOpenChange={(proximoAberto) => {
        if (!proximoAberto && !bloqueado) onFechar?.();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={["sistema-modal-overlay", overlayClassName]
            .filter(Boolean)
            .join(" ")}
          onMouseDown={(evento) => {
            if (
              evento.target === evento.currentTarget &&
              fecharAoClicarFora &&
              !bloqueado
            )
              onFechar?.();
          }}
        >
          <Dialog.Content
            asChild
            aria-describedby={undefined}
            onCloseAutoFocus={(evento) => {
              if (focoAnterior.current?.isConnected) {
                evento.preventDefault();
                focoAnterior.current.focus();
              }
            }}
            onEscapeKeyDown={(evento) => {
              if (bloqueado) evento.preventDefault();
            }}
            onPointerDownOutside={(evento) => {
              evento.preventDefault();
            }}
          >
            {cloneElement(conteudo, {
              className: classes,
              "data-modal-tamanho": tamanho,
            })}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
