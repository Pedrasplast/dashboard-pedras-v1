import * as XLSX from "xlsx";
import { formatISO, isValid, parse } from "date-fns";

/* =========================================================
   LEITURA DA ABA "BANCO" DA PLANILHA DE IMPORTAÇÃO

   Funções puras: recebem o conteúdo do arquivo e devolvem os
   registros prontos para o Supabase (carga_maquina ou
   ciclo_injetora). Usadas na prévia e na importação.
========================================================= */

const NOME_ABA_IMPORTACAO = "banco";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function limparTexto(valor) {
  return String(valor ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarCabecalho(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function parseNumero(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  let texto = String(valor).trim().replace(/\s/g, "");

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else {
    texto = texto.replace(",", ".");
  }

  const resultado = Number.parseFloat(texto);

  return Number.isFinite(resultado) ? resultado : 0;
}

/* =========================================================
   DATA
========================================================= */

export function formatarData(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Número serial do Excel.
  if (typeof valor === "number") {
    const dataExcel = XLSX.SSF.parse_date_code(valor);

    if (!dataExcel) {
      return null;
    }

    const ano = String(dataExcel.y).padStart(4, "0");
    const mes = String(dataExcel.m).padStart(2, "0");
    const dia = String(dataExcel.d).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  // Objeto Date.
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return null;
    }

    return formatISO(valor, {
      representation: "date",
    });
  }

  // Data em texto.
  if (typeof valor === "string") {
    const texto = valor.trim();

    if (!texto) {
      return null;
    }

    const formatosPossiveis = [
      "dd/MM/yyyy HH:mm:ss",
      "dd/MM/yyyy HH:mm",
      "dd/MM/yyyy",
      "yyyy-MM-dd HH:mm:ss",
      "yyyy-MM-dd HH:mm",
      "yyyy-MM-dd",
    ];

    for (const formato of formatosPossiveis) {
      const dataConvertida = parse(texto, formato, new Date());

      if (isValid(dataConvertida)) {
        return formatISO(dataConvertida, {
          representation: "date",
        });
      }
    }
  }

  return null;
}

/* =========================================================
   DATA E HORA
========================================================= */

export function formatarDataHora(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const montarTimestamp = (ano, mes, dia, hora = 0, minuto = 0, segundo = 0) => {
    const anoFormatado = String(ano).padStart(4, "0");
    const mesFormatado = String(mes).padStart(2, "0");
    const diaFormatado = String(dia).padStart(2, "0");

    const horaFormatada = String(hora).padStart(2, "0");
    const minutoFormatado = String(minuto).padStart(2, "0");
    const segundoFormatado = String(Math.floor(segundo)).padStart(2, "0");

    return (
      `${anoFormatado}-${mesFormatado}-${diaFormatado}` +
      `T${horaFormatada}:${minutoFormatado}:${segundoFormatado}-03:00`
    );
  };

  // Número serial do Excel.
  if (typeof valor === "number") {
    const dataExcel = XLSX.SSF.parse_date_code(valor);

    if (!dataExcel) {
      return null;
    }

    return montarTimestamp(
      dataExcel.y,
      dataExcel.m,
      dataExcel.d,
      dataExcel.H || 0,
      dataExcel.M || 0,
      dataExcel.S || 0,
    );
  }

  // Objeto Date.
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return null;
    }

    return montarTimestamp(
      valor.getFullYear(),
      valor.getMonth() + 1,
      valor.getDate(),
      valor.getHours(),
      valor.getMinutes(),
      valor.getSeconds(),
    );
  }

  // Data e hora em texto.
  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  const formatosPossiveis = [
    "dd/MM/yyyy HH:mm:ss",
    "dd/MM/yyyy HH:mm",
    "dd/MM/yyyy",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd HH:mm",
    "yyyy-MM-dd",
  ];

  for (const formato of formatosPossiveis) {
    const dataConvertida = parse(texto, formato, new Date());

    if (isValid(dataConvertida)) {
      return montarTimestamp(
        dataConvertida.getFullYear(),
        dataConvertida.getMonth() + 1,
        dataConvertida.getDate(),
        dataConvertida.getHours(),
        dataConvertida.getMinutes(),
        dataConvertida.getSeconds(),
      );
    }
  }

  return null;
}

/* =========================================================
   DURAÇÃO
========================================================= */

