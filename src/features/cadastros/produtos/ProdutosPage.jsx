import { useEffect, useMemo, useState } from "react";
import useCadastros from "../useCadastros";
import CadastroEstrutura from "../components/CadastroEstrutura";
import CardResumo from "../components/CardResumo";

import { Boxes, Factory, CheckCircle2 } from "lucide-react";
import ProdutosTabela from "./ProdutosTabela";
import CadastroProdutoModal from "./CadastroProdutoModal";
import { normalizarTexto } from "@/shared/lib/texto";

export default function ProdutosPage() {
  const {
    produtos,
    materiais,
    carregando,
    atualizando,
    erro,
    erroDescricoesEstoque,
    recarregar,
    salvandoProduto,
    salvarProduto,
    buscarDescricaoEstoque,
  } = useCadastros();
  const [pesquisa, setPesquisa] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEdicao, setProdutoEdicao] = useState(null);
  const registrosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);
    if (!termo) return produtos;
    return produtos.filter((produto) =>
      normalizarTexto(
        `${produto.codigoProduto} ${produto.nomeProduto} ${produto.materialNome ?? ""} ${materiais.find((material) => String(material.id) === String(produto.materialId))?.codigoOmie ?? ""}`,
      ).includes(termo),
    );
  }, [produtos, materiais, pesquisa]);
  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / 8));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const registrosPagina = useMemo(
    () => registrosFiltrados.slice((paginaValida - 1) * 8, paginaValida * 8),
    [registrosFiltrados, paginaValida],
  );
  useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa]);
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
  return (
    <>
      <CadastroEstrutura
        tipo="produtos"
        titulo="Cadastro de produto"
        descricao="Produtos e parâmetros de produção utilizados pelo sistema."
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        carregando={carregando}
        atualizando={atualizando}
        recarregar={recarregar}
        mensagemSucesso={mensagemSucesso}
        erro={erro}
        erroExtra={
          erroDescricoesEstoque
            ? `Não foi possível consultar o estoque Omie: ${erroDescricoesEstoque}. O cadastro permanece disponível.`
            : ""
        }
        cards={
          <>
            <CardResumo
              titulo="Produtos ativos"
              valor={carregando ? "-" : produtos.filter((p) => p.ativo).length}
              subtitulo="Produtos cadastrados no sistema"
              icone={Boxes}
            />
            <CardResumo
              titulo="Com parâmetros"
              valor={
                carregando
                  ? "-"
                  : produtos.filter((p) => p.temParametros && p.parametroAtivo).length
              }
              subtitulo="Ciclo e dados técnicos cadastrados"
              icone={Factory}
            />
            <CardResumo
              titulo="Sem parâmetros"
              valor={carregando ? "-" : produtos.filter((p) => !p.temParametros).length}
              subtitulo="Produtos que precisam de dados técnicos"
              icone={CheckCircle2}
            />
          </>
        }
        novo={abrirNovoProduto}
        textoNovo="Novo produto"
        registros={registrosFiltrados.length}
        pagina={paginaValida}
        onPagina={setPaginaAtual}
        filhos={
          <ProdutosTabela
            registrosPagina={registrosPagina}
            carregando={carregando}
            materiais={materiais}
            abrirEdicaoProduto={abrirEdicaoProduto}
          />
        }
      />
      <CadastroProdutoModal
        aberto={modalProdutoAberto}
        item={produtoEdicao}
        materiais={materiais}
        salvando={salvandoProduto}
        onCancelar={fecharModalProduto}
        onSalvar={handleSalvarProduto}
        buscarDescricaoEstoque={buscarDescricaoEstoque}
      />
    </>
  );
}
