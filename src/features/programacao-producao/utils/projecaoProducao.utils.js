import { JORNADAS } from "../programacaoProducao.constants";
import {
  adicionarDias,
  chaveDataLocal,
  compararPedidos,
  consolidarItensPedido,
  dataLocalMeiaNoite,
  numero,
} from "./programacaoProducao.utils";
import {
  calcularDataAtendimentoProducao,
  calcularPlanoProducaoContinuo,
} from "./planoProducao.utils";

function montarProduto({ codigoProduto, pedidos, estoqueInicial, parametro, programacao, periodos }) {
  const pedidosOrdenados = [...pedidos].sort(compararPedidos);
  const cicloSegundos = numero(parametro?.ciclo_segundos);
  const cavidades = Math.max(1, Math.floor(numero(parametro?.cavidade_molde) || 1));
  const temCiclo = cicloSegundos > 0;
  const quantidadePedida = pedidosOrdenados.reduce(
    (total, pedido) => total + numero(pedido.quantidade),
    0,
  );
  const necessidadeProducao = Math.max(0, quantidadePedida - estoqueInicial);

  const datasPedidosOrdenadas = pedidosOrdenados
    .map((pedido) => pedido.previsao || pedido.data_pedido)
    .filter(Boolean)
    .sort();
  const ultimaDataPedidoPlanejada =
    datasPedidosOrdenadas[datasPedidosOrdenadas.length - 1] ?? null;

  const jornadaHoras = numero(programacao?.jornada_horas);
  const trabalhaSabado = Boolean(programacao?.trabalha_sabado);
  const jornadaSabadoHoras = trabalhaSabado
    ? numero(programacao?.jornada_sabado_horas || jornadaHoras)
    : 0;
  const trabalhaDomingo = Boolean(programacao?.trabalha_domingo);
  const jornadaDomingoHoras = trabalhaDomingo
    ? numero(programacao?.jornada_domingo_horas || jornadaHoras)
    : 0;
  const inicio = programacao?.inicio_em ? new Date(programacao.inicio_em) : null;
  const programado = Boolean(
    inicio &&
      !Number.isNaN(inicio.getTime()) &&
      JORNADAS.includes(jornadaHoras) &&
      temCiclo &&
      necessidadeProducao > 0,
  );

  const planoProducao = programado
    ? calcularPlanoProducaoContinuo({
        inicio,
        dataFim: ultimaDataPedidoPlanejada,
        jornadaHoras,
        cicloSegundos,
        cavidades,
        periodos,
        trabalhaSabado,
        jornadaSabadoHoras,
        trabalhaDomingo,
        jornadaDomingoHoras,
      })
    : { producaoPorData: new Map(), termino: null, pecasPlanejadas: 0 };

  const producaoPorData = planoProducao.producaoPorData;
  const terminoCalculado = planoProducao.termino;

  const pedidosPorData = new Map();
  for (const pedido of pedidosOrdenados) {
    const data = pedido.previsao || pedido.data_pedido;
    if (!data) continue;
    if (!pedidosPorData.has(data)) pedidosPorData.set(data, []);
    pedidosPorData.get(data).push(pedido);
  }

  const datasPedidos = [...pedidosPorData.keys()].sort();
  const primeiraDataPedido = datasPedidos[0] ?? null;
  const ultimaDataPedido = datasPedidos[datasPedidos.length - 1] ?? null;
  const dataInicioProgramacao = programado ? chaveDataLocal(inicio) : null;
  const dataTerminoProgramacao = terminoCalculado ? chaveDataLocal(terminoCalculado) : null;

  const candidatosInicio = [primeiraDataPedido, dataInicioProgramacao].filter(Boolean);
  const candidatosFim = [ultimaDataPedido, dataTerminoProgramacao].filter(Boolean);
  const inicioProjecao = candidatosInicio.length > 0 ? candidatosInicio.sort()[0] : null;
  const fimProjecao = candidatosFim.length > 0 ? candidatosFim.sort().at(-1) : null;

  let saldoAtual = estoqueInicial;
  let saldoSemProducao = estoqueInicial;
  let demandaAcumulada = 0;
  const pedidosCalculados = [];
  const projecaoDiaria = [];

  if (inicioProjecao && fimProjecao) {
    let dia = dataLocalMeiaNoite(inicioProjecao);
    const fim = dataLocalMeiaNoite(fimProjecao);

    for (let seguranca = 0; dia <= fim && seguranca < 366; seguranca += 1) {
      const chave = chaveDataLocal(dia);
      const saldoInicialDia = saldoAtual;
      const producaoDia = numero(producaoPorData.get(chave)?.producao);
      saldoAtual += producaoDia;

      const pedidosDia = [...(pedidosPorData.get(chave) ?? [])].sort(compararPedidos);
      const pedidosDiaCalculados = [];
      let saidaDia = 0;

      for (const pedido of pedidosDia) {
        const quantidade = numero(pedido.quantidade);
        const saldoAntesPedido = saldoAtual;
        const cobertoSomentePorEstoque = saldoSemProducao >= quantidade;

        demandaAcumulada += quantidade;
        const producaoNecessariaAtePedido = Math.max(0, demandaAcumulada - estoqueInicial);
        const atendimentoEstimado = producaoNecessariaAtePedido <= 0
          ? null
          : programado
            ? calcularDataAtendimentoProducao({
                quantidadeNecessaria: producaoNecessariaAtePedido,
                inicio,
                jornadaHoras,
                cicloSegundos,
                cavidades,
                periodos,
                trabalhaSabado,
                jornadaSabadoHoras,
                trabalhaDomingo,
                jornadaDomingoHoras,
              })
            : null;

        const situacao = saldoAntesPedido >= quantidade
          ? cobertoSomentePorEstoque
            ? "estoque"
            : "producao"
          : "risco";

        saldoAtual -= quantidade;
        saldoSemProducao -= quantidade;
        saidaDia += quantidade;

        const pedidoCalculado = {
          ...pedido,
          situacao,
          saldo_anterior: saldoAntesPedido,
          saldo_apos: saldoAtual,
          producao_necessaria_ate_pedido: producaoNecessariaAtePedido,
          atendimento_estimado: atendimentoEstimado,
          atendimento_por_estoque: producaoNecessariaAtePedido <= 0,
        };
        pedidosDiaCalculados.push(pedidoCalculado);
        pedidosCalculados.push(pedidoCalculado);
      }

      const temRisco = pedidosDiaCalculados.some((pedido) => pedido.situacao === "risco");
      projecaoDiaria.push({
        data: chave,
        saldo_inicial: saldoInicialDia,
        producao: producaoDia,
        pedidos: pedidosDiaCalculados,
        saida: saidaDia,
        saldo_final: saldoAtual,
        situacao: temRisco
          ? "risco"
          : pedidosDiaCalculados.length > 0
            ? "pedido"
            : producaoDia > 0
              ? "producao"
              : "sem_movimento",
      });

      dia = adicionarDias(dia, 1);
    }
  }

  const pedidosRisco = pedidosCalculados.filter((p) => p.situacao === "risco").length;
  const horasNecessarias = temCiclo
    ? (Math.ceil(necessidadeProducao / cavidades) * cicloSegundos) / 3600
    : 0;

  return {
    codigo_produto: codigoProduto,
    produto: pedidosOrdenados[0]?.produto || parametro?.descricao || "Produto sem descrição",
    estoque_inicial: estoqueInicial,
    quantidade_pedida: quantidadePedida,
    necessidade_producao: necessidadeProducao,
    producao_planejada: planoProducao.pecasPlanejadas,
    saldo_final_projetado: projecaoDiaria.length > 0 ? projecaoDiaria.at(-1)?.saldo_final ?? estoqueInicial : estoqueInicial,
    horas_necessarias: horasNecessarias,
    ciclo_segundos: cicloSegundos,
    cavidades,
    tem_ciclo: temCiclo,
    quantidade_pedidos: pedidosOrdenados.length,
    pedidos: pedidosCalculados,
    projecao_diaria: projecaoDiaria,
    programacao,
    programado,
    jornada_horas: jornadaHoras,
    trabalha_sabado: trabalhaSabado,
    jornada_sabado_horas: jornadaSabadoHoras,
    trabalha_domingo: trabalhaDomingo,
    jornada_domingo_horas: jornadaDomingoHoras,
    inicio_producao: inicio,
    termino_calculado: terminoCalculado,
    pedidos_risco: pedidosRisco,
  };
}

