import { useQuery } from "@tanstack/react-query";

import { buscarTabelaPrecos } from "../services/tabelaPrecos.service";
import { useAtualizarAoAlterarMateriais } from "@/features/cadastros/materiais/hooks/useAtualizarAoAlterarMateriais";

import { TABELA_PRECOS } from "../constants/tabelaPrecos.constants";

/* =========================================================
   CONSULTA REATIVA — TABELA DE PREÇOS

   MELHORIAS:
   - Atualizar sempre ao entrar na tela.
   - Preservar cache para navegação rápida.
   - Revalidar ao retornar à janela.
   - Preservar atualização automática.
   - Não exigir F5.
========================================================= */

export function useTabelaPrecos() {
  /* Habilitou/desabilitou no Cadastro de Material: atualiza na hora. */
  useAtualizarAoAlterarMateriais(TABELA_PRECOS.QUERY_KEY);

  return useQuery({
    queryKey: TABELA_PRECOS.QUERY_KEY,

    queryFn: buscarTabelaPrecos,

    /* =====================================================
       CACHE

       Mantém o cache na memória pelo tempo
       já definido nas constantes do projeto.
    ===================================================== */

    staleTime: TABELA_PRECOS.STALE_TIME,

    gcTime: TABELA_PRECOS.GC_TIME,

    /* =====================================================
       AO ABRIR A TELA

       Mesmo com dados em cache, faz uma nova
       consulta quando o componente é montado.
    ===================================================== */

    refetchOnMount: "always",

    /* =====================================================
       AO RETORNAR PARA A JANELA

       Atualiza a consulta se houver dados
       potencialmente desatualizados.
    ===================================================== */

    refetchOnWindowFocus: true,

    /* =====================================================
       ATUALIZAÇÃO PERIÓDICA

       Preserva o intervalo configurado
       para a Tabela de Preços.
    ===================================================== */

    refetchInterval: TABELA_PRECOS.REFRESH_INTERVAL,

    /* =====================================================
       REDE E TENTATIVAS
    ===================================================== */

    networkMode: "online",

    retry: 1,
  });
}
