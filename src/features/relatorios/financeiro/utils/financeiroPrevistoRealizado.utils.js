export const MESES = Object.freeze([
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" },
]);


export function obterAnoAtual() {
  return new Date().getFullYear();
}


export function obterMesAtual() {
  return new Date().getMonth() + 1;
}


export function obterNomeMes(numero) {
  return MESES.find(
    (item) => item.valor === Number(numero),
  )?.nome || "-";
}


export function colocarCabecalhoPrimeiro(
  lista,
  codigoCabecalho,
) {
  const registros = Array.isArray(lista)
    ? [...lista]
    : [];

  const indice = registros.findIndex(
    (item) =>
      String(
        item?.codigo_categoria || "",
      ).trim() === String(codigoCabecalho),
  );

  if (indice <= 0) {
    return registros;
  }

  const [cabecalho] = registros.splice(
    indice,
    1,
  );

  return [
    cabecalho,
    ...registros,
  ];
}


export function criarGruposFinanceiros(
  dados,
  tipo,
) {
  const lista = Array.isArray(dados)
    ? dados
    : [];

  const receitas = colocarCabecalhoPrimeiro(
    lista.filter(
      (item) =>
        String(
          item?.tipo_financeiro ||
          item?.tipo ||
          "",
        )
          .trim()
          .toLowerCase() === "receita",
    ),
    "1",
  );

  const despesas = colocarCabecalhoPrimeiro(
    lista.filter(
      (item) =>
        String(
          item?.tipo_financeiro ||
          item?.tipo ||
          "",
        )
          .trim()
          .toLowerCase() === "despesa",
    ),
    "2",
  );

  if (tipo === "Receita") {
    return [
      {
        chave: "receitas",
        titulo: "Receitas",
        dados: receitas,
      },
    ];
  }

  if (tipo === "Despesa") {
    return [
      {
        chave: "despesas",
        titulo: "Despesas",
        dados: despesas,
      },
    ];
  }

  return [
    {
      chave: "receitas",
      titulo: "Receitas",
      dados: receitas,
    },
    {
      chave: "despesas",
      titulo: "Despesas",
      dados: despesas,
    },
  ].filter(
    (grupo) => grupo.dados.length > 0,
  );
}


export function paginarGruposFinanceiros({
  grupos,
  inicio,
  fim,
}) {
  let indiceGlobal = 0;

  return grupos
    .map((grupo) => {
      const inicioGrupo = indiceGlobal;
      const fimGrupo =
        inicioGrupo + grupo.dados.length;

      indiceGlobal = fimGrupo;

      const inicioLocal = Math.max(
        0,
        inicio - inicioGrupo,
      );

      const fimLocal = Math.max(
        0,
        Math.min(
          grupo.dados.length,
          fim - inicioGrupo,
        ),
      );

      return {
        ...grupo,

        totalGrupo:
          grupo.dados.length,

        dados:
          grupo.dados.slice(
            inicioLocal,
            fimLocal,
          ),
      };
    })
    .filter(
      (grupo) => grupo.dados.length > 0,
    );
}