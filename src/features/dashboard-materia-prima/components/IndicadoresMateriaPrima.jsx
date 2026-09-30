import {
  BadgeDollarSign,
  Banknote,
  Building2,
  CircleDollarSign,
  Clock3,
  Gauge,
  PackageCheck,
  ReceiptText,
  Scale,
  ShoppingCart,
  Truck,
} from "lucide-react";

import KpiCard
  from "./KpiCard.jsx";

import {
  formatarKg,
  formatarMoeda,
  formatarMoedaKg,
  formatarNumero,
} from "../dashboardMateriaPrimaUtils.js";

import {
  formatarDias,
  formatarPercentual,
} from "./materiaPrimaFormatters.js";


/* =========================================================
   AVISOS
========================================================= */

export function AvisosMateriaPrima({
  resumo,
  materialSelecionado,
}) {
  const misturaMateriais =
    Number(
      resumo?.materiaisDistintos ||
      0,
    ) > 1;


  return (
    <>
      {Number(
        resumo?.comprasSemPreco ||
        0,
      ) > 0 && (
        <div className="dmp-mensagem aviso">
          <ReceiptText
            size={18}
          />

          <span>
            {resumo.comprasSemPreco} compra(s) do período ainda
            não possuem preço financeiro preenchido.
          </span>
        </div>
      )}


      {misturaMateriais &&
        materialSelecionado ===
          "todos" && (
        <div className="dmp-mensagem informativa">
          <BadgeDollarSign
            size={18}
          />

          <span>
            Existem {resumo.materiaisDistintos} materiais no período.
            Preço médio e custo por kg permanecem separados por
            material para não gerar uma média gerencial distorcida.
          </span>
        </div>
      )}
    </>
  );
}


/* =========================================================
   INDICADORES PRINCIPAIS
========================================================= */

export function IndicadoresPrincipaisMateriaPrima({
  resumo,
  misturaMateriais,
  carregando,
}) {
  return (
    <section className="dmp-secao">

      <div className="dmp-secao-titulo">

        <div>
          <h2>
            Indicadores principais
          </h2>
        </div>

        <small>
          Valores considerando os filtros selecionados
        </small>

      </div>


      <div className="dmp-kpis">

        <KpiCard
          titulo="Subtotal dos materiais"
          valor={
            carregando
              ? "..."
              : formatarMoeda(
                  resumo.subtotalProdutos,
                  2,
                )
          }
          subtitulo="Somente quantidade × preço do material"
          icone={
            Banknote
          }
          tipo="azul"
        />


        <KpiCard
          titulo="Total comprado"
          valor={
            carregando
              ? "..."
              : formatarMoeda(
                  resumo.valorTotal,
                  2,
                )
          }
          subtitulo={
            `${resumo.compras} compra(s) • ticket ${formatarMoeda(
              resumo.ticketMedio,
              2,
            )}`
          }
          icone={
            CircleDollarSign
          }
          tipo="ok"
        />


        <KpiCard
          titulo="Quantidade comprada"
          valor={
            carregando
              ? "..."
              : formatarKg(
                  resumo.quantidadeCompradaKg,
                  0,
                )
          }
          subtitulo={
            `Média de ${formatarKg(
              resumo.quantidadeMediaCompraKg,
              0,
            )} por compra`
          }
          icone={
            Scale
          }
        />


        <KpiCard
          titulo="Preço médio"
          valor={
            carregando
              ? "..."
              : formatarMoedaKg(
                  resumo.precoMedioKg,
                  3,
                )
          }
          subtitulo={
            misturaMateriais
              ? "Selecione um material para analisar"
              : "Preço de compra ponderado"
          }
          icone={
            BadgeDollarSign
          }
        />


        <KpiCard
          titulo="Custo efetivo médio"
          valor={
            carregando
              ? "..."
              : formatarMoedaKg(
                  resumo.custoEfetivoMedioKg,
                  3,
                )
          }
          subtitulo={
            misturaMateriais
              ? "Selecione um material para analisar"
              : "Preço + impostos + frete + despesas"
          }
          icone={
            CircleDollarSign
          }
          tipo="ok"
        />


        <KpiCard
          titulo="Acréscimos líquidos"
          valor={
            carregando
              ? "..."
              : formatarMoeda(
                  resumo.acrescimosLiquidos,
                  2,
                )
          }
          subtitulo={
            `${formatarPercentual(
              resumo.impactoAcrescimosPercentual,
              1,
            )} sobre o valor base`
          }
          icone={
            Gauge
          }
          tipo={
            Number(
              resumo.acrescimosLiquidos ||
              0,
            ) > 0
              ? "alerta"
              : "ok"
          }
        />


        <KpiCard
          titulo="Compras em aberto"
          valor={
            carregando
              ? "..."
              : formatarMoeda(
                  resumo.valorComprasAbertas,
                  2,
                )
          }
          subtitulo={
            `${resumo.comprasAbertas} compra(s) • ${formatarKg(
              resumo.quantidadeComprasAbertasKg,
              0,
            )}`
          }
          icone={
            ShoppingCart
          }
          tipo="alerta"
        />


        <KpiCard
          titulo="Recebido no período"
          valor={
            carregando
              ? "..."
              : formatarMoeda(
                  resumo.valorRecebidoPeriodo,
                  2,
                )
          }
          subtitulo={
            `${resumo.recebimentosPeriodo} recebimento(s) • ${formatarKg(
              resumo.quantidadeRecebidaKg,
              0,
            )}`
          }
          icone={
            PackageCheck
          }
          tipo="ok"
        />


        <KpiCard
          titulo="Fornecedores ativos"
          valor={
            carregando
              ? "..."
              : formatarNumero(
                  resumo.fornecedoresDistintos,
                  0,
                )
          }
          subtitulo={
            `${resumo.materiaisDistintos} material(is) no período`
          }
          icone={
            Building2
          }
        />

      </div>

    </section>
  );
}


