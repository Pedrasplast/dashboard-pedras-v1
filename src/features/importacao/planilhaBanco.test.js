import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  formatarData,
  formatarDataHora,
  formatarDuracao,
  parseNumero,
  prepararRegistros,
} from "./planilhaBanco";

// Monta um .xlsx em memória, como o FileReader entregaria.
function criarPlanilha(abas, bookType = "xlsx") {
  const workbook = XLSX.utils.book_new();

  for (const [nome, linhas] of Object.entries(abas)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(linhas), nome);
  }

  return new Uint8Array(XLSX.write(workbook, { type: "array", bookType }));
}

// 46293 = 28/09/2026 no Excel; 0,5 dia = 12:00.
const SERIAL_28_09_2026 = 46293;

describe("conversões de célula", () => {
  it("lê números no formato brasileiro e internacional", () => {
    expect(parseNumero("1.234,56")).toBe(1234.56);
    expect(parseNumero("12,5")).toBe(12.5);
    expect(parseNumero(" 3 ")).toBe(3);
    expect(parseNumero("abc")).toBe(0);
    expect(parseNumero("")).toBe(0);
  });

  it("converte datas do Excel, de texto e inválidas", () => {
    expect(formatarData(SERIAL_28_09_2026)).toBe("2026-09-28");
    expect(formatarData("05/10/2026")).toBe("2026-10-05");
    expect(formatarData("2026-10-05 08:30")).toBe("2026-10-05");
    expect(formatarData("ontem")).toBeNull();
    expect(formatarData("")).toBeNull();
  });

  it("monta data e hora no fuso de Brasília", () => {
    expect(formatarDataHora(SERIAL_28_09_2026 + 0.5)).toBe("2026-09-28T12:00:00-03:00");
    expect(formatarDataHora("05/10/2026 08:30")).toBe("2026-10-05T08:30:00-03:00");
  });

  it("formata durações de fração de dia e de texto", () => {
    expect(formatarDuracao(1 / 24 + 30 / 1440)).toBe("01:30:00");
    expect(formatarDuracao("2:05")).toBe("02:05:00");
    expect(formatarDuracao("26:00:10")).toBe("26:00:10");
    expect(formatarDuracao("0,5")).toBe("12:00:00");
    // Texto que não é duração vai como está, só sem espaços.
    expect(formatarDuracao("sem tempo")).toBe("semtempo");
  });
});

describe("prepararRegistros", () => {
  it("lê só a aba Banco (sem diferenciar maiúsculas) e usa os nomes alternativos de coluna", () => {
    const conteudo = criarPlanilha({
      Resumo: [["Injetora"], ["NÃO IMPORTAR"]],
      " BANCO ": [
        ["Cod Prod", "Injetora", "Inicio", "Duracao", "Pecas", "Peso", "MP"],
        ["  PRD-1 ", "INJ 01", SERIAL_28_09_2026 + 0.25, "1:30", "120,9", "1.234,5", "PP"],
      ],
    });

    const { nomeAbaEncontrada, registrosValidos } = prepararRegistros(conteudo, "carga_maquina");

    expect(nomeAbaEncontrada).toBe(" BANCO ");
    expect(registrosValidos).toHaveLength(1);
    expect(registrosValidos[0]).toMatchObject({
      cod_prod: "PRD-1",
      injetora: "INJ 01",
      inicio: "2026-09-28T06:00:00-03:00",
      duracao: "01:30:00",
      pecas: 120,
      peso: 1234.5,
      mp: "PP",
    });
  });

  it("guarda a linha do Excel sem enviá-la ao banco", () => {
    const conteudo = criarPlanilha({
      Banco: [["Injetora"], [""], ["INJ 02"]],
    });

    const [registro] = prepararRegistros(conteudo, "carga_maquina").registrosValidos;

    expect(registro.__linhaExcel).toBe(3);
    expect(Object.keys(registro)).not.toContain("__linhaExcel");
  });

  it("descarta linhas sem nenhum campo de identificação", () => {
    const conteudo = criarPlanilha({
      Banco: [
        ["Injetora", "Status", "Operador"],
        ["", "", "Só operador"],
        ["", "Parada", ""],
      ],
    });

    const { registrosValidos } = prepararRegistros(conteudo, "carga_maquina");

    expect(registrosValidos.map((registro) => registro.status)).toEqual(["Parada"]);
  });

  it("monta os registros de ciclo da injetora", () => {
    const conteudo = criarPlanilha({
      Banco: [
        ["Injetora", "Data", "Cód. Produto", "Cavidade", "Ciclo", "Kg/Un"],
        ["INJ 03", "28/09/2026", "P-9", "4,7", "0:45", "0,125"],
      ],
    });

    const [registro] = prepararRegistros(conteudo, "ciclo_injetora").registrosValidos;

    expect(registro).toMatchObject({
      injetora: "INJ 03",
      data: "2026-09-28",
      cod_produto: "P-9",
      cavidade_molde: 4,
      ciclo: "00:45:00",
      kg_un: 0.125,
    });
  });

  it("lê arquivos .xls (formato antigo do Excel)", () => {
    const conteudo = criarPlanilha({ Banco: [["Injetora"], ["INJ 04"]] }, "biff8");

    expect(prepararRegistros(conteudo, "carga_maquina").registrosValidos[0].injetora).toBe(
      "INJ 04",
    );
  });

  it("mantém o número serial em células com formato de data (SheetJS 0.20)", () => {
    const aba = XLSX.utils.aoa_to_sheet([
      ["Injetora", "Inicio"],
      ["INJ 05", SERIAL_28_09_2026],
    ]);
    aba.B2.z = "dd/mm/yyyy";

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, aba, "Banco");
    const conteudo = new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" }));

    const [registro] = prepararRegistros(conteudo, "carga_maquina").registrosValidos;

    expect(registro.inicio).toBe("2026-09-28T00:00:00-03:00");
  });

  it("explica quando a aba Banco não existe ou não tem registros", () => {
    expect(() =>
      prepararRegistros(criarPlanilha({ Dados: [["x"], [1]] }), "carga_maquina"),
    ).toThrow('A aba "Banco" não foi encontrada. Abas existentes: "Dados".');

    expect(() =>
      prepararRegistros(criarPlanilha({ Banco: [["Operador"], ["Ana"]] }), "carga_maquina"),
    ).toThrow("A aba Banco não contém registros válidos para importação.");
  });
});