export function formatarDuracao(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  let totalSegundos = null;

  // Excel armazena duração como fração de um dia.
  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) {
      return "";
    }

    totalSegundos = Math.round(valor * 24 * 60 * 60);
  }

  // Objeto Date.
  else if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return "";
    }

    const baseExcelUTC = Date.UTC(1899, 11, 30, 0, 0, 0);

    const valorUTC = Date.UTC(
      valor.getUTCFullYear(),
      valor.getUTCMonth(),
      valor.getUTCDate(),
      valor.getUTCHours(),
      valor.getUTCMinutes(),
      valor.getUTCSeconds(),
    );

    totalSegundos = Math.round((valorUTC - baseExcelUTC) / 1000);

    if (!Number.isFinite(totalSegundos) || totalSegundos < 0) {
      totalSegundos =
        valor.getUTCHours() * 3600 + valor.getUTCMinutes() * 60 + valor.getUTCSeconds();
    }
  }

  // Texto.
  else {
    const texto = String(valor).trim().replace(/\s+/g, "");

    if (!texto) {
      return "";
    }

    const resultado = texto.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);

    if (!resultado) {
      const numeroConvertido = Number(texto.replace(",", "."));

      if (Number.isFinite(numeroConvertido)) {
        totalSegundos = Math.round(numeroConvertido * 24 * 60 * 60);
      } else {
        return texto;
      }
    } else {
      const horas = Number(resultado[1]);
      const minutos = Number(resultado[2]);
      const segundos = Number(resultado[3] || 0);

      totalSegundos = horas * 3600 + minutos * 60 + segundos;
    }
  }

  if (totalSegundos === null || !Number.isFinite(totalSegundos)) {
    return "";
  }

  totalSegundos = Math.max(0, Math.round(totalSegundos));

  const horas = Math.floor(totalSegundos / 3600);

  const minutos = Math.floor((totalSegundos % 3600) / 60);

  const segundos = totalSegundos % 60;

  return [
    String(horas).padStart(2, "0"),
    String(minutos).padStart(2, "0"),
    String(segundos).padStart(2, "0"),
  ].join(":");
}

/* =========================================================
   LER A ABA BANCO

   Usado tanto na prévia quanto na importação.
========================================================= */

export function lerAbaBanco(conteudo) {
  const workbook = XLSX.read(conteudo, {
    type: "array",
    cellDates: false,
    cellNF: true,
    cellText: true,
  });

  const nomeAbaEncontrada = workbook.SheetNames.find(
    (nomeAba) => nomeAba.trim().toLowerCase() === NOME_ABA_IMPORTACAO,
  );

  if (!nomeAbaEncontrada) {
    const abasEncontradas = workbook.SheetNames.map((nome) => `"${nome}"`).join(", ");

    throw new Error(
      `A aba "Banco" não foi encontrada. Abas existentes: ${abasEncontradas || "nenhuma"}.`,
    );
  }

  const sheet = workbook.Sheets[nomeAbaEncontrada];

  if (!sheet) {
    throw new Error("Não foi possível acessar a aba Banco.");
  }

  // A partir da 0.20, o sheet_to_json converte sozinho em Date toda célula com formato de data
  // (inclusive textos e vazias). As funções acima esperam o valor cru, como o Excel guarda
  // (número serial para datas), então o formato é descartado antes da leitura.
  for (const endereco of Object.keys(sheet)) {
    if (endereco[0] !== "!") {
      delete sheet[endereco].z;
    }
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: true,
  });

  if (rows.length === 0) {
    throw new Error("A aba Banco está vazia.");
  }

  return {
    nomeAbaEncontrada,
    rows,
  };
}

/* =========================================================
   IDENTIFICAR COLUNAS DA PLANILHA
========================================================= */

function criarLeitorDeLinha(linha) {
  const chavesDaLinha = Object.keys(linha).map((chave) => ({
    chave,
    normalizada: normalizarCabecalho(chave),
  }));

  return function getVal(chavesPossiveis) {
    const aliases = new Set(chavesPossiveis.map(normalizarCabecalho));

    const itemEncontrado = chavesDaLinha.find((item) => aliases.has(item.normalizada));

    return itemEncontrado ? linha[itemEncontrado.chave] : "";
  };
}

/* =========================================================
   FORMATAR REGISTRO

   Mantém os campos e os aliases do importador atual.
========================================================= */

