export function numero(valor) {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

export function formatarNumero(valor, casas = 0) {
  return numero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarData(valor) {
  if (!valor) return "-";

  // Datas vindas do PostgreSQL como DATE chegam no formato YYYY-MM-DD,
  // sem fuso horário. new Date("YYYY-MM-DD") interpreta esse valor como UTC
  // e, no Brasil, pode exibir o dia anterior. Por isso DATE é montado em
  // horário local e TIMESTAMP continua sendo tratado normalmente.
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-").map(Number);
    const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0, 0);

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dataLocal);
  }

  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

export function formatarDataHora(valor) {
  if (!valor) return "-";
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

export function dataHoraLocalParaInput(valor) {
  const data = valor instanceof Date ? valor : new Date(valor);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

export function chaveDataLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function dataLocalMeiaNoite(chave) {
  const [ano, mes, dia] = String(chave).split("-").map(Number);
  return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
}

export function adicionarDias(data, quantidade) {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + quantidade);
  return copia;
}

export function consolidarItensPedido(registros) {
  const mapa = new Map();

  for (const registro of registros ?? []) {
    const codigoProduto = String(registro?.codigo_produto ?? "").trim();
    if (!codigoProduto) continue;

    const chave = `${registro?.codigo_pedido_omie}:${codigoProduto}`;
    const atual = mapa.get(chave);

    if (atual) {
      atual.quantidade += numero(registro?.quantidade);
      continue;
    }

    mapa.set(chave, {
      codigo_pedido_omie: registro?.codigo_pedido_omie,
      numero_pedido: String(registro?.numero_pedido ?? ""),
      cliente: registro?.cliente || "Cliente não identificado",
      previsao: registro?.previsao || null,
      data_pedido: registro?.data_pedido || null,
      status: registro?.status || "Pedido",
      codigo_produto: codigoProduto,
      produto: registro?.produto || "Produto sem descrição",
      quantidade: numero(registro?.quantidade),
    });
  }

  return [...mapa.values()];
}

export function compararPedidos(a, b) {
  const dataA = a.previsao || a.data_pedido || "9999-12-31";
  const dataB = b.previsao || b.data_pedido || "9999-12-31";
  if (dataA !== dataB) return dataA.localeCompare(dataB);
  return String(a.numero_pedido).localeCompare(String(b.numero_pedido), "pt-BR", {
    numeric: true,
  });
}
