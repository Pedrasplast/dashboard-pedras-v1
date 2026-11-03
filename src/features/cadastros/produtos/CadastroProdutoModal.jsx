import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";

import { useEffect, useRef, useState } from "react";
import { Boxes, Save, X } from "lucide-react";

import "../CadastroProdutoModal.css";

/* =====================================================
   FUNÇÕES AUXILIARES — NÚMEROS
===================================================== */

function valorParaCampo(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  return String(valor).replace(".", ",");
}

function normalizarNumero(valor) {
  const texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "");

  if (!texto) return null;

  const normalizado =
    texto.includes(",") && texto.includes(".")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto.replace(",", ".");

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

/* =====================================================
   COMPONENTE — CADASTRO DE PRODUTO
===================================================== */

export default function CadastroProdutoModal({
  aberto,
  item = null,
  materiais = [],
  salvando = false,
  onCancelar,
  onSalvar,
  buscarDescricaoEstoque,
}) {
  /* =====================================================
     ESTADOS DO FORMULÁRIO
  ===================================================== */

  const [codigoProduto, setCodigoProduto] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");

  const [cavidadeMolde, setCavidadeMolde] = useState("1");
  const [cicloSegundos, setCicloSegundos] = useState("");

  const [kgUn, setKgUn] = useState("");
  const [kgHaste, setKgHaste] = useState("");

  const [materialId, setMaterialId] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [tempoInjecaoSegundos, setTempoInjecaoSegundos] = useState("");

  const [tempoResfriamentoSegundos, setTempoResfriamentoSegundos] = useState("");

  const [descricaoEstoque, setDescricaoEstoque] = useState("");
  const [buscandoDescricao, setBuscandoDescricao] = useState(false);

  const [avisoDescricao, setAvisoDescricao] = useState("");
  const [erro, setErro] = useState("");

  /* =====================================================
     REFERÊNCIAS DA CONSULTA AO ESTOQUE
  ===================================================== */

  const consultaRef = useRef(0);
  const codigoRef = useRef("");
  const nomeAutomaticoRef = useRef("");

  /* =====================================================
     PREENCHIMENTO DO FORMULÁRIO
  ===================================================== */

  useEffect(() => {
    ++consultaRef.current;

    if (!aberto) return;

    const codigo = item?.codigoProduto ?? "";

    codigoRef.current = codigo;
    nomeAutomaticoRef.current = "";

    setCodigoProduto(codigo);
    setNomeProduto(item?.nomeProduto ?? "");

    setCavidadeMolde(valorParaCampo(item?.cavidadeMolde ?? 1));

    setCicloSegundos(valorParaCampo(item?.cicloSegundos));

    setKgUn(valorParaCampo(item?.kgUn));

    setKgHaste(valorParaCampo(item?.kgHaste));

    setMaterialId(
      item?.materialId !== null && item?.materialId !== undefined ? String(item.materialId) : "",
    );

    setAtivo(item?.ativo !== false);

    setTempoInjecaoSegundos(valorParaCampo(item?.tempoInjecaoSegundos));

    setTempoResfriamentoSegundos(valorParaCampo(item?.tempoResfriamentoSegundos));

    setDescricaoEstoque(item?.descricaoEstoque ?? "");

    setBuscandoDescricao(false);
    setAvisoDescricao("");
    setErro("");
  }, [aberto, item]);

  /* =====================================================
     ALTERAÇÃO DO CÓDIGO DO PRODUTO
  ===================================================== */

  function alterarCodigo(valor) {
    ++consultaRef.current;

    codigoRef.current = valor;

    setCodigoProduto(valor);
    setDescricaoEstoque("");
    setAvisoDescricao("");
    setBuscandoDescricao(false);

    setNomeProduto((atual) => {
      if (nomeAutomaticoRef.current && atual === nomeAutomaticoRef.current) {
        nomeAutomaticoRef.current = "";
        return "";
      }

      nomeAutomaticoRef.current = "";
      return atual;
    });

    setErro("");
  }

  /* =====================================================
     CONSULTAR DESCRIÇÃO DO PRODUTO NO ESTOQUE
  ===================================================== */

  async function consultarEstoque() {
    const codigo = codigoProduto.trim();

    if (item || !codigo || typeof buscarDescricaoEstoque !== "function") {
      return;
    }

    const consulta = ++consultaRef.current;

    setBuscandoDescricao(true);
    setAvisoDescricao("");

    try {
      const descricao = await buscarDescricaoEstoque(codigo);

      if (consulta !== consultaRef.current || codigoRef.current.trim() !== codigo) {
        return;
      }

      const encontrada = String(descricao ?? "").trim();

      setDescricaoEstoque(encontrada);

      if (encontrada) {
        setNomeProduto((atual) => {
          if (atual.trim()) {
            return atual;
          }

          nomeAutomaticoRef.current = encontrada;

          return encontrada;
        });
      } else {
        setAvisoDescricao("Código não encontrado no estoque Omie. Informe o nome manualmente.");
      }
    } catch (error) {
      if (consulta === consultaRef.current) {
        setAvisoDescricao(
          `Consulta ao estoque indisponível: ${
            error?.message || "tente novamente"
          }. Informe o nome manualmente.`,
        );
      }
    } finally {
      if (consulta === consultaRef.current) {
        setBuscandoDescricao(false);
      }
    }
  }

  /* =====================================================
     VALIDAÇÃO E SALVAMENTO
  ===================================================== */

  async function enviar(evento) {
    evento.preventDefault();
    setErro("");

    if (buscandoDescricao) {
      setErro("Aguarde a consulta da descrição do produto.");
      return;
    }

    const codigoFinal = codigoProduto.trim();
    const nomeFinal = nomeProduto.trim();

    if (!codigoFinal) {
      setErro("Informe o código do produto.");
      return;
    }

    if (!nomeFinal) {
      setErro("Informe o nome do produto.");
      return;
    }

    const cavidadeFinal = normalizarNumero(cavidadeMolde);
    const cicloFinal = normalizarNumero(cicloSegundos);
    const kgUnFinal = normalizarNumero(kgUn);
    const kgHasteFinal = normalizarNumero(kgHaste);

    const injecaoFinal = normalizarNumero(tempoInjecaoSegundos);

    const resfriamentoFinal = normalizarNumero(tempoResfriamentoSegundos);

    if (cavidadeFinal === null || !Number.isInteger(cavidadeFinal) || cavidadeFinal <= 0) {
      setErro("Informe uma quantidade de cavidades maior que zero.");
      return;
    }

    if (cicloSegundos.trim() && (cicloFinal === null || cicloFinal <= 0)) {
      setErro("Informe um ciclo maior que zero.");
      return;
    }

    if (kgUn.trim() && (kgUnFinal === null || kgUnFinal < 0)) {
      setErro("Informe um Kg/unidade válido.");
      return;
    }

    if (kgHaste.trim() && (kgHasteFinal === null || kgHasteFinal < 0)) {
      setErro("Informe um Kg/haste válido.");
      return;
    }

    const materialIdFinal = Number(materialId);

    if (!materialId || !Number.isInteger(materialIdFinal) || materialIdFinal <= 0) {
      setErro("Selecione o material do produto.");
      return;
    }

    /* =================================================
       SALVAMENTO

       Mantém o contrato original com o serviço.
       A matéria-prima é vinculada pelo materialId.
       O código Omie pertence ao cadastro do material.
    ================================================= */

    try {
      await onSalvar?.({
        codigoProduto: codigoFinal,

        codigoOriginal: item?.codigoProduto ?? null,

        nomeProduto: nomeFinal,

        materialId: materialIdFinal,

        pesoKg: item?.pesoKg ?? null,

        ativo,

        cavidadeMolde: cavidadeFinal,

        cicloSegundos: cicloFinal,

        tempoInjecaoSegundos: injecaoFinal,

        tempoResfriamentoSegundos: resfriamentoFinal,

        kgUn: kgUnFinal,

        kgHaste: kgHasteFinal,
      });
    } catch (error) {
      setErro(error?.message || "Não foi possível salvar o produto.");
    }
  }

  /* =====================================================
     MATERIAL SELECIONADO

     O nome e o código são obtidos da lista
     de materiais recebida pelo componente.
  ===================================================== */

  const materialSelecionado = materiais.find(
    (material) => String(material.id) === String(materialId),
  );

  const codigoMateriaPrima =
    materialSelecionado?.codigoOmie ?? materialSelecionado?.codigo_omie ?? "";

  if (!aberto) return null;

  /* =====================================================
     RENDERIZAÇÃO DO MODAL
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
        aria-labelledby="cadastro-produto-modal-titulo"
      >
        {/* ============================================
            CABEÇALHO
        ============================================ */}

        <div className="produto-pp-modal-header" data-modal-header="">
          <div className="produto-pp-modal-header-icone" data-modal-icone="">
            <Boxes size={22} aria-hidden="true" />
          </div>

          <div className="produto-pp-modal-header-texto">
            <span>Cadastro</span>

            <ModalTitulo>
              <h3 id="cadastro-produto-modal-titulo">
                {item ? "Editar produto" : "Cadastrar produto"}
              </h3>
            </ModalTitulo>

            <p>Dados gerais e parâmetros utilizados no planejamento de produção.</p>
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

        {/* ============================================
            FORMULÁRIO
        ============================================ */}

        <form className="produto-pp-modal-form" onSubmit={enviar} data-modal-form="">
          {/* CÓDIGO DO PRODUTO ACABADO */}

          <label className="produto-pp-modal-campo">
            <span>Código</span>

            <input
              type="text"
              value={codigoProduto}
              onChange={(evento) => alterarCodigo(evento.target.value)}
              onBlur={() => {
                void consultarEstoque();
              }}
              placeholder="Ex.: 11374"
              autoComplete="off"
              disabled={salvando || Boolean(item)}
            />
          </label>

          {/* DESCRIÇÃO ENCONTRADA NO ESTOQUE */}

          {descricaoEstoque && (
            <div
              className="produto-pp-modal-campo"
              style={{
                padding: "10px 12px",
                background: "#eff6ff",
                borderRadius: 8,
              }}
            >
              <span>Descrição encontrada no estoque Omie</span>

              <strong
                style={{
                  display: "block",
                  marginTop: 4,
                }}
              >
                {descricaoEstoque}
              </strong>

              {item && descricaoEstoque !== item.nomeProduto && (
                <small>O nome cadastrado permanece inalterado até você decidir editá-lo.</small>
              )}
            </div>
          )}

          {buscandoDescricao && (
            <small role="status">Consultando descrição no estoque Omie...</small>
          )}

          {avisoDescricao && <small role="status">{avisoDescricao}</small>}

          {/* NOME DO PRODUTO */}

          <label className="produto-pp-modal-campo">
            <span>Nome do produto</span>

            <input
              type="text"
              value={nomeProduto}
              onChange={(evento) => {
                nomeAutomaticoRef.current = "";

                setNomeProduto(evento.target.value);
                setErro("");
              }}
              placeholder="Ex.: Suporte 90x90"
              autoComplete="off"
              disabled={salvando}
            />
          </label>

          {/* CAVIDADES E CICLO */}

          <div className="produto-pp-modal-grid">
            <label className="produto-pp-modal-campo">
              <span>Cavidades</span>

              <input
                type="number"
                min="1"
                step="1"
                value={cavidadeMolde}
                onChange={(evento) => {
                  setCavidadeMolde(evento.target.value);
                  setErro("");
                }}
                disabled={salvando}
              />
            </label>

            <label className="produto-pp-modal-campo">
              <span>Ciclo</span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cicloSegundos}
                  onChange={(evento) => {
                    setCicloSegundos(evento.target.value);
                    setErro("");
                  }}
                  placeholder="Ex.: 45"
                  disabled={salvando}
                />

                <span>s</span>
              </div>
            </label>
          </div>

          {/* PESO POR UNIDADE E POR HASTE */}

          <div className="produto-pp-modal-grid">
            <label className="produto-pp-modal-campo">
              <span>Kg/unidade</span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={kgUn}
                  onChange={(evento) => {
                    setKgUn(evento.target.value);
                    setErro("");
                  }}
                  placeholder="Ex.: 0,2470"
                  disabled={salvando}
                />

                <span>kg</span>
              </div>
            </label>

            <label className="produto-pp-modal-campo">
              <span>Kg/haste</span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={kgHaste}
                  onChange={(evento) => {
                    setKgHaste(evento.target.value);
                    setErro("");
                  }}
                  placeholder="Ex.: 0,1040"
                  disabled={salvando}
                />

                <span>kg</span>
              </div>
            </label>
          </div>

          {/* ============================================
              MATÉRIA-PRIMA UTILIZADA

              NOVO:
              Exibição do código Omie cadastrado
              manualmente no Cadastro de Material.
          ============================================ */}

          <label className="produto-pp-modal-campo">
            <span>Matéria-prima utilizada</span>

            <select
              value={materialId}
              onChange={(evento) => {
                setMaterialId(evento.target.value);
                setErro("");
              }}
              disabled={salvando}
              required
            >
              <option value="">Selecione o material</option>

              {materiais
                .filter((material) => material.ativo || String(material.id) === String(materialId))
                .map((material) => {
                  const codigo = material.codigoOmie ?? material.codigo_omie ?? "";

                  return (
                    <option key={material.id} value={String(material.id)}>
                      {material.nome}
                      {codigo ? ` — ${codigo}` : " — SEM CÓDIGO OMIE"}
                    </option>
                  );
                })}
            </select>

            <small>
              Selecione o material que será utilizado na fabricação. O código vem do Cadastro de
              Material do Supabase.
            </small>
          </label>

          {/* IDENTIFICAÇÃO DO CÓDIGO SELECIONADO */}

          {materialId && (
            <div
              className="produto-pp-modal-campo"
              style={{
                padding: "10px 12px",
                background: codigoMateriaPrima ? "#f0fdf4" : "#fff7ed",
                borderRadius: 8,
              }}
            >
              <span>Código Omie da matéria-prima</span>

              <strong
                style={{
                  display: "block",
                  marginTop: 4,
                }}
              >
                {codigoMateriaPrima || "Código não cadastrado"}
              </strong>

              <small>
                {codigoMateriaPrima
                  ? "Este código será utilizado para identificar a matéria-prima no planejamento."
                  : "Cadastre o código deste material na tela Cadastro de Material."}
              </small>
            </div>
          )}

          {/* SITUAÇÃO DO PRODUTO */}

          <div className="cadastro-produto-modal-status-grid">
            <label className="produto-pp-modal-status">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(evento) => {
                  setAtivo(evento.target.checked);
                  setErro("");
                }}
                disabled={salvando}
              />

              <div>
                <strong>Produto ativo</strong>

                <span>Produtos inativos permanecem no histórico do sistema.</span>
              </div>
            </label>
          </div>

          {/* MENSAGEM DE ERRO */}

          {erro && (
            <div className="produto-pp-modal-erro" role="alert">
              {erro}
            </div>
          )}

          {/* AÇÕES */}

          <div className="produto-pp-modal-acoes" data-modal-footer="">
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
              disabled={salvando || buscandoDescricao}
              data-modal-acao="primaria"
            >
              <Save size={17} />

              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
