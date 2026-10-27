import { useEffect, useMemo, useState } from "react";
import useCadastros from "../useCadastros";
import CadastroEstrutura from "../components/CadastroEstrutura";
import CardResumo from "../components/CardResumo";
import { normalizarTexto } from "../utils/cadastrosFormatadores";
import { Truck } from "lucide-react";
import FornecedoresTabela from "./FornecedoresTabela";
import CadastroFornecedorModal from "./CadastroFornecedorModal";

export default function FornecedoresPage() {
  const {
    fornecedores,
    fornecedorMateriais,
    materiais,
    carregando,
    atualizando,
    erro,
    recarregar,
    salvandoFornecedor,
    salvandoMateriaisFornecedor,
    salvarFornecedor,
    salvarMateriaisFornecedor,
  } = useCadastros();
  const [pesquisa, setPesquisa] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);
  const [fornecedorEdicao, setFornecedorEdicao] = useState(null);
  const registrosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);
    if (!termo) return fornecedores;
    return fornecedores.filter((fornecedor) => normalizarTexto(fornecedor.nome).includes(termo));
  }, [fornecedores, pesquisa]);
  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / 8));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const registrosPagina = useMemo(
    () => registrosFiltrados.slice((paginaValida - 1) * 8, paginaValida * 8),
    [registrosFiltrados, paginaValida],
  );
  useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa]);
  function materiaisDoFornecedor(fornecedorId) {
    return fornecedorMateriais
      .filter((v) => v.ativo && String(v.fornecedorId) === String(fornecedorId))
      .map((v) => ({
        ...v,
        material: materiais.find((m) => String(m.id) === String(v.materialId)) ?? null,
      }))
      .filter((v) => v.material);
  }
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
    const { materialIds, materialPadraoId, ...dadosFornecedor } = dados;

    const resultado = await salvarFornecedor(dadosFornecedor);

    const fornecedorId = resultado?.fornecedor?.id ?? fornecedorEdicao?.id ?? null;

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
  return (
    <>
      <CadastroEstrutura
        tipo="fornecedores"
        titulo="Cadastro de fornecedor"
        descricao="Fornecedores e parâmetros de abastecimento utilizados pelo sistema."
        pesquisa={pesquisa}
        onPesquisa={setPesquisa}
        carregando={carregando}
        atualizando={atualizando}
        recarregar={recarregar}
        mensagemSucesso={mensagemSucesso}
        erro={erro}
        erroExtra={""}
        cards={
          <CardResumo
            titulo="Fornecedores ativos"
            valor={carregando ? "-" : fornecedores.filter((f) => f.ativo).length}
            subtitulo="Fornecedores disponíveis"
            icone={Truck}
          />
        }
        novo={abrirNovoFornecedor}
        textoNovo="Novo fornecedor"
        registros={registrosFiltrados.length}
        pagina={paginaValida}
        onPagina={setPaginaAtual}
        filhos={
          <FornecedoresTabela
            registrosPagina={registrosPagina}
            carregando={carregando}
            materiaisDoFornecedor={materiaisDoFornecedor}
            abrirEdicaoFornecedor={abrirEdicaoFornecedor}
          />
        }
      />
      <CadastroFornecedorModal
        aberto={modalFornecedorAberto}
        item={fornecedorEdicao}
        materiais={materiais}
        vinculosMateriais={fornecedorEdicao ? materiaisDoFornecedor(fornecedorEdicao.id) : []}
        salvando={salvandoFornecedor || salvandoMateriaisFornecedor}
        onCancelar={fecharModalFornecedor}
        onSalvar={handleSalvarFornecedor}
      />
    </>
  );
}
