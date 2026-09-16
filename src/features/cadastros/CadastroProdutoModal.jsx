import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Boxes,
  Save,
  X,
} from "lucide-react";

import "./CadastroProdutoModal.css";

/* =====================================================
   NÚMEROS
===================================================== */

function valorParaCampo(valor) {
  return valor === null ||
    valor === undefined ||
    valor === ""
    ? ""
    : String(valor).replace(".", ",");
}

function normalizarNumero(valor) {
  const texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "");

  if (!texto) {
    return null;
  }

  const normalizado =
    texto.includes(",") && texto.includes(".")
      ? texto.replace(/\./g, "").replace(",", ".")
      : texto.replace(",", ".");

  const numero = Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

/* =====================================================
   COMPONENTE
===================================================== */

export default function CadastroProdutoModal({
  aberto,
  item = null,
  salvando = false,
  onCancelar,
  onSalvar,
  buscarDescricaoEstoque,
}) {
  /* =================================================
     CAMPOS
  ================================================= */

  const [
    codigoProduto,
    setCodigoProduto,
  ] = useState("");

  const [
    nomeProduto,
    setNomeProduto,
  ] = useState("");

  const [
    cavidadeMolde,
    setCavidadeMolde,
  ] = useState("1");

  const [
    cicloSegundos,
    setCicloSegundos,
  ] = useState("");

  const [
    kgUn,
    setKgUn,
  ] = useState("");

  const [
    kgHaste,
    setKgHaste,
  ] = useState("");

  const [
    usaPp,
    setUsaPp,
  ] = useState(true);

  const [
    ativo,
    setAtivo,
  ] = useState(true);

  /* =================================================
     CAMPOS TÉCNICOS OCULTOS

     Preservados para não perder dados existentes.
  ================================================= */

  const [
    tempoInjecaoSegundos,
    setTempoInjecaoSegundos,
  ] = useState("");

  const [
    tempoResfriamentoSegundos,
    setTempoResfriamentoSegundos,
  ] = useState("");

  /* =================================================
     CONSULTA OMIE
  ================================================= */

  const [
    descricaoEstoque,
    setDescricaoEstoque,
  ] = useState("");

  const [
    buscandoDescricao,
    setBuscandoDescricao,
  ] = useState(false);

  const [
    avisoDescricao,
    setAvisoDescricao,
  ] = useState("");

  const [erro, setErro] = useState("");

  const consultaRef = useRef(0);

  const codigoRef = useRef("");

  const nomeAutomaticoRef = useRef("");

  /* =================================================
     CARREGAR PRODUTO
  ================================================= */

  useEffect(() => {
    ++consultaRef.current;

    if (!aberto) {
      return;
    }

    const codigo = item?.codigoProduto ?? "";

    codigoRef.current = codigo;

    nomeAutomaticoRef.current = "";

    setCodigoProduto(codigo);

    setNomeProduto(item?.nomeProduto ?? "");

    setCavidadeMolde(
      valorParaCampo(item?.cavidadeMolde ?? 1),
    );

    setCicloSegundos(
      valorParaCampo(item?.cicloSegundos),
    );

    setKgUn(
      valorParaCampo(item?.kgUn),
    );

    setKgHaste(
      valorParaCampo(item?.kgHaste),
    );

    setUsaPp(
      item ? item.usaPp === true : true,
    );

    setAtivo(item?.ativo !== false);

    setTempoInjecaoSegundos(
      valorParaCampo(item?.tempoInjecaoSegundos),
    );

    setTempoResfriamentoSegundos(
      valorParaCampo(item?.tempoResfriamentoSegundos),
    );

    setDescricaoEstoque(
      item?.descricaoEstoque ?? "",
    );

    setBuscandoDescricao(false);

    setAvisoDescricao("");

    setErro("");

  }, [aberto, item]);

  /* =================================================
     FECHAR COM ESC
  ================================================= */

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    const fecharEscape = (evento) => {
      if (
        evento.key === "Escape" &&
        !salvando
      ) {
        onCancelar?.();
      }
    };

    document.addEventListener(
      "keydown",
      fecharEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        fecharEscape,
      );
    };

  }, [
    aberto,
    salvando,
    onCancelar,
  ]);

  /* =================================================
     BLOQUEAR ROLAGEM
  ================================================= */

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    const anterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = anterior;
    };

  }, [aberto]);

  /* =================================================
     ALTERAR CÓDIGO
  ================================================= */

  function alterarCodigo(valor) {
    ++consultaRef.current;

    codigoRef.current = valor;

    setCodigoProduto(valor);

    setDescricaoEstoque("");

    setAvisoDescricao("");

    setBuscandoDescricao(false);

    /* Remove apenas nomes preenchidos automaticamente. */

    setNomeProduto((atual) => {
      if (
        nomeAutomaticoRef.current &&
        atual === nomeAutomaticoRef.current
      ) {
        nomeAutomaticoRef.current = "";

        return "";
      }

      nomeAutomaticoRef.current = "";

      return atual;
    });

    setErro("");
  }

  /* =================================================
     BUSCAR DESCRIÇÃO NO ESTOQUE

     Executado quando o usuário sai
     do campo Código.

     Não substitui nomes digitados manualmente.
  ================================================= */

  async function consultarEstoque() {
    const codigo = codigoProduto.trim();

    if (
      item ||
      !codigo ||
      typeof buscarDescricaoEstoque !== "function"
    ) {
      return;
    }

    const consulta = ++consultaRef.current;

    setBuscandoDescricao(true);

    setAvisoDescricao("");

    try {
      const descricao = await buscarDescricaoEstoque(
        codigo,
      );

      if (
        consulta !== consultaRef.current ||
        codigoRef.current.trim() !== codigo
      ) {
        return;
      }

      const encontrada = String(
        descricao ?? "",
      ).trim();

      setDescricaoEstoque(encontrada);

      if (encontrada) {
        setNomeProduto((atual) => {
          /* Preserva o nome digitado manualmente. */

          if (atual.trim()) {
            return atual;
          }

          nomeAutomaticoRef.current = encontrada;

          return encontrada;
        });
      } else {
        setAvisoDescricao(
          "Código não encontrado no estoque Omie. Informe o nome manualmente.",
        );
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

  /* =================================================
     SALVAR
  ================================================= */

  async function enviar(evento) {
    evento.preventDefault();

    setErro("");

    if (buscandoDescricao) {
      setErro(
        "Aguarde a consulta da descrição do produto.",
      );

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

    /* CONVERSÃO */

    const cavidadeFinal = normalizarNumero(
      cavidadeMolde,
    );

    const cicloFinal = normalizarNumero(
      cicloSegundos,
    );

    const kgUnFinal = normalizarNumero(
      kgUn,
    );

    const kgHasteFinal = normalizarNumero(
      kgHaste,
    );

    const injecaoFinal = normalizarNumero(
      tempoInjecaoSegundos,
    );

    const resfriamentoFinal = normalizarNumero(
      tempoResfriamentoSegundos,
    );

    /* VALIDAÇÕES */

    if (
      cavidadeFinal === null ||
      !Number.isInteger(cavidadeFinal) ||
      cavidadeFinal <= 0
    ) {
      setErro(
        "Informe uma quantidade de cavidades maior que zero.",
      );

      return;
    }

    if (
      cicloSegundos.trim() &&
      (
        cicloFinal === null ||
        cicloFinal <= 0
      )
    ) {
      setErro(
        "Informe um ciclo maior que zero.",
      );

      return;
    }

    if (
      kgUn.trim() &&
      (
        kgUnFinal === null ||
        kgUnFinal < 0
      )
    ) {
      setErro(
        "Informe um Kg/unidade válido.",
      );

      return;
    }

    if (
      kgHaste.trim() &&
      (
        kgHasteFinal === null ||
        kgHasteFinal < 0
      )
    ) {
      setErro(
        "Informe um Kg/haste válido.",
      );

      return;
    }

    /* =================================================
       ENVIAR PARA O SERVIÇO

       Peso duplicado:
       preserva o valor antigo para compatibilidade.

       KG/UN:
       continua sendo o peso utilizado nos cálculos.
    ================================================= */

    try {
      await onSalvar?.({
        codigoProduto: codigoFinal,

        codigoOriginal:
          item?.codigoProduto ?? null,

        nomeProduto: nomeFinal,

        usaPp,

        pesoKg:
          item?.pesoKg ?? null,

        ativo,

        cavidadeMolde: cavidadeFinal,

        cicloSegundos: cicloFinal,

        tempoInjecaoSegundos:
          injecaoFinal,

        tempoResfriamentoSegundos:
          resfriamentoFinal,

        kgUn: kgUnFinal,

        kgHaste: kgHasteFinal,
      });

    } catch (error) {
      setErro(
        error?.message ||
        "Não foi possível salvar o produto.",
      );
    }
  }

  if (!aberto) {
    return null;
  }

  /* =====================================================
     INTERFACE
  ===================================================== */

  return (
    <div className="produto-pp-modal-overlay">

      <div
        className="produto-pp-modal cadastro-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-produto-modal-titulo"
      >

        {/* CABEÇALHO */}

        <div className="produto-pp-modal-header">

          <div className="produto-pp-modal-header-icone">
            <Boxes
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="produto-pp-modal-header-texto">

            <span>Cadastro</span>

            <h3 id="cadastro-produto-modal-titulo">
              {item
                ? "Editar produto"
                : "Cadastrar produto"}
            </h3>

            <p>
              Dados gerais e parâmetros utilizados
              no planejamento de produção.
            </p>

          </div>

          <button
            type="button"
            className="produto-pp-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>

        </div>

        {/* FORMULÁRIO */}

        <form
          className="produto-pp-modal-form"
          onSubmit={enviar}
        >

          {/* CÓDIGO */}

          <label className="produto-pp-modal-campo">

            <span>Código</span>

            <input
              type="text"
              value={codigoProduto}
              onChange={(evento) =>
                alterarCodigo(evento.target.value)
              }
              onBlur={() => {
                void consultarEstoque();
              }}
              placeholder="Ex.: 11374"
              autoComplete="off"
              disabled={
                salvando ||
                Boolean(item)
              }
            />

          </label>

          {/* DESCRIÇÃO OMIE */}

          {descricaoEstoque && (
            <div
              className="produto-pp-modal-campo"
              style={{
                padding: "10px 12px",
                background: "#eff6ff",
                borderRadius: 8,
              }}
            >

              <span>
                Descrição encontrada no estoque Omie
              </span>

              <strong
                style={{
                  display: "block",
                  marginTop: 4,
                }}
              >
                {descricaoEstoque}
              </strong>

              {item &&
                descricaoEstoque !== item.nomeProduto && (
                  <small>
                    O nome cadastrado permanece inalterado
                    até você decidir editá-lo.
                  </small>
                )}

            </div>
          )}

          {/* CARREGAMENTO DA CONSULTA */}

          {buscandoDescricao && (
            <small role="status">
              Consultando descrição no estoque Omie...
            </small>
          )}

          {avisoDescricao && (
            <small role="status">
              {avisoDescricao}
            </small>
          )}

          {/* NOME */}

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

          {/* KG/UN E KG/HASTE */}

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

          {/* OPÇÕES */}

          <div className="cadastro-produto-modal-status-grid">

            <label className="produto-pp-modal-status">

              <input
                type="checkbox"
                checked={usaPp}
                onChange={(evento) => {
                  setUsaPp(evento.target.checked);
                  setErro("");
                }}
                disabled={salvando}
              />

              <div>

                <strong>Usa PP</strong>

                <span>
                  Produto utiliza PP no cálculo
                  de matéria-prima.
                </span>

              </div>

            </label>

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

                <span>
                  Produtos inativos permanecem
                  no histórico do sistema.
                </span>

              </div>

            </label>

          </div>

          {/* ERRO */}

          {erro && (
            <div
              className="produto-pp-modal-erro"
              role="alert"
            >
              {erro}
            </div>
          )}

          {/* AÇÕES */}

          <div className="produto-pp-modal-acoes">

            <button
              type="button"
              className="produto-pp-modal-cancelar"
              onClick={onCancelar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="produto-pp-modal-salvar"
              disabled={
                salvando ||
                buscandoDescricao
              }
            >

              <Save size={17} />

              {salvando
                ? "Salvando..."
                : "Salvar produto"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}