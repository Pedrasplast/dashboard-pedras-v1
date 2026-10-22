import { describe, expect, it } from "vitest";

import {
  descreverAgenda,
  situacaoDaRotina,
  mensagemErro,
  prepararRotinas,
  tempoDecorrido,
  formatarDuracao,
  formatarMegabytes,
  quantidadeAvisos,
} from "./monitoramento.utils";
import { SITUACAO } from "../constants/monitoramento.constants";

describe("descreverAgenda (agendas reais, UTC → Brasília)", () => {
  it.each([
    ["*/15 10-20 * * 1-5", "seg a sex, das 07h às 17h, a cada 15 min"],
    ["8-59/15 10-20 * * 1-5", "seg a sex, das 07h às 17h, a cada 15 min, a partir do minuto 08"],
    ["2-57/5 9-20 * * 1-5", "seg a sex, das 06h às 17h, a cada 5 min, a partir do minuto 02"],
    ["9,39 10-20 * * 1-5", "seg a sex, das 07h às 17h, a cada 30 min, a partir do minuto 09"],
    ["2 10-20 * * 1-5", "seg a sex, das 07h às 17h, de hora em hora, no minuto 02"],
    ["0,10,20,30 8,15 * * 1-5", "seg a sex, às 05h e 12h, nos minutos 00, 10, 20, 30"],
    ["30 9 * * 1-5", "seg a sex, às 06:30"],
    ["30 3 * * *", "todos os dias, às 00:30"],
    ["15 4 * * 0", "dom, às 01:15"],
    ["0 7 * * *", "todos os dias, às 04:00"],
  ])("%s", (agenda, esperado) => {
    expect(descreverAgenda(agenda)).toBe(esperado);
  });

  it("agenda fora do padrão volta como veio", () => {
    expect(descreverAgenda("@daily")).toBe("@daily");
    expect(descreverAgenda("0 0 1 * *")).toBe("0 0 1 * *");
  });
});

describe("situacaoDaRotina", () => {
  const base = { ativa: true, ultima_status_cron: "succeeded" };

  it("desativada vence tudo", () => {
    expect(situacaoDaRotina({ ...base, ativa: false, ultimo_sucesso: false, ultima_chamada: "x" }))
      .toBe(SITUACAO.DESATIVADA);
  });

  it("chamada com falha = erro (caso real: Omie ocupado)", () => {
    expect(situacaoDaRotina({ ...base, ultima_chamada: "x", ultimo_sucesso: false })).toBe(SITUACAO.ERRO);
  });

  it("chamada sem resposta ainda = rodando", () => {
    expect(situacaoDaRotina({ ...base, ultima_chamada: "x", ultimo_sucesso: null })).toBe(SITUACAO.RODANDO);
  });

  it("chamada ok = ok", () => {
    expect(situacaoDaRotina({ ...base, ultima_chamada: "x", ultimo_sucesso: true })).toBe(SITUACAO.OK);
  });

  it("rotina só de banco usa o status do cron", () => {
    expect(situacaoDaRotina(base)).toBe(SITUACAO.OK);
    expect(situacaoDaRotina({ ...base, ultima_status_cron: "failed" })).toBe(SITUACAO.ERRO);
    expect(situacaoDaRotina({ ativa: true })).toBe(SITUACAO.SEM_DADOS);
  });

  it("falha do próprio cron conta mesmo se a última chamada foi ok", () => {
    expect(situacaoDaRotina({ ...base, ultima_status_cron: "failed", ultima_chamada: "x", ultimo_sucesso: true }))
      .toBe(SITUACAO.ERRO);
  });
});

describe("mensagemErro e ordenação", () => {
  it("mostra o erro da função ou do cron", () => {
    expect(mensagemErro({ ultimo_sucesso: false, ultimo_erro: "Consumo redundante" })).toBe("Consumo redundante");
    expect(mensagemErro({ ultima_status_cron: "failed", ultimo_erro_cron: "syntax error" })).toBe("syntax error");
    expect(mensagemErro({ ultimo_sucesso: true, ultimo_erro: null })).toBeNull();
  });

  it("rotinas com erro aparecem primeiro e recebem nome amigável", () => {
    const lista = prepararRotinas([
      { rotina: "sincronizar-pedidos-omie-15min", ativa: true, ultima_chamada: "x", ultimo_sucesso: true },
      { rotina: "sincronizar-estoque-mp-matriz-30min", ativa: true, ultima_chamada: "x", ultimo_sucesso: false, ultimo_erro: "ocupado" },
      { rotina: "rotina-nova-sem-nome", ativa: false },
    ]);
    expect(lista.map((r) => r.nome)).toEqual([
      "Estoque de matéria-prima",
      "Pedidos de venda",
      "rotina-nova-sem-nome",
    ]);
    expect(lista[0].mensagem_erro).toBe("ocupado");
  });
});

describe("datas", () => {
  const agora = new Date("2026-10-22T12:00:00Z");

  it("tempo decorrido", () => {
    expect(tempoDecorrido("2026-10-22T11:59:40Z", agora)).toBe("agora há pouco");
    expect(tempoDecorrido("2026-10-22T11:45:00Z", agora)).toBe("há 15 min");
    expect(tempoDecorrido("2026-10-22T09:00:00Z", agora)).toBe("há 3 h");
    expect(tempoDecorrido("2026-10-20T12:00:00Z", agora)).toBe("há 2 dias");
    expect(tempoDecorrido(null, agora)).toBe("");
  });

  it("duração informada pela função", () => {
    expect(formatarDuracao(5860)).toBe("6 s");
    expect(formatarDuracao(72000)).toBe("1 min 12 s");
    expect(formatarDuracao(null)).toBe("—");
    expect(formatarDuracao(undefined)).toBe("—");
  });
});

describe("banco de dados e aviso do menu", () => {
  it("tamanho em MB (valor real de 22/10)", () => {
    expect(formatarMegabytes(85912723)).toBe("82 MB");
    expect(formatarMegabytes(524288000)).toBe("500 MB");
    expect(formatarMegabytes(null)).toBe("—");
  });

  it("aviso soma rotinas com erro e banco perto do limite", () => {
    expect(quantidadeAvisos({ rotinas_com_erro: 0, banco_nivel: "OK" })).toBe(0);
    expect(quantidadeAvisos({ rotinas_com_erro: 2, banco_nivel: "ATENCAO" })).toBe(2);
    expect(quantidadeAvisos({ rotinas_com_erro: 1, banco_nivel: "ALERTA" })).toBe(2);
    expect(quantidadeAvisos({ rotinas_com_erro: 0, banco_nivel: "CRITICO" })).toBe(1);
    expect(quantidadeAvisos(undefined)).toBe(0);
  });
});
