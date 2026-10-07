import {
  Boxes,
  PackageCheck,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

import EstoqueKpiCard
  from "./EstoqueKpiCard";

import {
  formatarNumero,
} from "../utils/estoque.utils";


export default function EstoqueKpis({
  indicadores,

  localAtual,

  carregando,
}) {
  return (
    <section
      className="estoque-kpis"
      aria-label="Indicadores do estoque"
    >

      <EstoqueKpiCard
        titulo="Produtos"
        valor={
          carregando
            ? "-"
            : formatarNumero(
                indicadores
                  .produtos,
                0,
              )
        }
        subtitulo={
          localAtual
        }
        icone={
          Boxes
        }
        tipo="azul"
      />


      <EstoqueKpiCard
        titulo="Com saldo"
        valor={
          carregando
            ? "-"
            : formatarNumero(
                indicadores
                  .comSaldo,
                0,
              )
        }
        subtitulo="Saldo diferente de zero"
        icone={
          PackageCheck
        }
        tipo="verde"
      />


      <EstoqueKpiCard
        titulo="Saldo total"
        valor={
          carregando
            ? "-"
            : formatarNumero(
                indicadores
                  .saldoTotal,
              )
        }
        subtitulo="Quantidade disponível no local"
        icone={
          Warehouse
        }
        tipo="roxo"
      />


      <EstoqueKpiCard
        titulo="Quantidade em aberto"
        valor={
          carregando
            ? "-"
            : formatarNumero(
                indicadores
                  .quantidadePedidosAbertos,
              )
        }
        subtitulo={
          carregando
            ? "Carregando pedidos..."
            : `${
                formatarNumero(
                  indicadores
                    .pedidosAbertos,
                  0,
                )
              } pedidos • mesma base da tela de Pedidos`
        }
        icone={
          ShoppingCart
        }
        tipo="laranja"
      />

    </section>
  );
}