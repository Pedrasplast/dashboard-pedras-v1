import {
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  Factory,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import CadastroFornecedorModal from "./CadastroFornecedorModal";
import CadastroProdutoModal from "./CadastroProdutoModal";
import useCadastros from "./useCadastros";

import "./CadastrosPage.css";

/* =====================================================
   UTILITÁRIOS
===================================================== */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarNumero(valor, casas = 3) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

/* =====================================================
   CARD DE RESUMO
===================================================== */

function CardResumo({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
}) {
  return (
    <article className="cadastros-resumo-card">

      <div className="cadastros-resumo-card__topo">
        <span>{titulo}</span>
        <Icone size={19} />
      </div>

      <strong>{valor}</strong>

      <small>{subtitulo}</small>

    </article>
  );
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

export default function CadastrosPage() {

  /* =================================================
     ESTADOS
  ================================================= */

  const [aba, setAba] = useState("produtos");

  const [pesquisa, setPesquisa] = useState("");

  const [
    modalProdutoAberto,
    setModalProdutoAberto,
  ] = useState(false);

  const [
    produtoEdicao,
    setProdutoEdicao,
  ] = useState(null);

  const [
    modalFornecedorAberto,
    setModalFornecedorAberto,
  ] = useState(false);

  const [
    fornecedorEdicao,
    setFornecedorEdicao,
  ] = useState(null);

  const [
    mensagemSucesso,
    setMensagemSucesso,
  ] = useState("");

  /* =================================================
     DADOS DOS CADASTROS
  ================================================= */

  const {
    produtos,
    fornecedores,

    carregando,
    atualizando,

    salvandoProduto,
    salvandoFornecedor,

    erro,
    erroDescricoesEstoque,

    recarregar,

    salvarProduto,
    salvarFornecedor,

    buscarDescricaoEstoque,
  } = useCadastros();

  /* =================================================
     INDICADORES
  ================================================= */

  const resumo = useMemo(
    () => ({
      produtosAtivos: produtos.filter(
        (produto) => produto.ativo,
      ).length,

      produtosComParametros: produtos.filter(
        (produto) =>
          produto.temParametros &&
          produto.parametroAtivo,
      ).length,

      produtosSemParametros: produtos.filter(
        (produto) => !produto.temParametros,
      ).length,

      fornecedoresAtivos: fornecedores.filter(
        (fornecedor) => fornecedor.ativo,
      ).length,
    }),
    [produtos, fornecedores],
  );

  /* =================================================
     FILTRO DE PRODUTOS

     Busca pelo código ou nome cadastrado.

     O nome já foi atualizado no banco
     utilizando a descrição do estoque Omie.
  ================================================= */

  const produtosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    if (!termo) {
      return produtos;
    }

    return produtos.filter((produto) =>
      normalizarTexto(
        `${produto.codigoProduto} ${produto.nomeProduto}`,
      ).includes(termo),
    );

  }, [produtos, pesquisa]);

  /* =================================================
     FILTRO DE FORNECEDORES
  ================================================= */

  const fornecedoresFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    if (!termo) {
      return fornecedores;
    }

    return fornecedores.filter((fornecedor) =>
      normalizarTexto(
        fornecedor.nome,
      ).includes(termo),
    );

  }, [fornecedores, pesquisa]);

  /* =================================================
     NOVO PRODUTO
  ================================================= */

  function abrirNovoProduto() {
    setMensagemSucesso("");

    setProdutoEdicao(null);

    setModalProdutoAberto(true);
  }

  /* =================================================
     EDITAR PRODUTO
  ================================================= */

  function abrirEdicaoProduto(produto) {
    setMensagemSucesso("");

    setProdutoEdicao(produto);

    setModalProdutoAberto(true);
  }

  /* =================================================
     FECHAR MODAL PRODUTO
  ================================================= */

  function fecharModalProduto() {
    if (salvandoProduto) {
      return;
    }

    setModalProdutoAberto(false);

    setProdutoEdicao(null);
  }

  /* =================================================
     SALVAR PRODUTO
  ================================================= */

  async function handleSalvarProduto(dados) {
    const resultado = await salvarProduto(dados);

    setMensagemSucesso(
      resultado?.acao === "criado"
        ? "Produto cadastrado com sucesso."
        : "Produto atualizado com sucesso.",
    );

    setModalProdutoAberto(false);

    setProdutoEdicao(null);

    return resultado;
  }

  /* =================================================
     NOVO FORNECEDOR
  ================================================= */

  function abrirNovoFornecedor() {
    setMensagemSucesso("");

    setFornecedorEdicao(null);

    setModalFornecedorAberto(true);
  }

  /* =================================================
     EDITAR FORNECEDOR
  ================================================= */

  function abrirEdicaoFornecedor(fornecedor) {
    setMensagemSucesso("");

    setFornecedorEdicao(fornecedor);

    setModalFornecedorAberto(true);
  }

  /* =================================================
     FECHAR MODAL FORNECEDOR
  ================================================= */

  function fecharModalFornecedor() {
    if (salvandoFornecedor) {
      return;
    }

    setModalFornecedorAberto(false);

    setFornecedorEdicao(null);
  }

  /* =================================================
     SALVAR FORNECEDOR
  ================================================= */

  async function handleSalvarFornecedor(dados) {
    const resultado = await salvarFornecedor(dados);

    setMensagemSucesso(
      resultado?.acao === "criado"
        ? "Fornecedor cadastrado com sucesso."
        : "Fornecedor atualizado com sucesso.",
    );

    setModalFornecedorAberto(false);

    setFornecedorEdicao(null);

    return resultado;
  }

  /* =================================================
     SELECIONAR ABA
  ================================================= */

  function selecionarAba(novaAba) {
    setAba(novaAba);

    setPesquisa("");

    setMensagemSucesso("");
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <>

      <main className="cadastros-page">

        <div className="cadastros-container">

          {/* =====================================
              CABEÇALHO
          ===================================== */}

          <PageHeader
            eyebrow="Cadastro"
            title="Cadastro"
            description="Cadastro centralizado de produtos, parâmetros de produção e fornecedores utilizados pelo sistema."
            icon={ClipboardList}
            className="cadastros-header"
            actions={
              <div className="cadastros-header-actions">

                <button
                  type="button"
                  className="cadastros-atualizar"
                  onClick={() => void recarregar()}
                  disabled={atualizando}
                >

                  <RefreshCw
                    size={17}
                    className={
                      atualizando
                        ? "girando"
                        : ""
                    }
                  />

                  {atualizando
                    ? "Atualizando..."
                    : "Atualizar"}

                </button>

              </div>
            }
          />

          {/* =====================================
              INDICADORES
          ===================================== */}

          <section className="cadastros-resumo">

            <CardResumo
              titulo="Produtos ativos"
              valor={
                carregando
                  ? "-"
                  : resumo.produtosAtivos
              }
              subtitulo="Produtos cadastrados no sistema"
              icone={Boxes}
            />

            <CardResumo
              titulo="Com parâmetros"
              valor={
                carregando
                  ? "-"
                  : resumo.produtosComParametros
              }
              subtitulo="Ciclo e dados técnicos cadastrados"
              icone={Factory}
            />

            <CardResumo
              titulo="Sem parâmetros"
              valor={
                carregando
                  ? "-"
                  : resumo.produtosSemParametros
              }
              subtitulo="Produtos que precisam de dados técnicos"
              icone={CheckCircle2}
            />

            <CardResumo
              titulo="Fornecedores ativos"
              valor={
                carregando
                  ? "-"
                  : resumo.fornecedoresAtivos
              }
              subtitulo="Fornecedores disponíveis"
              icone={Truck}
            />

          </section>

          {/* =====================================
              SUCESSO
          ===================================== */}

          {mensagemSucesso && (
            <div className="cadastros-sucesso">
              {mensagemSucesso}
            </div>
          )}

          {/* =====================================
              CONTEÚDO
          ===================================== */}

          <section className="cadastros-conteudo">

            {/* ABAS */}

            <div className="cadastros-abas">

              <button
                type="button"
                className={
                  aba === "produtos"
                    ? "cadastros-aba cadastros-aba--ativa"
                    : "cadastros-aba"
                }
                onClick={() =>
                  selecionarAba("produtos")
                }
              >

                <Boxes size={17} />

                Produtos

                <span>{produtos.length}</span>

              </button>

              <button
                type="button"
                className={
                  aba === "fornecedores"
                    ? "cadastros-aba cadastros-aba--ativa"
                    : "cadastros-aba"
                }
                onClick={() =>
                  selecionarAba("fornecedores")
                }
              >

                <Truck size={17} />

                Fornecedores

                <span>{fornecedores.length}</span>

              </button>

            </div>

            {/* =====================================
                PESQUISA E NOVO CADASTRO
            ===================================== */}

            <div className="cadastros-toolbar">

              <div className="cadastros-pesquisa">

                <Search size={18} />

                <input
                  type="text"
                  value={pesquisa}
                  onChange={(evento) =>
                    setPesquisa(evento.target.value)
                  }
                  placeholder={
                    aba === "produtos"
                      ? "Buscar código ou produto..."
                      : "Buscar fornecedor..."
                  }
                />

              </div>

              {aba === "produtos" ? (

                <button
                  type="button"
                  className="cadastros-botao-primario"
                  onClick={abrirNovoProduto}
                >

                  <Plus size={17} />

                  Novo produto

                </button>

              ) : (

                <button
                  type="button"
                  className="cadastros-botao-primario"
                  onClick={abrirNovoFornecedor}
                >

                  <Plus size={17} />

                  Novo fornecedor

                </button>

              )}

            </div>

            {/* =====================================
                ERROS
            ===================================== */}

            {erro && (
              <div
                className="cadastros-erro"
                role="alert"
              >
                {erro}
              </div>
            )}

            {aba === "produtos" &&
              erroDescricoesEstoque && (
                <div
                  className="cadastros-erro"
                  role="status"
                >
                  Não foi possível consultar o estoque
                  Omie: {erroDescricoesEstoque}.
                  O cadastro permanece disponível.
                </div>
              )}

            {/* =====================================
                TABELA DE PRODUTOS

                ALTERAÇÕES:

                1. Peso duplicado removido.
                2. Mantido KG/UN.
                3. Descrição secundária removida.
                4. Exibe somente nomeProduto,
                   atualizado no banco pelo Omie.
            ===================================== */}

            {aba === "produtos" && (

              <div className="cadastros-tabela-scroll">

                <table className="cadastros-tabela">

                  {/* CABEÇALHO */}

                  <thead>
                    <tr>

                      <th>Código</th>

                      <th>Produto</th>

                      <th>PP</th>

                      <th className="numero">
                        Cavidades
                      </th>

                      <th className="numero">
                        Ciclo
                      </th>

                      <th className="numero">
                        Kg/un.
                      </th>

                      <th className="numero">
                        Kg/haste
                      </th>

                      <th>Status</th>

                      <th>Ações</th>

                    </tr>
                  </thead>

                  {/* CORPO */}

                  <tbody>

                    {carregando ? (

                      <tr>
                        <td
                          colSpan={9}
                          className="cadastros-vazio"
                        >
                          Carregando produtos...
                        </td>
                      </tr>

                    ) : produtosFiltrados.length === 0 ? (

                      <tr>
                        <td
                          colSpan={9}
                          className="cadastros-vazio"
                        >
                          Nenhum produto encontrado.
                        </td>
                      </tr>

                    ) : (

                      produtosFiltrados.map((produto) => (

                        <tr key={produto.codigoProduto}>

                          {/* CÓDIGO */}

                          <td>
                            <span className="cadastros-codigo">
                              {produto.codigoProduto}
                            </span>
                          </td>

                          {/* =================================
                              NOME DO PRODUTO

                              Exibe somente uma descrição.

                              O nome já foi atualizado
                              no banco pelo estoque Omie.
                          ================================= */}

                          <td>
                            <strong className="cadastros-produto-nome">
                              {produto.nomeProduto}
                            </strong>
                          </td>

                          {/* UTILIZA PP */}

                          <td>
                            {produto.usaPp
                              ? "Sim"
                              : "Não"}
                          </td>

                          {/* CAVIDADES */}

                          <td className="numero">
                            {formatarNumero(
                              produto.cavidadeMolde,
                              0,
                            )}
                          </td>

                          {/* CICLO */}

                          <td className="numero">

                            {produto.cicloSegundos === null
                              ? "-"
                              : `${formatarNumero(
                                  produto.cicloSegundos,
                                  2,
                                )} s`}

                          </td>

                          {/* KG/UNIDADE */}

                          <td className="numero">
                            {formatarNumero(
                              produto.kgUn,
                              4,
                            )}
                          </td>

                          {/* KG/HASTE */}

                          <td className="numero">
                            {formatarNumero(
                              produto.kgHaste,
                              4,
                            )}
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={
                                produto.ativo
                                  ? "cadastros-status cadastros-status--ativo"
                                  : "cadastros-status cadastros-status--inativo"
                              }
                            >
                              {produto.ativo
                                ? "Ativo"
                                : "Inativo"}
                            </span>
                          </td>

                          {/* EDITAR */}

                          <td>

                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() =>
                                abrirEdicaoProduto(produto)
                              }
                            >

                              <Pencil size={15} />

                              Editar

                            </button>

                          </td>

                        </tr>

                      ))
                    )}

                  </tbody>

                </table>

              </div>

            )}

            {/* =====================================
                TABELA DE FORNECEDORES
                PRESERVADA
            ===================================== */}

            {aba === "fornecedores" && (

              <div className="cadastros-tabela-scroll">

                <table className="cadastros-tabela cadastros-tabela--fornecedores">

                  <thead>
                    <tr>

                      <th>Fornecedor</th>

                      <th className="numero">
                        Estoque mínimo
                      </th>

                      <th className="numero">
                        Estoque alvo
                      </th>

                      <th className="numero">
                        Lead time
                      </th>

                      <th>Status</th>

                      <th>Ações</th>

                    </tr>
                  </thead>

                  <tbody>

                    {carregando ? (

                      <tr>
                        <td
                          colSpan={6}
                          className="cadastros-vazio"
                        >
                          Carregando fornecedores...
                        </td>
                      </tr>

                    ) : fornecedoresFiltrados.length === 0 ? (

                      <tr>
                        <td
                          colSpan={6}
                          className="cadastros-vazio"
                        >
                          Nenhum fornecedor encontrado.
                        </td>
                      </tr>

                    ) : (

                      fornecedoresFiltrados.map((fornecedor) => (

                        <tr key={fornecedor.id}>

                          {/* FORNECEDOR */}

                          <td>
                            <strong>
                              {fornecedor.nome}
                            </strong>
                          </td>

                          {/* ESTOQUE MÍNIMO */}

                          <td className="numero">

                            {fornecedor.estoqueMinimoKg === null
                              ? "-"
                              : `${formatarNumero(
                                  fornecedor.estoqueMinimoKg,
                                  3,
                                )} kg`}

                          </td>

                          {/* ESTOQUE ALVO */}

                          <td className="numero">

                            {fornecedor.estoqueAlvoKg === null
                              ? "-"
                              : `${formatarNumero(
                                  fornecedor.estoqueAlvoKg,
                                  3,
                                )} kg`}

                          </td>

                          {/* LEAD TIME */}

                          <td className="numero">

                            {fornecedor.leadTimeDias === null
                              ? "-"
                              : `${formatarNumero(
                                  fornecedor.leadTimeDias,
                                  0,
                                )} dias`}

                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={
                                fornecedor.ativo
                                  ? "cadastros-status cadastros-status--ativo"
                                  : "cadastros-status cadastros-status--inativo"
                              }
                            >
                              {fornecedor.ativo
                                ? "Ativo"
                                : "Inativo"}
                            </span>
                          </td>

                          {/* EDITAR */}

                          <td>

                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() =>
                                abrirEdicaoFornecedor(fornecedor)
                              }
                            >

                              <Pencil size={15} />

                              Editar

                            </button>

                          </td>

                        </tr>

                      ))
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </div>

      </main>

      {/* =====================================
          MODAIS
      ===================================== */}

      <CadastroProdutoModal
        aberto={modalProdutoAberto}
        item={produtoEdicao}
        salvando={salvandoProduto}
        onCancelar={fecharModalProduto}
        onSalvar={handleSalvarProduto}
        buscarDescricaoEstoque={buscarDescricaoEstoque}
      />

      <CadastroFornecedorModal
        aberto={modalFornecedorAberto}
        item={fornecedorEdicao}
        salvando={salvandoFornecedor}
        onCancelar={fecharModalFornecedor}
        onSalvar={handleSalvarFornecedor}
      />

    </>
  );
}