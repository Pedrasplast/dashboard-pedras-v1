import { RefreshCw, Search, Plus, Boxes, Truck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Paginacao from "@/components/paginacao/Paginacao";

export default function CadastroEstrutura({
  titulo,
  descricao,
  tipo,
  pesquisa,
  onPesquisa,
  carregando,
  atualizando,
  recarregar,
  mensagemSucesso,
  erro,
  erroExtra,
  cards,
  novo,
  textoNovo,
  registros,
  pagina,
  onPagina,
  filhos,
}) {
  return (
    <main className="cadastros-page">
      <div className="cadastros-container">
        <PageHeader
          eyebrow="Cadastro"
          title={titulo}
          description={descricao}
          icon={tipo === "fornecedores" ? Truck : Boxes}
          className="cadastros-header"
          actions={
            <div className="cadastros-header-actions">
              <button
                type="button"
                className="cadastros-atualizar"
                onClick={() => void recarregar()}
                disabled={atualizando}
              >
                <RefreshCw size={17} className={atualizando ? "girando" : ""} />
                {atualizando ? "Atualizando..." : "Atualizar"}
              </button>
            </div>
          }
        />
        <section className={`cadastros-resumo cadastros-resumo--${tipo}`}>{cards}</section>
        {mensagemSucesso && <div className="cadastros-sucesso">{mensagemSucesso}</div>}
        <section className="cadastros-conteudo">
          <div className="cadastros-toolbar">
            <div className="cadastros-pesquisa">
              <Search size={18} />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => onPesquisa(e.target.value)}
                placeholder={
                  tipo === "produtos"
                    ? "Buscar código ou produto..."
                    : tipo === "fornecedores"
                      ? "Buscar fornecedor..."
                      : "Buscar material..."
                }
              />
            </div>
            <button type="button" className="cadastros-botao-primario" onClick={novo}>
              <Plus size={17} />
              {textoNovo}
            </button>
          </div>
          {erro && (
            <div className="cadastros-erro" role="alert">
              {erro}
            </div>
          )}
          {erroExtra && (
            <div className="cadastros-erro" role="status">
              {erroExtra}
            </div>
          )}
          {filhos}
          {!carregando && registros > 8 && (
            <Paginacao
              paginaAtual={pagina}
              totalItens={registros}
              itensPorPagina={8}
              onChangePagina={onPagina}
            />
          )}
        </section>
      </div>
    </main>
  );
}
