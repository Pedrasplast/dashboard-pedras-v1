import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Factory,
  Pencil,
  Settings2,
  Trash2,
} from "lucide-react";

import { formatarDataHora, formatarNumero } from "../utils/programacaoProducao.utils";
import ProjecaoDiariaTabela from "./ProjecaoDiariaTabela";

function Resumo({ label, value, destaque = false, tom = "padrao" }) {
  return (
    <div className={`produto-resumo-item ${destaque ? "destaque" : ""} tom-${tom}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GrupoResumo({ titulo, icone, children, classe = "" }) {
  return (
    <section className={`produto-resumo-grupo ${classe}`.trim()}>
      <div className="produto-resumo-grupo-titulo">
        {icone}
        <span>{titulo}</span>
      </div>
      <div className="produto-resumo-grupo-conteudo">{children}</div>
    </section>
  );
}

function obterEstadoVisual(produto, precisaProduzir) {
  if (!produto.tem_ciclo && precisaProduzir) {
    return {
      chave: "sem-ciclo",
      titulo: "Sem ciclo cadastrado",
      icone: <AlertTriangle size={14} />,
    };
  }

  if (produto.pedidos_risco > 0) {
    return {
      chave: "risco",
      titulo: `${produto.pedidos_risco} pedido(s) em risco`,
      icone: <AlertTriangle size={14} />,
    };
  }

  if (!precisaProduzir) {
    return {
      chave: "estoque",
      titulo: "Estoque suficiente",
      icone: <CheckCircle2 size={14} />,
    };
  }

  if (produto.programado) {
    return {
      chave: "programado",
      titulo: "Produção programada",
      icone: <Factory size={14} />,
    };
  }

  return {
    chave: "nao-programado",
    titulo: "Aguardando programação",
    icone: <CircleDashed size={14} />,
  };
}

export default function ProdutoProgramacaoCard({ produto, onProgramar, onExcluir }) {
  const precisaProduzir = produto.necessidade_producao > 0;
  const [projecaoAberta, setProjecaoAberta] = useState(produto.programado);
  const estado = obterEstadoVisual(produto, precisaProduzir);

  useEffect(() => {
    if (produto.programado) setProjecaoAberta(true);
  }, [produto.programado]);

  const fimDeSemana = produto.programado
    ? [
        produto.trabalha_sabado ? `Sáb ${produto.jornada_sabado_horas}h` : null,
        produto.trabalha_domingo ? `Dom ${produto.jornada_domingo_horas}h` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Não produz"
    : "-";

  return (
    <article className={`produto-programacao-card estado-${estado.chave}`}>
      <div className="produto-card-faixa" aria-hidden="true" />

      <header className="produto-card-topo">
        <div className="produto-identificacao">
          <span className="produto-codigo">{produto.codigo_produto}</span>
          <div className="produto-identificacao-texto">
            <div className="produto-identificacao-linha">
              <h3>{produto.produto}</h3>
              <span className={`produto-estado produto-estado-${estado.chave}`}>
                {estado.icone}
                {estado.titulo}
              </span>
            </div>

            <p>
              {produto.quantidade_pedidos} pedido(s) na carteira
              {produto.programado && produto.inicio_producao
                ? ` · início ${formatarDataHora(produto.inicio_producao)}`
                : ""}
            </p>

            <div className="produto-meta-tags">
              <span className="produto-meta-tag tag-estoque">
                Estoque {formatarNumero(produto.estoque_inicial)}
              </span>
              <span className="produto-meta-tag tag-pedidos">
                Pedidos {formatarNumero(produto.quantidade_pedida)}
              </span>
              <span className={`produto-meta-tag ${precisaProduzir ? "tag-alerta" : "tag-ok"}`}>
                Falta {formatarNumero(produto.necessidade_producao)}
              </span>
              {produto.pedidos_risco > 0 && (
                <span className="produto-meta-tag tag-risco">
                  {produto.pedidos_risco} em risco
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="produto-card-acoes">
          {produto.programado && (
            <button
              type="button"
              className="produto-acao-excluir"
              onClick={onExcluir}
              title="Excluir programação"
            >
              <Trash2 size={15} /> Excluir
            </button>
          )}

          <button
            type="button"
            className="produto-acao-principal"
            onClick={onProgramar}
            disabled={!produto.tem_ciclo || !precisaProduzir}
          >
            <Pencil size={15} /> {produto.programado ? "Editar" : "Programar"}
          </button>
        </div>
      </header>

      <div className="produto-resumo-paineis">
        <GrupoResumo titulo="Carteira" icone={<Boxes size={15} />} classe="grupo-carteira">
          <Resumo label="Estoque atual" value={formatarNumero(produto.estoque_inicial)} tom="estoque" />
          <Resumo label="Pedidos" value={formatarNumero(produto.quantidade_pedida)} tom="carteira" />
          <Resumo
            label="Falta para cobrir"
            value={formatarNumero(produto.necessidade_producao)}
            destaque={precisaProduzir}
            tom={precisaProduzir ? "alerta" : "estoque"}
          />
        </GrupoResumo>

        <GrupoResumo titulo="Produção" icone={<Factory size={15} />} classe="grupo-producao">
          <Resumo
            label="Produção projetada"
            value={produto.programado ? formatarNumero(produto.producao_planejada) : "-"}
            tom="producao"
          />
          <Resumo
            label="Ciclo"
            value={produto.tem_ciclo ? `${formatarNumero(produto.ciclo_segundos)} s` : "Sem cadastro"}
            tom={!produto.tem_ciclo ? "risco" : "padrao"}
          />
          <Resumo
            label="Jornada"
            value={produto.programado ? `${produto.jornada_horas} h/dia` : "-"}
            tom="prazo"
          />
        </GrupoResumo>

        <GrupoResumo titulo="Programação" icone={<CalendarClock size={15} />} classe="grupo-programacao">
          <Resumo
            label="Início"
            value={produto.programado ? formatarDataHora(produto.inicio_producao) : "Não programado"}
            tom={produto.programado ? "prazo" : "padrao"}
          />
          <Resumo label="Fim de semana" value={fimDeSemana} tom="padrao" />
          <Resumo
            label="Fim da programação"
            value={produto.termino_calculado ? formatarDataHora(produto.termino_calculado) : "-"}
            destaque={produto.programado}
            tom="prazo"
          />
        </GrupoResumo>
      </div>

      {produto.programado ? (
        <section className="produto-projecao-diaria">
          <div className="produto-projecao-cabecalho">
            <div className="produto-projecao-titulo">
              <span className="produto-projecao-icone">
                <Settings2 size={15} />
              </span>
              <div>
                <strong>Projeção dia a dia</strong>
                <span>
                  Estoque inicial + produção - pedidos, até a última previsão de faturamento.
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setProjecaoAberta((valor) => !valor)}>
              {projecaoAberta ? "Ocultar projeção" : "Ver projeção diária"}
            </button>
          </div>

          {projecaoAberta && <ProjecaoDiariaTabela dias={produto.projecao_diaria} />}
        </section>
      ) : precisaProduzir ? (
        <div className="produto-aviso produto-aviso-programacao">
          <Factory size={16} />
          <div>
            <strong>Produção ainda não programada</strong>
            <span>Defina o início e a jornada para gerar a projeção diária deste produto.</span>
          </div>
        </div>
      ) : (
        <div className="produto-aviso produto-aviso-ok">
          <CheckCircle2 size={16} />
          <div>
            <strong>Sem necessidade de produção</strong>
            <span>O estoque atual já cobre toda a carteira deste produto.</span>
          </div>
        </div>
      )}

      {!produto.tem_ciclo && precisaProduzir && (
        <div className="produto-aviso produto-aviso-ciclo">
          <AlertTriangle size={16} />
          <div>
            <strong>Ciclo não cadastrado</strong>
            <span>Cadastre o ciclo deste produto para calcular produção e prazo.</span>
          </div>
        </div>
      )}
    </article>
  );
}
