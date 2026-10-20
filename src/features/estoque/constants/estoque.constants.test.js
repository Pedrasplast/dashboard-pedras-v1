import { describe, expect, it } from "vitest";

import { INTERVALO_ATUALIZACAO_ESTOQUE, STALE_TIME_ESTOQUE } from "./estoque.constants";

/*
 * Protege contra a volta do polling agressivo: o estoque é
 * sincronizado com o Omie a cada 15 minutos, então recarregar
 * a tela em menos de 5 minutos só gera egress sem dado novo.
 */
describe("intervalos da tela de Estoque", () => {
  it("atualização automática a cada 5 minutos ou mais", () => {
    expect(INTERVALO_ATUALIZACAO_ESTOQUE).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });

  it("dado considerado fresco por pelo menos 2 minutos", () => {
    expect(STALE_TIME_ESTOQUE).toBeGreaterThanOrEqual(2 * 60 * 1000);
  });
});
