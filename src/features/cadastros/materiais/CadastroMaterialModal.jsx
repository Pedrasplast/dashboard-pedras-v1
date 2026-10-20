
import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";

import { useEffect, useState } from "react";

import {
  Boxes,
  Save,
  X,
  TableProperties,
  Calculator,
} from "lucide-react";

import "../CadastroProdutoModal.css";

/* =========================================================
   MODAL — CADASTRO DE MATERIAL

   CAMPOS:
   - Nome do material
   - Código Omie manual
   - Exibir na Tabela de Preços
   - Exibir na Necessidade de Compra
   - Material ativo

   REGRAS:
   - As opções são independentes.
   - Novos materiais começam com opções desmarcadas.
   - Edições carregam as configurações existentes.
   - O código Omie permanece manual.
   - Não altera vínculos com produtos/fornecedores.
========================================================= */

export default function CadastroMaterialModal({
  aberto,
  item = null,
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [nome, setNome] = useState("");

  const [codigoOmie, setCodigoOmie] =
    useState("");

  const [ativo, setAtivo] =
    useState(true);

  const [
    exibirTabelaPrecos,
    setExibirTabelaPrecos,
  ] = useState(false);

  const [
    exibirNecessidadeCompra,
    setExibirNecessidadeCompra,
  ] = useState(false);

  const [erro, setErro] = useState("");

  /* =====================================================
     CARREGAR DADOS AO ABRIR

     Os campos de visibilidade devem vir
     de buscarMateriaisCadastro.

     Nomes utilizados no frontend:
     exibirTabelaPrecos
     exibirNecessidadeCompra
  ===================================================== */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setNome(item?.nome ?? "");

    setCodigoOmie(
      item?.codigoOmie ?? ""
    );

    setAtivo(
      item?.ativo !== false
    );

    setExibirTabelaPrecos(
      item?.exibirTabelaPrecos ??
      item?.exibir_tabela_precos ??
      false
    );

    setExibirNecessidadeCompra(
      item?.exibirNecessidadeCompra ??
      item?.exibir_necessidade_compra ??
      false
    );

    setErro("");
  }, [aberto, item]);

  /* =====================================================
     SALVAR MATERIAL

     Os dois novos campos são enviados para
     salvarMaterialCadastro por meio do hook.
  ===================================================== */

  async function enviar(event) {
    event.preventDefault();

    setErro("");

    const nomeFinal = String(
      nome ?? ""
    ).trim();

    const codigoFinal = String(
      codigoOmie ?? ""
    )
      .trim()
      .toUpperCase();

    if (!nomeFinal) {
      setErro("Informe o nome do material.");
      return;
    }

    if (
      (exibirTabelaPrecos ||
        exibirNecessidadeCompra) &&
      !codigoFinal
    ) {
      setErro(
        "Informe o código Omie para incluir o material na Tabela de Preços ou na Necessidade de Compra."
      );
      return;
    }

    try {
      await onSalvar?.({
        id: item?.id ?? null,

        nome: nomeFinal,

        codigoOmie: codigoFinal,

        ativo,

        exibirTabelaPrecos:
          exibirTabelaPrecos,

        exibirNecessidadeCompra:
          exibirNecessidadeCompra,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar o material."
      );
    }
  }

  /* =====================================================
     MODAL FECHADO
  ===================================================== */

  if (!aberto) {
    return null;
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <Modal
      asChild
      aberto={aberto}
      onFechar={onCancelar}
      bloqueado={salvando}
      tamanho="medio"
      fecharAoClicarFora={false}
    >
      <div
        className="produto-pp-modal cadastro-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-material-modal-titulo"
      >
        {/* =========================================
            CABEÇALHO
        ========================================= */}

        <div
          className="produto-pp-modal-header"
          data-modal-header=""
        >
          <div
            className="produto-pp-modal-header-icone"
            data-modal-icone=""
          >
            <Boxes
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="produto-pp-modal-header-texto">
            <span>Cadastro</span>

            <ModalTitulo>
              <h3 id="cadastro-material-modal-titulo">
                {item
                  ? "Editar material"
                  : "Cadastrar material"}
              </h3>
            </ModalTitulo>

            <p>
              Configure o material, seu código
              Omie e sua participação nas
              telas de compras.
            </p>
          </div>

          <button
            type="button"
            className="produto-pp-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <X size={19} />
          </button>
        </div>

        {/* =========================================
            FORMULÁRIO
        ========================================= */}

        <form
          className="produto-pp-modal-form"
          onSubmit={enviar}
          data-modal-form=""
        >
          {/* NOME */}

          <label className="produto-pp-modal-campo">
            <span>Nome do material</span>

            <input
              type="text"
              value={nome}
              onChange={(event) => {
                setNome(event.target.value);
                setErro("");
              }}
              placeholder="Ex.: PP, SCRAP, RAFIA..."
              autoComplete="off"
              disabled={salvando}
              required
            />
          </label>

          {/* CÓDIGO OMIE */}

          <label className="produto-pp-modal-campo">
            <span>
              Código Omie da matéria-prima
              (manual)
            </span>

            <input
              type="text"
              value={codigoOmie}
              maxLength={80}
              onChange={(event) => {
                setCodigoOmie(
                  event.target.value.toUpperCase()
                );

                setErro("");
              }}
              placeholder="Ex.: PRD11295"
              autoComplete="off"
              disabled={salvando}
            />

            <small>
              Um código por material. Você pode
              preencher depois, desde que o material
              não esteja habilitado nas telas
              de planejamento.
            </small>
          </label>

          {/* =========================================
              VISIBILIDADE NAS TELAS
          ========================================= */}

          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: 16,
              marginTop: 4,
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: 14,
                  marginBottom: 5,
                }}
              >
                Exibição nas telas de compras
              </strong>

              <small
                style={{
                  display: "block",
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                Selecione em quais telas este
                material deverá aparecer.
                As opções são independentes.
              </small>
            </div>

            {/* TABELA DE PREÇOS */}

            <label className="produto-pp-modal-status">
              <input
                type="checkbox"
                checked={exibirTabelaPrecos}
                onChange={(event) => {
                  setExibirTabelaPrecos(
                    event.target.checked
                  );

                  setErro("");
                }}
                disabled={salvando}
              />

              <div>
                <strong
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <TableProperties
                    size={17}
                    aria-hidden="true"
                  />

                  Exibir na Tabela de Preços
                </strong>

                <span>
                  Incluir este material nas
                  consultas de preços de
                  compra do Omie.
                </span>
              </div>
            </label>

            {/* NECESSIDADE DE COMPRA */}

            <label className="produto-pp-modal-status">
              <input
                type="checkbox"
                checked={exibirNecessidadeCompra}
                onChange={(event) => {
                  setExibirNecessidadeCompra(
                    event.target.checked
                  );

                  setErro("");
                }}
                disabled={salvando}
              />

              <div>
                <strong
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <Calculator
                    size={17}
                    aria-hidden="true"
                  />

                  Exibir na Necessidade de Compra
                </strong>

                <span>
                  Incluir este material no
                  planejamento de consumo,
                  estoque, compras futuras
                  e necessidade.
                </span>
              </div>
            </label>
          </div>

          {/* =========================================
              MATERIAL ATIVO
          ========================================= */}

          <label className="produto-pp-modal-status">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(event) => {
                setAtivo(event.target.checked);
                setErro("");
              }}
              disabled={salvando}
            />

            <div>
              <strong>Material ativo</strong>

              <span>
                Materiais inativos permanecem
                no histórico, mas não ficam
                disponíveis para novos
                vínculos nem aparecem nas telas
                de compras.
              </span>
            </div>
          </label>

          {/* =========================================
              ERRO
          ========================================= */}

          {erro && (
            <div
              className="produto-pp-modal-erro"
              role="alert"
            >
              {erro}
            </div>
          )}

          {/* =========================================
              AÇÕES
          ========================================= */}

          <div
            className="produto-pp-modal-acoes"
            data-modal-footer=""
          >
            <button
              type="button"
              className="produto-pp-modal-cancelar"
              onClick={onCancelar}
              disabled={salvando}
              data-modal-acao="secundaria"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="produto-pp-modal-salvar"
              disabled={salvando}
              data-modal-acao="primaria"
            >
              <Save size={17} />

              {salvando
                ? "Salvando..."
                : "Salvar material"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