export function formatarRegistro(linha, indice, tabelaDestino) {
  const getVal = criarLeitorDeLinha(linha);
  const linhaExcel = indice + 2;

  /* =====================================================
     CICLO INJETORA
  ===================================================== */

  if (tabelaDestino === "ciclo_injetora") {
    const registroCiclo = {
      injetora: limparTexto(getVal(["Injetora"])),

      data: formatarData(getVal(["Data"])),

      cod_produto: limparTexto(
        getVal(["Cód. Produto", "Cod. Produto", "Cod Produto", "Codigo Produto"]),
      ),

      descricao: limparTexto(getVal(["Descrição", "Descricao"])),

      cavidade_molde: Math.trunc(parseNumero(getVal(["Cavidade Molde", "Cavidade"]))),

      tempo_resfriamento: formatarDuracao(getVal(["Tempo de Resfriamento", "Resfriamento"])),

      ciclo: formatarDuracao(getVal(["Ciclo"])),

      tempo_injecao: formatarDuracao(getVal(["Tempo de Injeção", "Tempo Injecao"])),

      kg_un: parseNumero(getVal(["Kg UN", "KG UN", "Kg/Un"])),

      kg_haste: parseNumero(getVal(["Kg HASTE", "KG HASTE", "Kg/Haste"])),

      observacao: limparTexto(getVal(["Observação", "Observacao", "Obs"])),
    };

    Object.defineProperty(registroCiclo, "__linhaExcel", {
      value: linhaExcel,
      enumerable: false,
    });

    return registroCiclo;
  }

  /* =====================================================
     CARGA MÁQUINA
  ===================================================== */

  const registro = {
    cod_prod: limparTexto(
      getVal(["Cód.Prod", "Cod. Prod", "Cod Prod", "Cód. Produto", "Cod_Prod"]),
    ),

    injetora: limparTexto(getVal(["Injetora"])),

    inicio: formatarDataHora(getVal(["Início", "Inicio"])),

    fim: formatarDataHora(getVal(["Fim", "Término", "Termino"])),

    duracao: formatarDuracao(getVal(["Duração", "Duracao"])),

    op: limparTexto(getVal(["OP", "Ordem", "Ordem Producao"])),

    tipo: limparTexto(getVal(["Tipo"])),

    motivo: limparTexto(getVal(["Motivo"])),

    justificativa: limparTexto(getVal(["Justificativa"])),

    celula: limparTexto(getVal(["Célula", "Celula"])),

    operador: limparTexto(getVal(["Operador"])),

    material: limparTexto(getVal(["Material"])),

    qtde_perdida_devido_pausa: parseNumero(
      getVal(["Qtde perdida devido pausa", "Qtde Perdida Devido Pausa"]),
    ),

    cliente: limparTexto(getVal(["Cliente"])),

    status: limparTexto(getVal(["Status"])),

    lista_de_data: formatarData(getVal(["ListaDeData", "Lista De Data", "Lista de Data"])),

    inicio_dia: formatarDataHora(getVal(["InicioDia", "Início Dia", "InícioDia"])),

    fim_dia: formatarDataHora(getVal(["FimDia", "Fim Dia"])),

    tempo: formatarDuracao(getVal(["Tempo"])),

    conforme: Math.trunc(parseNumero(getVal(["Conforme"]))),

    danificada: Math.trunc(parseNumero(getVal(["Danificada"]))),

    mp: limparTexto(getVal(["M.P", "MP"])),

    pecas: Math.trunc(parseNumero(getVal(["Peças", "Pecas"]))),

    no_injetora: limparTexto(getVal(["№ Injetora", "No Injetor", "Nº Injetora"])),

    peso: parseNumero(getVal(["Peso"])),

    consumido: parseNumero(getVal(["Consumido"])),
  };

  Object.defineProperty(registro, "__linhaExcel", {
    value: linhaExcel,
    enumerable: false,
  });

  return registro;
}

/* =========================================================
   VERIFICAR REGISTROS ELEGÍVEIS

   MESMA REGRA PARA PRÉVIA E IMPORTAÇÃO.
========================================================= */

export function registroElegivel(registro, tabelaDestino) {
  if (tabelaDestino === "ciclo_injetora") {
    return Boolean(registro.injetora || registro.data || registro.cod_produto);
  }

  return Boolean(registro.injetora || registro.cod_prod || registro.status || registro.motivo);
}

/* =========================================================
   PREPARAR REGISTROS

   A contagem é feita com base no mesmo conjunto
   de dados que será enviado ao Supabase.
========================================================= */

export function prepararRegistros(conteudo, tabelaDestino) {
  const { nomeAbaEncontrada, rows } = lerAbaBanco(conteudo);

  const dadosFormatados = rows.map((linha, indice) =>
    formatarRegistro(linha, indice, tabelaDestino),
  );

  const registrosValidos = dadosFormatados.filter((registro) =>
    registroElegivel(registro, tabelaDestino),
  );

  if (registrosValidos.length === 0) {
    throw new Error("A aba Banco não contém registros válidos para importação.");
  }

  return {
    nomeAbaEncontrada,
    registrosValidos,
  };
}
