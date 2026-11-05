import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import EstadoTela from "./EstadoTela";
import FiltroSelect from "./FiltroSelect";
import Spinner from "./Spinner";

describe("EstadoTela", () => {
  it("mostra o spinner e o título enquanto carrega", () => {
    const html = renderToStaticMarkup(<EstadoTela tipo="carregando" titulo="Carregando compras" />);

    expect(html).toContain('class="estado-tela"');
    expect(html).toContain('role="status"');
    expect(html).toContain('class="spinner"');
    expect(html).toContain("<strong>Carregando compras</strong>");
    expect(html).not.toContain("<p>");
  });

  it("marca o erro e mostra a mensagem", () => {
    const html = renderToStaticMarkup(
      <EstadoTela tipo="erro" titulo="Erro ao carregar" texto="Sem conexão" />,
    );

    expect(html).toContain('class="estado-tela estado-tela--erro"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("<p>Sem conexão</p>");
  });

  it("usa o ícone informado no estado vazio", () => {
    const html = renderToStaticMarkup(
      <EstadoTela icone={<i data-icone="vazio" />} titulo="Nada aqui" />,
    );

    expect(html).toContain('data-icone="vazio"');
    expect(html).not.toContain("role=");
  });
});

describe("FiltroSelect", () => {
  it("põe a opção Todos primeiro e aceita objetos ou textos", () => {
    const html = renderToStaticMarkup(
      <FiltroSelect
        rotulo="Fornecedor"
        textoTodos="Todos os fornecedores"
        valor="TODOS"
        opcoes={[{ id: "7", nome: "Braskem" }, "Outro"]}
        onChange={() => {}}
      />,
    );

    expect(html).toMatch(
      /<option value="TODOS"[^>]*>Todos os fornecedores<\/option><option value="7">Braskem<\/option><option value="Outro">Outro<\/option>/,
    );
  });
});

describe("Spinner", () => {
  it("é decorativo para leitores de tela", () => {
    expect(renderToStaticMarkup(<Spinner />)).toBe(
      '<span class="spinner" aria-hidden="true"></span>',
    );
  });
});
