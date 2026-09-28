import {
  ArrowDownToLine,
  ShoppingBag,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import ComprasFuturas from "@/features/materia-prima/compras-futuras/ComprasFuturas";
import Entradas from "@/features/materia-prima/entradas/Entradas";

import "./ComprasMateriaPrimaPage.css";


const SECOES = Object.freeze({
  "compras-futuras": {
    eyebrow: "Compras",
    titulo: "Compras Futuras",
    descricao:
      "Controle das compras de matéria-prima com recebimento previsto.",
    icone: ShoppingBag,
    componente: ComprasFuturas,
  },

  entradas: {
    eyebrow: "Compras",
    titulo: "Entradas",
    descricao:
      "Registro dos recebimentos reais de matéria-prima.",
    icone: ArrowDownToLine,
    componente: Entradas,
  },
});


export default function ComprasMateriaPrimaPage({
  secao,
  isAdmin = false,
}) {
  const configuracao =
    SECOES[secao] ??
    SECOES["compras-futuras"];


  const Conteudo =
    configuracao.componente;


  return (
    <main className="compras-materia-prima-page">

      <div className="compras-materia-prima-container">

        <PageHeader
          eyebrow={
            configuracao.eyebrow
          }
          title={
            configuracao.titulo
          }
          description={
            configuracao.descricao
          }
          icon={
            configuracao.icone
          }
          className="compras-materia-prima-header"
        />


        <section className="compras-materia-prima-conteudo">

          <Conteudo
            isAdmin={
              isAdmin
            }
          />

        </section>

      </div>

    </main>
  );
}