/* =========================================================
   EFICIÊNCIA DE ENTREGA
========================================================= */

export function EficienciaEntregaMateriaPrima({
  resumo,
  carregando,
}) {
  return (
    <section className="dmp-secao">

      <div className="dmp-secao-titulo">

        <div>
          <span>
            Fornecimento
          </span>

          <h2>
            Eficiência de entrega
          </h2>
        </div>

        <small>
          Calculado sobre recebimentos do período
        </small>

      </div>


      <div className="dmp-mini-kpis">

        <article>
          <Clock3
            size={19}
          />

          <div>
            <span>
              Prazo médio
            </span>

            <strong>
              {carregando
                ? "..."
                : formatarDias(
                    resumo.prazoMedioEntregaDias,
                  )}
            </strong>

            <small>
              Compra até recebimento
            </small>
          </div>
        </article>


        <article>
          <PackageCheck
            size={19}
          />

          <div>
            <span>
              Pontualidade
            </span>

            <strong>
              {carregando
                ? "..."
                : formatarPercentual(
                    resumo.pontualidadePercentual,
                    1,
                  )}
            </strong>

            <small>
              Recebimentos dentro da previsão
            </small>
          </div>
        </article>


        <article>
          <Truck
            size={19}
          />

          <div>
            <span>
              Entregas avaliadas
            </span>

            <strong>
              {carregando
                ? "..."
                : formatarNumero(
                    resumo.entregasAvaliadas,
                    0,
                  )}
            </strong>

            <small>
              Com datas suficientes para cálculo
            </small>
          </div>
        </article>


        <article>
          <ReceiptText
            size={19}
          />

          <div>
            <span>
              Atrasos
            </span>

            <strong>
              {carregando
                ? "..."
                : formatarNumero(
                    resumo.atrasos,
                    0,
                  )}
            </strong>

            <small>
              Média de{" "}
              {formatarDias(
                resumo.atrasoMedioDias,
              )}
            </small>
          </div>
        </article>

      </div>

    </section>
  );
}