export function montarProgramacao({ pedidos, estoque, parametros, programacoes, periodos }) {
  const estoquePorProduto = new Map();
  for (const item of estoque ?? []) {
    const codigo = String(item?.codigo_produto ?? "").trim();
    if (!codigo) continue;
    estoquePorProduto.set(codigo, numero(estoquePorProduto.get(codigo)) + numero(item?.saldo));
  }

  const parametroPorProduto = new Map();
  for (const item of parametros ?? []) {
    const codigo = String(item?.cod_prod ?? "").trim();
    if (codigo) parametroPorProduto.set(codigo, item);
  }

  const programacaoPorProduto = new Map();
  for (const item of programacoes ?? []) {
    const codigo = String(item?.codigo_produto ?? "").trim();
    if (codigo) programacaoPorProduto.set(codigo, item);
  }

  const pedidosPorProduto = new Map();
  for (const pedido of consolidarItensPedido(pedidos)) {
    if (!pedidosPorProduto.has(pedido.codigo_produto)) {
      pedidosPorProduto.set(pedido.codigo_produto, []);
    }
    pedidosPorProduto.get(pedido.codigo_produto).push(pedido);
  }

  return [...pedidosPorProduto.entries()]
    .map(([codigoProduto, pedidosProduto]) =>
      montarProduto({
        codigoProduto,
        pedidos: pedidosProduto,
        estoqueInicial: numero(estoquePorProduto.get(codigoProduto)),
        parametro: parametroPorProduto.get(codigoProduto),
        programacao: programacaoPorProduto.get(codigoProduto) ?? null,
        periodos,
      }),
    )
    .sort((a, b) => {
      if (a.pedidos_risco !== b.pedidos_risco) return b.pedidos_risco - a.pedidos_risco;
      if (a.necessidade_producao !== b.necessidade_producao) {
        return b.necessidade_producao - a.necessidade_producao;
      }
      return a.codigo_produto.localeCompare(b.codigo_produto, "pt-BR", { numeric: true });
    });
}
