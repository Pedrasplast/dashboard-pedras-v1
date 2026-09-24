import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Save,
  ShoppingCart,
  X,
} from "lucide-react";

import {
  calcularResumoFinanceiroCompra,
  TIPOS_FRETE,
} from "./comprasFuturasService";

import "./CompraFuturaModal.css";

function dataHojeLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function normalizarNumero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  const texto = String(valor).trim().replace(/\s/g, "");
  if (!texto) return null;

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function numeroParaInput(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  return String(valor).replace(".", ",");
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarPrecoKg(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  })}/kg`;
}

function CampoNumero({
  titulo,
  value,
  onChange,
  placeholder,
  sufixo = null,
  disabled = false,
}) {
  return (
    <label className="compra-futura-modal-campo">
      <span>{titulo}</span>

      {sufixo ? (
        <div className="compra-futura-modal-numero">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
          <span>{sufixo}</span>
        </div>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </label>
  );
}

export default function CompraFuturaModal({
  aberto,
  item = null,
  fornecedores = [],
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [dataCompra, setDataCompra] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [quantidadeKg, setQuantidadeKg] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [observacao, setObservacao] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [precoUnitario, setPrecoUnitario] = useState("");
  const [ipiPercentual, setIpiPercentual] = useState("");
  const [valorFrete, setValorFrete] = useState("");
  const [tipoFrete, setTipoFrete] = useState("");
  const [valorDesconto, setValorDesconto] = useState("");
  const [outrasDespesas, setOutrasDespesas] = useState("");
  const [numeroNf, setNumeroNf] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [observacaoFinanceira, setObservacaoFinanceira] = useState("");

  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;

    const hoje = dataHojeLocal();

    if (item) {
      setDataCompra(item.dataCompra || hoje);
      setDataPrevista(item.dataPrevista || hoje);
      setFornecedorId(String(item.fornecedorId ?? ""));
      setQuantidadeKg(numeroParaInput(item.quantidadeKg));
      setNumeroPedido(item.numeroPedido || "");
      setObservacao(item.observacao || "");
      setAtivo(item.ativo !== false);

      setPrecoUnitario(numeroParaInput(item.precoUnitario));
      setIpiPercentual(numeroParaInput(item.ipiPercentual));
      setValorFrete(numeroParaInput(item.valorFrete));
      setTipoFrete(item.tipoFrete || "");
      setValorDesconto(numeroParaInput(item.valorDesconto));
      setOutrasDespesas(numeroParaInput(item.outrasDespesas));
      setNumeroNf(item.numeroNf || "");
      setCondicaoPagamento(item.condicaoPagamento || "");
      setObservacaoFinanceira(item.observacaoFinanceira || "");
    } else {
      setDataCompra(hoje);
      setDataPrevista(hoje);
      setFornecedorId("");
      setQuantidadeKg("");
      setNumeroPedido("");
      setObservacao("");
      setAtivo(true);

      setPrecoUnitario("");
      setIpiPercentual("");
      setValorFrete("");
      setTipoFrete("");
      setValorDesconto("");
      setOutrasDespesas("");
      setNumeroNf("");
      setCondicaoPagamento("");
      setObservacaoFinanceira("");
    }

    setErro("");
  }, [aberto, item]);

  useEffect(() => {
    if (!aberto) return undefined;

    function teclado(event) {
      if (event.key === "Escape" && !salvando) {
        onCancelar?.();
      }
    }

    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  }, [aberto, salvando, onCancelar]);

  const resumoFinanceiro = useMemo(
    () =>
      calcularResumoFinanceiroCompra({
        quantidadeKg,
        precoUnitario,
        ipiPercentual,
        valorFrete,
        tipoFrete,
        valorDesconto,
        outrasDespesas,
      }),
    [
      quantidadeKg,
      precoUnitario,
      ipiPercentual,
      valorFrete,
      tipoFrete,
      valorDesconto,
      outrasDespesas,
    ],
  );

  function alterarTipoFrete(novoTipo) {
    setTipoFrete(novoTipo);

    if (novoTipo === "SEM_FRETE") {
      setValorFrete("0");
    }

    setErro("");
  }

  function validarFinanceiro() {
    const campos = [
      ["Preço unitário", precoUnitario, { minimo: 0 }],
      ["IPI", ipiPercentual, { minimo: 0, maximo: 100 }],
      ["Frete", valorFrete, { minimo: 0 }],
      ["Desconto", valorDesconto, { minimo: 0 }],
      ["Outras despesas", outrasDespesas, { minimo: 0 }],
    ];

    for (const [nome, valor, regra] of campos) {
      if (String(valor ?? "").trim() === "") continue;

      const numero = normalizarNumero(valor);

      if (numero === null) {
        return `${nome}: informe um valor numérico válido.`;
      }

      if (numero < regra.minimo) {
        return `${nome}: o valor não pode ser negativo.`;
      }

      if (regra.maximo !== undefined && numero > regra.maximo) {
        return `${nome}: o valor máximo é ${regra.maximo}.`;
      }
    }

    if (
      resumoFinanceiro.valorTotal !== null &&
      resumoFinanceiro.valorTotal < 0
    ) {
      return "O valor total ficou negativo. Revise o desconto informado.";
    }

    return "";
  }

  async function enviar(event) {
    event.preventDefault();
    setErro("");

    const quantidade = normalizarNumero(quantidadeKg);

    if (!dataCompra) {
      setErro("Informe a data da compra.");
      return;
    }

    if (!dataPrevista) {
      setErro("Informe a previsão de chegada.");
      return;
    }

    if (dataPrevista < dataCompra) {
      setErro("A previsão não pode ser anterior à data da compra.");
      return;
    }

    if (!fornecedorId) {
      setErro("Selecione o fornecedor.");
      return;
    }

    if (quantidade === null || quantidade <= 0) {
      setErro("Informe uma quantidade maior que zero.");
      return;
    }

    const erroFinanceiro = validarFinanceiro();

    if (erroFinanceiro) {
      setErro(erroFinanceiro);
      return;
    }

    try {
      await onSalvar?.({
        id: item?.id ?? null,
        dataCompra,
        dataPrevista,
        dataRecebimento: item?.dataRecebimento ?? null,
        fornecedorId,
        quantidadeKg: quantidade,
        numeroPedido,
        status:
          item?.status === "RECEBIDA" || item?.status === "CANCELADA"
            ? item.status
            : "CONFIRMADA",
        observacao,
        ativo,

        precoUnitario: normalizarNumero(precoUnitario),
        ipiPercentual: normalizarNumero(ipiPercentual),
        valorFrete: normalizarNumero(valorFrete),
        tipoFrete,
        valorDesconto: normalizarNumero(valorDesconto),
        outrasDespesas: normalizarNumero(outrasDespesas),
        numeroNf,
        condicaoPagamento,
        observacaoFinanceira,
      });
    } catch (error) {
      setErro(error?.message || "Não foi possível salvar a compra.");
    }
  }

  if (!aberto) return null;

  return (
    <div className="compra-futura-modal-overlay">
      <div className="compra-futura-modal">
        <div className="compra-futura-modal-header">
          <div className="compra-futura-modal-icone">
            <ShoppingCart size={22} aria-hidden="true" />
          </div>

          <div className="compra-futura-modal-header-texto">
            <span>Matéria-Prima PP</span>

            <h3>
              {item ? "Editar compra" : "Nova compra futura"}
            </h3>

            <p>
              Cadastre ou edite os dados da compra. A chegada é confirmada separadamente.
            </p>
          </div>

          <button
            type="button"
            className="compra-futura-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <form className="compra-futura-modal-form" onSubmit={enviar}>
          <section className="compra-futura-modal-secao">
            <div className="compra-futura-modal-secao-titulo">
              <strong>Dados da compra</strong>
              <span>Informações operacionais e previsão de recebimento.</span>
            </div>

            <div className="compra-futura-modal-grid">
              <label className="compra-futura-modal-campo">
                <span>Data da compra</span>

                <input
                  type="date"
                  value={dataCompra}
                  onChange={(event) => {
                    const valor = event.target.value;
                    setDataCompra(valor);

                    if (dataPrevista < valor) {
                      setDataPrevista(valor);
                    }
                  }}
                  disabled={salvando}
                />
              </label>

              <label className="compra-futura-modal-campo">
                <span>Previsão de chegada</span>

                <input
                  type="date"
                  min={dataCompra}
                  value={dataPrevista}
                  onChange={(event) => setDataPrevista(event.target.value)}
                  disabled={salvando}
                />
              </label>
            </div>

            <label className="compra-futura-modal-campo">
              <span>Fornecedor / fonte</span>

              <select
                value={fornecedorId}
                onChange={(event) => setFornecedorId(event.target.value)}
                disabled={salvando}
              >
                <option value="">Selecione</option>

                {fornecedores
                  .filter(
                    (fornecedor) =>
                      fornecedor.ativo ||
                      String(fornecedor.id) === String(fornecedorId),
                  )
                  .map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                      {!fornecedor.ativo ? " (Inativo)" : ""}
                    </option>
                  ))}
              </select>
            </label>

            <div className="compra-futura-modal-grid">
              <CampoNumero
                titulo="Quantidade"
                value={quantidadeKg}
                onChange={setQuantidadeKg}
                placeholder="Ex.: 12000"
                sufixo="kg"
                disabled={salvando}
              />

              <label className="compra-futura-modal-campo">
                <span>Pedido / OC</span>

                <input
                  type="text"
                  value={numeroPedido}
                  onChange={(event) => setNumeroPedido(event.target.value)}
                  placeholder="Ex.: 14587"
                  disabled={salvando}
                />
              </label>
            </div>

            <div className="compra-futura-modal-status">
              <CheckCircle2 size={17} aria-hidden="true" />

              <div>
                <strong>
                  Status: {item?.status === "RECEBIDA"
                    ? "Recebida"
                    : item?.status === "CANCELADA"
                      ? "Cancelada"
                      : "Confirmada"}
                </strong>

                <span>
                  {item?.status === "RECEBIDA"
                    ? "A chegada desta compra já foi confirmada. O recebimento não é alterado nesta edição."
                    : item?.status === "CANCELADA"
                      ? "A compra está cancelada e o status não é alterado nesta edição."
                      : "A compra permanece confirmada. Para registrar a chegada, use o botão Confirmar chegada na tabela."}
                </span>
              </div>
            </div>

            <label className="compra-futura-modal-campo">
              <span>Observação</span>

              <textarea
                rows={3}
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                placeholder="Informações operacionais adicionais..."
                disabled={salvando}
              />
            </label>
          </section>

          <section className="compra-futura-modal-secao compra-futura-modal-secao-financeira">
            <div className="compra-futura-modal-secao-titulo">
              <strong>Valores e custos</strong>
              <span>
                Preencha o que estiver disponível. Os totais são calculados
                automaticamente.
              </span>
            </div>

            <div className="compra-futura-modal-grid compra-futura-modal-grid-3">
              <CampoNumero
                titulo="Preço unitário"
                value={precoUnitario}
                onChange={setPrecoUnitario}
                placeholder="Ex.: 4,25"
                sufixo="R$/kg"
                disabled={salvando}
              />

              <CampoNumero
                titulo="IPI"
                value={ipiPercentual}
                onChange={setIpiPercentual}
                placeholder="Ex.: 5"
                sufixo="%"
                disabled={salvando}
              />

              <label className="compra-futura-modal-campo">
                <span>Tipo de frete</span>

                <select
                  value={tipoFrete}
                  onChange={(event) => alterarTipoFrete(event.target.value)}
                  disabled={salvando}
                >
                  {TIPOS_FRETE.map((tipo) => (
                    <option key={tipo.valor || "NAO_INFORMADO"} value={tipo.valor}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="compra-futura-modal-grid compra-futura-modal-grid-3">
              <CampoNumero
                titulo="Valor do frete"
                value={valorFrete}
                onChange={setValorFrete}
                placeholder="Ex.: 1200,00"
                sufixo="R$"
                disabled={salvando || tipoFrete === "SEM_FRETE"}
              />

              <CampoNumero
                titulo="Desconto"
                value={valorDesconto}
                onChange={setValorDesconto}
                placeholder="Ex.: 500,00"
                sufixo="R$"
                disabled={salvando}
              />

              <CampoNumero
                titulo="Outras despesas"
                value={outrasDespesas}
                onChange={setOutrasDespesas}
                placeholder="Ex.: 0,00"
                sufixo="R$"
                disabled={salvando}
              />
            </div>

            <div className="compra-futura-modal-resumo">
              <div>
                <span>Subtotal</span>
                <strong>{formatarMoeda(resumoFinanceiro.subtotalProdutos)}</strong>
              </div>

              <div>
                <span>Valor do IPI</span>
                <strong>{formatarMoeda(resumoFinanceiro.valorIpi)}</strong>
              </div>

              <div className="compra-futura-modal-resumo-destaque">
                <span>Total da compra</span>
                <strong>{formatarMoeda(resumoFinanceiro.valorTotal)}</strong>
              </div>

              <div>
                <span>Custo efetivo</span>
                <strong>{formatarPrecoKg(resumoFinanceiro.custoEfetivoKg)}</strong>
              </div>
            </div>

            {!resumoFinanceiro.precoUnitario && (
              <p className="compra-futura-modal-ajuda">
                Informe o preço unitário para calcular subtotal, total e custo
                efetivo por kg.
              </p>
            )}

            <div className="compra-futura-modal-grid">
              <label className="compra-futura-modal-campo">
                <span>Número da NF</span>

                <input
                  type="text"
                  value={numeroNf}
                  onChange={(event) => setNumeroNf(event.target.value)}
                  placeholder="Ex.: 123456"
                  disabled={salvando}
                />
              </label>

              <label className="compra-futura-modal-campo">
                <span>Condição de pagamento</span>

                <input
                  type="text"
                  value={condicaoPagamento}
                  onChange={(event) => setCondicaoPagamento(event.target.value)}
                  placeholder="Ex.: 30/60 dias"
                  disabled={salvando}
                />
              </label>
            </div>

            <label className="compra-futura-modal-campo">
              <span>Observação financeira</span>

              <textarea
                rows={3}
                value={observacaoFinanceira}
                onChange={(event) => setObservacaoFinanceira(event.target.value)}
                placeholder="Condições comerciais, ajustes, créditos ou informações fiscais..."
                disabled={salvando}
              />
            </label>
          </section>

          <label className="compra-futura-modal-status">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(event) => setAtivo(event.target.checked)}
              disabled={salvando}
            />

            <div>
              <strong>Compra ativa</strong>
              <span>Compras inativas não entram nos cálculos da projeção.</span>
            </div>
          </label>

          {erro && (
            <div className="compra-futura-modal-erro">
              {erro}
            </div>
          )}

          <div className="compra-futura-modal-acoes">
            <button
              type="button"
              className="compra-futura-modal-cancelar"
              onClick={onCancelar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="compra-futura-modal-salvar"
              disabled={salvando}
            >
              <Save size={17} />
              {salvando ? "Salvando..." : "Salvar compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
