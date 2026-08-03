import { useCallback } from "react";
import { useNavigate as useNavigateRouter } from "@tanstack/react-router";

/*
 * Adaptador de navegação.
 *
 * Mantém a assinatura simples usada em toda a aplicação
 * — navigate('/rota') — sobre o roteador tipado.
 */
export function useNavigate() {
  const navigate = useNavigateRouter();

  return useCallback(
    (destino, opcoes) => {
      if (typeof destino === "string") {
        return navigate({ to: destino, ...opcoes });
      }

      return navigate(destino);
    },
    [navigate],
  );
}
