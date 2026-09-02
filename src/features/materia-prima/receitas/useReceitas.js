import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarReceitas,
  salvarReceita as salvarReceitaService,
} from "./receitasService";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function compararCodigos(
  codigoA,
  codigoB,
) {
  return String(
    codigoA ?? "",
  ).localeCompare(
    String(
      codigoB ?? "",
    ),
    "pt-BR",
    {
      numeric: true,
      sensitivity: "base",
    },
  );
}


function montarItemComFornecedor(
  item,
  fornecedores,
) {
  const fornecedor =
    fornecedores.find(
      (
        registro,
      ) =>
        String(
          registro
            ?.id,
        ) ===
        String(
          item
            ?.fornecedorId,
        ),
    );


  return {
    ...item,

    fornecedorNome:
      fornecedor
        ?.nome ??
      "Fornecedor não encontrado",

    fornecedorAtivo:
      fornecedor
        ?.ativo !==
      false,
  };
}


/* =========================================================
   HOOK RECEITAS
========================================================= */

export default function useReceitas({
  carregar = true,
} = {}) {
  const [
    receitas,
    setReceitas,
  ] = useState([]);

  const [
    fornecedores,
    setFornecedores,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    carregado,
    setCarregado,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    salvandoCodigo,
    setSalvandoCodigo,
  ] = useState(null);


  /* =======================================================
     CARREGAR RECEITAS
  ======================================================= */

  const carregarReceitas =
    useCallback(
      async () => {
        setCarregando(
          true,
        );

        setErro(
          "",
        );


        try {
          const resultado =
            await buscarReceitas();


          setReceitas(
            Array.isArray(
              resultado
                ?.receitas,
            )
              ? resultado
                  .receitas
              : [],
          );


          setFornecedores(
            Array.isArray(
              resultado
                ?.fornecedores,
            )
              ? resultado
                  .fornecedores
              : [],
          );


          setCarregado(
            true,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar receitas de PP:",
            error,
          );


          setReceitas(
            [],
          );

          setFornecedores(
            [],
          );

          setErro(
            "Não foi possível carregar as receitas de PP.",
          );

          setCarregado(
            true,
          );
        } finally {
          setCarregando(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     CARREGAMENTO AUTOMÁTICO
  ======================================================= */

  useEffect(
    () => {
      if (
        !carregar ||
        carregado ||
        carregando
      ) {
        return;
      }


      void carregarReceitas();
    },
    [
      carregar,
      carregado,
      carregando,
      carregarReceitas,
    ],
  );


  /* =======================================================
     RECARREGAR
  ======================================================= */

  const recarregar =
    useCallback(
      async () => {
        await carregarReceitas();
      },
      [
        carregarReceitas,
      ],
    );


  /* =======================================================
     SALVAR RECEITA
  ======================================================= */

  const salvarReceita =
    useCallback(
      async ({
        codigoProduto,
        itens,
      }) => {
        const codigo =
          String(
            codigoProduto ??
              "",
          ).trim();


        if (!codigo) {
          throw new Error(
            "Código do produto não informado.",
          );
        }


        setSalvandoCodigo(
          codigo,
        );


        try {
          const resultado =
            await salvarReceitaService({
              codigoProduto:
                codigo,

              itens,
            });


          const itensComFornecedores =
            (
              Array.isArray(
                resultado
                  ?.itens,
              )
                ? resultado
                    .itens
                : []
            )
              .map(
                (
                  item,
                ) =>
                  montarItemComFornecedor(
                    item,
                    fornecedores,
                  ),
              )
              .sort(
                (
                  itemA,
                  itemB,
                ) =>
                  String(
                    itemA
                      ?.fornecedorNome ??
                      "",
                  ).localeCompare(
                    String(
                      itemB
                        ?.fornecedorNome ??
                        "",
                    ),
                    "pt-BR",
                    {
                      sensitivity:
                        "base",
                    },
                  ),
              );


          setReceitas(
            (
              receitasAtuais,
            ) =>
              receitasAtuais
                .map(
                  (
                    receita,
                  ) => {
                    if (
                      String(
                        receita
                          ?.codigo ??
                          "",
                      ) !==
                      codigo
                    ) {
                      return receita;
                    }


                    return {
                      ...receita,

                      itens:
                        itensComFornecedores,

                      quantidadeFornecedores:
                        itensComFornecedores
                          .length,

                      percentualTotal:
                        resultado
                          ?.percentualTotal ??
                        100,

                      configurada:
                        true,

                      possuiItens:
                        itensComFornecedores
                          .length >
                        0,
                    };
                  },
                )
                .sort(
                  (
                    receitaA,
                    receitaB,
                  ) =>
                    compararCodigos(
                      receitaA
                        ?.codigo,
                      receitaB
                        ?.codigo,
                    ),
                ),
          );


          return resultado;
        } catch (error) {
          console.error(
            `Erro ao salvar receita PP do produto ${codigo}:`,
            error,
          );


          throw error;
        } finally {
          setSalvandoCodigo(
            null,
          );
        }
      },
      [
        fornecedores,
      ],
    );


  /* =======================================================
     RECEITA ESTÁ SENDO SALVA?
  ======================================================= */

  const receitaEstaSalvando =
    useCallback(
      (
        codigoProduto,
      ) =>
        String(
          codigoProduto ??
            "",
        ) ===
        String(
          salvandoCodigo ??
            "",
        ) &&
        Boolean(
          salvandoCodigo,
        ),
      [
        salvandoCodigo,
      ],
    );


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    receitas,

    fornecedores,

    carregando,

    carregado,

    erro,

    salvandoCodigo,

    recarregar,

    salvarReceita,

    receitaEstaSalvando,
  };
}