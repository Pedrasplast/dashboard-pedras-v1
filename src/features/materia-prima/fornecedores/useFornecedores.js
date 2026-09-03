import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarFornecedores,
  salvarFornecedor as salvarFornecedorService,
} from "./fornecedoresService";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function compararNomes(
  nomeA,
  nomeB,
) {
  return String(
    nomeA ?? "",
  ).localeCompare(
    String(
      nomeB ?? "",
    ),
    "pt-BR",
    {
      sensitivity: "base",
    },
  );
}


/* =========================================================
   HOOK FORNECEDORES
========================================================= */

export default function useFornecedores({
  carregar = true,
} = {}) {
  const [
    fornecedores,
    setFornecedores,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    carregado,
    setCarregado,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    salvandoId,
    setSalvandoId,
  ] = useState(null);


  /* =======================================================
     CARREGAR FORNECEDORES
  ======================================================= */

  const carregarFornecedores =
    useCallback(
      async () => {
        setCarregando(
          true,
        );

        setErro(
          "",
        );


        try {
          const lista =
            await buscarFornecedores();


          setFornecedores(
            Array.isArray(
              lista,
            )
              ? lista
              : [],
          );


          setCarregado(
            true,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar fornecedores de PP:",
            error,
          );


          setFornecedores(
            [],
          );


          setErro(
            "Não foi possível carregar os fornecedores de PP.",
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


      void carregarFornecedores();
    },
    [
      carregar,
      carregado,
      carregando,
      carregarFornecedores,
    ],
  );


  /* =======================================================
     RECARREGAR
  ======================================================= */

  const recarregar =
    useCallback(
      async () => {
        await carregarFornecedores();
      },
      [
        carregarFornecedores,
      ],
    );


  /* =======================================================
     SALVAR FORNECEDOR
  ======================================================= */

  const salvarFornecedor =
    useCallback(
      async ({
        id = null,
        nome,
        ativo = true,
        estoqueMinimoKg = null,
        estoqueAlvoKg = null,
        leadTimeDias = null,
      }) => {
        const idFornecedor =
          id !== null &&
          id !== undefined
            ? id
            : null;


        setSalvando(
          true,
        );

        setSalvandoId(
          idFornecedor,
        );


        try {
          const fornecedorSalvo =
            await salvarFornecedorService({
              id:
                idFornecedor,

              nome,

              ativo,

              estoqueMinimoKg,

              estoqueAlvoKg,

              leadTimeDias,
            });


          /* =================================================
             ATUALIZAR LISTA LOCAL
          ================================================= */

          setFornecedores(
            (
              fornecedoresAtuais,
            ) => {
              const fornecedorJaExiste =
                fornecedoresAtuais.some(
                  (
                    fornecedor,
                  ) =>
                    String(
                      fornecedor
                        ?.id,
                    ) ===
                    String(
                      fornecedorSalvo
                        ?.id,
                    ),
                );


              let novaLista;


              if (
                fornecedorJaExiste
              ) {
                novaLista =
                  fornecedoresAtuais.map(
                    (
                      fornecedor,
                    ) => {
                      if (
                        String(
                          fornecedor
                            ?.id,
                        ) !==
                        String(
                          fornecedorSalvo
                            ?.id,
                        )
                      ) {
                        return fornecedor;
                      }


                      return fornecedorSalvo;
                    },
                  );
              } else {
                novaLista = [
                  ...fornecedoresAtuais,
                  fornecedorSalvo,
                ];
              }


              return novaLista.sort(
                (
                  fornecedorA,
                  fornecedorB,
                ) =>
                  compararNomes(
                    fornecedorA
                      ?.nome,
                    fornecedorB
                      ?.nome,
                  ),
              );
            },
          );


          return fornecedorSalvo;
        } catch (error) {
          console.error(
            "Erro ao salvar fornecedor de PP:",
            error,
          );


          throw error;
        } finally {
          setSalvando(
            false,
          );

          setSalvandoId(
            null,
          );
        }
      },
      [],
    );


  /* =======================================================
     VERIFICAR SE FORNECEDOR ESTÁ SENDO SALVO
  ======================================================= */

  const fornecedorEstaSalvando =
    useCallback(
      (
        idFornecedor,
      ) => {
        if (
          !salvando
        ) {
          return false;
        }


        if (
          idFornecedor ===
            null ||
          idFornecedor ===
            undefined
        ) {
          return (
            salvandoId ===
            null
          );
        }


        return (
          String(
            idFornecedor,
          ) ===
          String(
            salvandoId,
          )
        );
      },
      [
        salvando,
        salvandoId,
      ],
    );


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    fornecedores,

    carregando,

    erro,

    carregado,

    salvando,

    salvandoId,

    recarregar,

    salvarFornecedor,

    fornecedorEstaSalvando,
  };
}