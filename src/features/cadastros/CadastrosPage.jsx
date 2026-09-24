import { useMemo, useState } from "react";

import { Boxes, CheckCircle2, Factory, Pencil, Plus, RefreshCw, Search, Truck } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import CadastroFornecedorModal from "./CadastroFornecedorModal";
import CadastroMaterialModal from "./CadastroMaterialModal";
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
  if (valor === null || valor === undefined || valor === "") {
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

function CardResumo({ titulo, valor, subtitulo, icone: Icone }) {
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

export default function CadastrosPage({ tipo = "produtos" }) {
  /* =================================================
     ESTADOS
  ================================================= */

  const aba = tipo;

  const [pesquisa, setPesquisa] = useState("");

  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);

  const [produtoEdicao, setProdutoEdicao] = useState(null);

  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);

  const [fornecedorEdicao, setFornecedorEdicao] = useState(null);

  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);

  const [materialEdicao, setMaterialEdicao] = useState(null);

  const [mensagemSucesso, setMensagemSucesso] = useState("");

  /* =================================================
     DADOS DOS CADASTROS
  ================================================= */

  const {
    produtos,
    fornecedores,
    materiais,
    fornecedorMateriais,

    carregando,
    atualizando,

    salvandoProduto,
    salvandoFornecedor,
    salvandoMaterial,
    salvandoMateriaisFornecedor,

    erro,
    erroDescricoesEstoque,

    recarregar,

    salvarProduto,
    salvarFornecedor,
    salvarMaterial,
    salvarMateriaisFornecedor,

    buscarDescricaoEstoque,
  } = useCadastros();

  /* =================================================
     INDICADORES
  ================================================= */

  const resumo = useMemo(
    () => ({
      produtosAtivos: produtos.filter((produto) => produto.ativo).length,

      produtosComParametros: produtos.filter(
        (produto) => produto.temParametros && produto.parametroAtivo,
      ).length,

      produtosSemParametros: produtos.filter((produto) => !produto.temParametros).length,

      fornecedoresAtivos: fornecedores.filter((fornecedor) => fornecedor.ativo).length,

      materiaisAtivos: materiais.filter((material) => material.ativo).length,
    }),
    [produtos, fornecedores, materiais],
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
      normalizarTexto(`${produto.codigoProduto} ${produto.nomeProduto}`).includes(termo),
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

    return fornecedores.filter((fornecedor) => normalizarTexto(fornecedor.nome).includes(termo));
  }, [fornecedores, pesquisa]);

  /* =================================================
     FILTRO DE MATERIAIS
  ================================================= */

  const materiaisFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    if (!termo) {
      return materiais;
    }

    return materiais.filter((material) =>
      normalizarTexto(material.nome).includes(termo),
    );
  }, [materiais, pesquisa]);

  /* =================================================
     MATERIAIS DO FORNECEDOR
  ================================================= */

  function materiaisDoFornecedor(fornecedorId) {
    return fornecedorMateriais
      .filter(
        (vinculo) =>
          vinculo.ativo &&
          String(vinculo.fornecedorId) === String(fornecedorId),
      )
      .map((vinculo) => ({
        ...vinculo,
        material:
          materiais.find(
            (material) =>
              String(material.id) === String(vinculo.materialId),
          ) ?? null,
      }))
      .filter((vinculo) => vinculo.material);
  }

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
    if (salvandoFornecedor || salvandoMateriaisFornecedor) {
      return;
    }

    setModalFornecedorAberto(false);

    setFornecedorEdicao(null);
  }

  /* =================================================
     SALVAR FORNECEDOR
  ================================================= */

  async function handleSalvarFornecedor(dados) {
    const {
      materialIds,
      materialPadraoId,
      ...dadosFornecedor
    } = dados;

    const resultado = await salvarFornecedor(dadosFornecedor);

    const fornecedorId =
      resultado?.fornecedor?.id ??
      fornecedorEdicao?.id ??
      null;

    if (!fornecedorId) {
      throw new Error(
        "O fornecedor foi salvo, mas não foi possível identificar o cadastro para vincular os materiais.",
      );
    }

    await salvarMateriaisFornecedor({
      fornecedorId,
      materialIds,
      materialPadraoId,
    });

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
     MATERIAL
  ================================================= */

  function abrirNovoMaterial() {
    setMensagemSucesso("");

    setMaterialEdicao(null);

    setModalMaterialAberto(true);
  }

  function abrirEdicaoMaterial(material) {
    setMensagemSucesso("");

    setMaterialEdicao(material);

    setModalMaterialAberto(true);
  }

  function fecharModalMaterial() {
    if (salvandoMaterial) {
      return;
    }

    setModalMaterialAberto(false);

    setMaterialEdicao(null);
  }

  async function handleSalvarMaterial(dados) {
    const resultado = await salvarMaterial(dados);

    setMensagemSucesso(
      resultado?.acao === "criado"
        ? "Material cadastrado com sucesso."
        : "Material atualizado com sucesso.",
    );

    setModalMaterialAberto(false);

    setMaterialEdicao(null);

    return resultado;
  }

  /* =================================================
     SELECIONAR ABA
  ================================================= */

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
            title={
              aba === "produtos"
                ? "Cadastro de produto"
                : aba === "fornecedores"
                  ? "Cadastro de fornecedor"
                  : "Cadastro de material"
            }
            description={
              aba === "produtos"
                ? "Produtos e parâmetros de produção utilizados pelo sistema."
                : aba === "fornecedores"
                  ? "Fornecedores e parâmetros de abastecimento utilizados pelo sistema."
                  : "Materiais disponíveis para fornecedores, compras e recebimentos."
            }
            icon={aba === "fornecedores" ? Truck : Boxes}
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

          {/* =====================================
              INDICADORES
          ===================================== */}

          <section className={`cadastros-resumo cadastros-resumo--${aba}`}>
            {aba === "produtos" && (
              <>
                <CardResumo
                  titulo="Produtos ativos"
                  valor={carregando ? "-" : resumo.produtosAtivos}
                  subtitulo="Produtos cadastrados no sistema"
                  icone={Boxes}
                />

                <CardResumo
                  titulo="Com parâmetros"
                  valor={carregando ? "-" : resumo.produtosComParametros}
                  subtitulo="Ciclo e dados técnicos cadastrados"
                  icone={Factory}
                />

                <CardResumo
                  titulo="Sem parâmetros"
                  valor={carregando ? "-" : resumo.produtosSemParametros}
                  subtitulo="Produtos que precisam de dados técnicos"
                  icone={CheckCircle2}
                />
              </>
            )}
            {aba === "fornecedores" && (
              <CardResumo
                titulo="Fornecedores ativos"
                valor={carregando ? "-" : resumo.fornecedoresAtivos}
                subtitulo="Fornecedores disponíveis"
                icone={Truck}
              />
            )}

            {aba === "materiais" && (
              <CardResumo
                titulo="Materiais ativos"
                valor={carregando ? "-" : resumo.materiaisAtivos}
                subtitulo="Materiais disponíveis para novas compras"
                icone={Boxes}
              />
            )}
          </section>

          {/* =====================================
              SUCESSO
          ===================================== */}

          {mensagemSucesso && <div className="cadastros-sucesso">{mensagemSucesso}</div>}

          {/* =====================================
              CONTEÚDO
          ===================================== */}

          <section className="cadastros-conteudo">
            {/* =====================================
                PESQUISA E NOVO CADASTRO
            ===================================== */}

            <div className="cadastros-toolbar">
              <div className="cadastros-pesquisa">
                <Search size={18} />

                <input
                  type="text"
                  value={pesquisa}
                  onChange={(evento) => setPesquisa(evento.target.value)}
                  placeholder={
                    aba === "produtos"
                      ? "Buscar código ou produto..."
                      : aba === "fornecedores"
                        ? "Buscar fornecedor..."
                        : "Buscar material..."
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
              ) : aba === "fornecedores" ? (
                <button
                  type="button"
                  className="cadastros-botao-primario"
                  onClick={abrirNovoFornecedor}
                >
                  <Plus size={17} />
                  Novo fornecedor
                </button>
              ) : (
                <button
                  type="button"
                  className="cadastros-botao-primario"
                  onClick={abrirNovoMaterial}
                >
                  <Plus size={17} />
                  Novo material
                </button>
              )}
            </div>

            {/* =====================================
                ERROS
            ===================================== */}

            {erro && (
              <div className="cadastros-erro" role="alert">
                {erro}
              </div>
            )}

            {aba === "produtos" && erroDescricoesEstoque && (
              <div className="cadastros-erro" role="status">
                Não foi possível consultar o estoque Omie: {erroDescricoesEstoque}. O cadastro
                permanece disponível.
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

                      <th className="numero">Cavidades</th>

                      <th className="numero">Ciclo</th>

                      <th className="numero">Kg/un.</th>

                      <th className="numero">Kg/haste</th>

                      <th>Status</th>

                      <th>Ações</th>
                    </tr>
                  </thead>

                  {/* CORPO */}

                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={9} className="cadastros-vazio">
                          Carregando produtos...
                        </td>
                      </tr>
                    ) : produtosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="cadastros-vazio">
                          Nenhum produto encontrado.
                        </td>
                      </tr>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <tr key={produto.codigoProduto}>
                          {/* CÓDIGO */}

                          <td>
                            <span className="cadastros-codigo">{produto.codigoProduto}</span>
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

                          <td>{produto.usaPp ? "Sim" : "Não"}</td>

                          {/* CAVIDADES */}

                          <td className="numero">{formatarNumero(produto.cavidadeMolde, 0)}</td>

                          {/* CICLO */}

                          <td className="numero">
                            {produto.cicloSegundos === null
                              ? "-"
                              : `${formatarNumero(produto.cicloSegundos, 2)} s`}
                          </td>

                          {/* KG/UNIDADE */}

                          <td className="numero">{formatarNumero(produto.kgUn, 4)}</td>

                          {/* KG/HASTE */}

                          <td className="numero">{formatarNumero(produto.kgHaste, 4)}</td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={
                                produto.ativo
                                  ? "cadastros-status cadastros-status--ativo"
                                  : "cadastros-status cadastros-status--inativo"
                              }
                            >
                              {produto.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>

                          {/* EDITAR */}

                          <td>
                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() => abrirEdicaoProduto(produto)}
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

                      <th>Materiais</th>

                      <th className="numero">Estoque mínimo</th>

                      <th className="numero">Estoque alvo</th>

                      <th className="numero">Lead time</th>

                      <th>Status</th>

                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={7} className="cadastros-vazio">
                          Carregando fornecedores...
                        </td>
                      </tr>
                    ) : fornecedoresFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="cadastros-vazio">
                          Nenhum fornecedor encontrado.
                        </td>
                      </tr>
                    ) : (
                      fornecedoresFiltrados.map((fornecedor) => (
                        <tr key={fornecedor.id}>
                          {/* FORNECEDOR */}

                          <td>
                            <strong>{fornecedor.nome}</strong>
                          </td>

                          {/* MATERIAIS */}

                          <td>
                            <div className="cadastros-materiais-tags">
                              {materiaisDoFornecedor(fornecedor.id).map(
                                (vinculo) => (
                                  <span
                                    key={vinculo.materialId}
                                    className={
                                      vinculo.padrao
                                        ? "cadastros-material-tag cadastros-material-tag--padrao"
                                        : "cadastros-material-tag"
                                    }
                                  >
                                    {vinculo.material.nome}
                                    {vinculo.padrao ? " • padrão" : ""}
                                  </span>
                                ),
                              )}

                              {materiaisDoFornecedor(fornecedor.id).length === 0 && (
                                <span className="cadastros-material-tag">
                                  Sem material
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ESTOQUE MÍNIMO */}

                          <td className="numero">
                            {fornecedor.estoqueMinimoKg === null
                              ? "-"
                              : `${formatarNumero(fornecedor.estoqueMinimoKg, 3)} kg`}
                          </td>

                          {/* ESTOQUE ALVO */}

                          <td className="numero">
                            {fornecedor.estoqueAlvoKg === null
                              ? "-"
                              : `${formatarNumero(fornecedor.estoqueAlvoKg, 3)} kg`}
                          </td>

                          {/* LEAD TIME */}

                          <td className="numero">
                            {fornecedor.leadTimeDias === null
                              ? "-"
                              : `${formatarNumero(fornecedor.leadTimeDias, 0)} dias`}
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
                              {fornecedor.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>

                          {/* EDITAR */}

                          <td>
                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() => abrirEdicaoFornecedor(fornecedor)}
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
                TABELA DE MATERIAIS
            ===================================== */}

            {aba === "materiais" && (
              <div className="cadastros-tabela-scroll">
                <table className="cadastros-tabela cadastros-tabela--materiais">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={3} className="cadastros-vazio">
                          Carregando materiais...
                        </td>
                      </tr>
                    ) : materiaisFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="cadastros-vazio">
                          Nenhum material encontrado.
                        </td>
                      </tr>
                    ) : (
                      materiaisFiltrados.map((material) => (
                        <tr key={material.id}>
                          <td>
                            <strong>{material.nome}</strong>
                          </td>

                          <td>
                            <span
                              className={
                                material.ativo
                                  ? "cadastros-status cadastros-status--ativo"
                                  : "cadastros-status cadastros-status--inativo"
                              }
                            >
                              {material.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() => abrirEdicaoMaterial(material)}
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
        materiais={materiais}
        vinculosMateriais={
          fornecedorEdicao
            ? materiaisDoFornecedor(fornecedorEdicao.id)
            : []
        }
        salvando={salvandoFornecedor || salvandoMateriaisFornecedor}
        onCancelar={fecharModalFornecedor}
        onSalvar={handleSalvarFornecedor}
      />

      <CadastroMaterialModal
        aberto={modalMaterialAberto}
        item={materialEdicao}
        salvando={salvandoMaterial}
        onCancelar={fecharModalMaterial}
        onSalvar={handleSalvarMaterial}
      />
    </>
  );
}
