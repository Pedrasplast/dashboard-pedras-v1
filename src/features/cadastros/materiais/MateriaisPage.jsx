import { useEffect, useMemo, useState } from "react";
import useCadastros from "../useCadastros";
import CadastroEstrutura from "../components/CadastroEstrutura";
import CardResumo from "../components/CardResumo";
import { normalizarTexto } from "../utils/cadastrosFormatadores";
import { Boxes } from "lucide-react";
import MateriaisTabela from "./MateriaisTabela";
import CadastroMaterialModal from "./CadastroMaterialModal";

export default function MateriaisPage() {
  const { materiais, carregando, atualizando, erro, recarregar, salvandoMaterial, salvarMaterial } =
    useCadastros();
  const [pesquisa, setPesquisa] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);
  const [materialEdicao, setMaterialEdicao] = useState(null);
  const registrosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);
    if (!termo) return materiais;
    return materiais.filter((m) =>
      normalizarTexto(`${m.nome} ${m.codigoOmie ?? ""}`).includes(termo),
    );
  }, [materiais, pesquisa]);
  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / 8));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const registrosPagina = useMemo(
    () => registrosFiltrados.slice((paginaValida - 1) * 8, paginaValida * 8),
    [registrosFiltrados, paginaValida],
  );
  useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa]);
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
  return (
    <>
      <CadastroEstrutura
        tipo="materiais"
        titulo="Cadastro de material"
        descricao="Materiais disponíveis para fornecedores, compras e recebimentos."
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
            titulo="Materiais ativos"
            valor={carregando ? "-" : materiais.filter((m) => m.ativo).length}
            subtitulo="Materiais disponíveis para novas compras"
            icone={Boxes}
          />
        }
        novo={abrirNovoMaterial}
        textoNovo="Novo material"
        registros={registrosFiltrados.length}
        pagina={paginaValida}
        onPagina={setPaginaAtual}
        filhos={
          <MateriaisTabela
            registrosPagina={registrosPagina}
            carregando={carregando}
            abrirEdicaoMaterial={abrirEdicaoMaterial}
          />
        }
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
