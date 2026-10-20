import { describe, expect, it } from "vitest";

import { obterProximaSincronizacaoPedidos } from "./proximaSincronizacao";
import { INTERVALO_LEITURA_SUPABASE, INTERVALO_NOTIFICACOES } from "../constants/pedidos.constants";

// Datas em horário local (sem "Z"), como a função usa getHours/getDay locais.
const d = (texto) => new Date(texto);
const hhmm = (data) =>
  `${data.getDate()} ${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;

describe("próxima sincronização de pedidos (cron a cada 15 min, seg–sex 07:00–17:45)", () => {
  it("dentro do expediente: próximo quarto de hora", () => {
    // 20/10/2026 é terça-feira
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-20T11:40:12")))).toBe("20 11:45");
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-20T11:45:00")))).toBe("20 12:00");
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-20T07:00:30")))).toBe("20 07:15");
  });

  it("antes das 07:00 em dia útil: 07:00 do mesmo dia", () => {
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-20T05:12:00")))).toBe("20 07:00");
  });

  it("depois da última rodada (17:45): 07:00 do próximo dia útil", () => {
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-20T17:50:00")))).toBe("21 07:00");
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-20T17:45:00")))).toBe("21 07:00");
  });

  it("sexta à noite e fim de semana: segunda às 07:00", () => {
    // 23/10/2026 sexta, 24 sábado, 25 domingo, 26 segunda
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-23T18:30:00")))).toBe("26 07:00");
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-24T10:00:00")))).toBe("26 07:00");
    expect(hhmm(obterProximaSincronizacaoPedidos(d("2026-10-25T23:59:00")))).toBe("26 07:00");
  });
});

describe("intervalos da tela de Pedidos", () => {
  it("leitura e notificações a cada 5 minutos ou mais (tempo real cobre o resto)", () => {
    expect(INTERVALO_LEITURA_SUPABASE).toBeGreaterThanOrEqual(5 * 60 * 1000);
    expect(INTERVALO_NOTIFICACOES).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });
});
