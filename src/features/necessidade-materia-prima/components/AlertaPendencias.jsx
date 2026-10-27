import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronDown, ChevronUp, RotateCcw, X } from "lucide-react";
import Paginacao from "@/components/paginacao/Paginacao";
import { useAuth } from "@/hooks/useAuth";
import { formatarPesoKgUn } from "../utils/formatadoresNecessidade";
import { QUERY_KEY_NECESSIDADE_MP } from "../hooks/useNecessidadeMateriaPrima";
import {
  decidirPesoSuspeito,
  desfazerDecisaoPeso,
} from "../services/necessidadeMateriaPrima.service";
import { formatarDataHora } from "@/shared/lib/datas";

const PENDENCIAS_POR_PAGINA = 8;

/* Quem decidiu e quando (dica ao passar o mouse). */
function autoria(decisao) {
  if (!decisao) return undefined;
  const quando = decisao.decidido_em ? formatarDataHora(decisao.decidido_em) : "";
  return [decisao.decidido_por_email, quando].filter(Boolean).join(" · ") || undefined;
}

function textoPeso(peso) {
  return `${formatarPesoKgUn(peso.quantidade)} kg/un de ${peso.codigoMp}`;
}

/**
 * Pendências da estrutura do Omie: Código, Produto e o que falta.
 * Peso suspeito (> 5 kg/un) pode ser aceito ou recusado.
 */
function AlertaPendencias({ pendencias = [], pesosAceitos = [] }) {
  const [expandido, setExpandido] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [erro, setErro] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const decidir = useMutation({
    mutationFn: ({ acao, codigo, peso }) =>
      acao === "DESFAZER"
        ? desfazerDecisaoPeso({ codigoProduto: codigo, codigoMp: peso.codigoMp })
        : decidirPesoSuspeito({
            codigoProduto: codigo,
            codigoMp: peso.codigoMp,
            quantidade: peso.quantidade,
            decisao: acao,
            usuario: user,
          }),
    onMutate: () => setErro(""),
    onError: (e) => setErro(e?.message || "Não foi possível gravar."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_NECESSIDADE_MP }),
  });

  const ocupado = decidir.isPending;
  const acao = (dados) => decidir.mutate(dados);

  const totalPaginas = Math.max(1, Math.ceil(pendencias.length / PENDENCIAS_POR_PAGINA));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaValida - 1) * PENDENCIAS_POR_PAGINA;
  const pendenciasPagina = useMemo(
    () => pendencias.slice(inicio, inicio + PENDENCIAS_POR_PAGINA),
    [pendencias, inicio],
  );

  const suspeitos = pendencias.filter((p) =>
    p.motivos.some((m) => m.tipo === "PESO_SUSPEITO"),
  ).length;

  if (pendencias.length === 0 && pesosAceitos.length === 0) {
    return null;
  }

  return (
    <section className="necessidade-pendencias" aria-label="Produtos com pendências">
      <div className="necessidade-pendencias-cabecalho">
        <AlertTriangle size={18} aria-hidden="true" />

        <div className="necessidade-pendencias-texto">
          <strong>Produtos com cadastro pendente</strong>
          <p>
            {pendencias.length > 0
              ? `${pendencias.length} produto(s) dos pedidos em aberto precisam de cadastro no Omie e estão fora do consumo. O cálculo ainda é parcial.`
              : "Nenhuma pendência de cadastro."}
            {suspeitos > 0 && ` ${suspeitos} com peso suspeito aguardando aceite ou recusa.`}
          </p>
        </div>

        <button
          type="button"
          className="necessidade-pendencias-toggle"
          aria-expanded={expandido}
          onClick={() => setExpandido((anterior) => !anterior)}
        >
          {expandido ? (
            <>
              <ChevronUp size={16} /> Ocultar pendências
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Ver pendências
            </>
          )}
        </button>
      </div>

      {expandido && (
        <div className="necessidade-pendencias-conteudo">
          {erro && (
            <p className="necessidade-pendencias-erro" role="alert">
              {erro}
            </p>
          )}

          {pendencias.length > 0 && (
            <>
              <div className="necessidade-tabela-container">
                <table className="necessidade-tabela necessidade-tabela-pendencias">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Produto</th>
                      <th>O que falta</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pendenciasPagina.map((item) => (
                      <tr key={item.codigo}>
                        <td>
                          <strong>{item.codigo}</strong>
                        </td>
                        <td>{item.produto}</td>
                        <td>
                          <ul className="necessidade-motivos">
                            {item.motivos.map((m, i) => (
                              <li
                                key={`${m.tipo}-${i}`}
                                className={`necessidade-motivo necessidade-motivo-${m.tipo.toLowerCase()}`}
                                title={
                                  m.tipo === "PESO_RECUSADO" ? autoria(m.peso?.decisao) : m.detalhe
                                }
                              >
                                {m.tipo === "PESO_SUSPEITO" ? (
                                  <>
                                    <span>
                                      {m.texto}: {textoPeso(m.peso)}
                                    </span>
                                    <span className="necessidade-motivo-acoes">
                                      <button
                                        type="button"
                                        className="necessidade-btn-aceitar"
                                        disabled={ocupado}
                                        onClick={() =>
                                          acao({
                                            acao: "ACEITO",
                                            codigo: item.codigo,
                                            peso: m.peso,
                                          })
                                        }
                                      >
                                        <Check size={13} aria-hidden="true" /> Aceitar
                                      </button>
                                      <button
                                        type="button"
                                        className="necessidade-btn-recusar"
                                        disabled={ocupado}
                                        onClick={() =>
                                          acao({
                                            acao: "RECUSADO",
                                            codigo: item.codigo,
                                            peso: m.peso,
                                          })
                                        }
                                      >
                                        <X size={13} aria-hidden="true" /> Recusar
                                      </button>
                                    </span>
                                  </>
                                ) : m.tipo === "PESO_RECUSADO" ? (
                                  <>
                                    <span>
                                      {m.texto} ({textoPeso(m.peso)})
                                    </span>
                                    <span className="necessidade-motivo-acoes">
                                      <button
                                        type="button"
                                        className="necessidade-btn-desfazer"
                                        disabled={ocupado}
                                        onClick={() =>
                                          acao({
                                            acao: "DESFAZER",
                                            codigo: item.codigo,
                                            peso: m.peso,
                                          })
                                        }
                                      >
                                        <RotateCcw size={13} aria-hidden="true" /> Desfazer
                                      </button>
                                    </span>
                                  </>
                                ) : (
                                  <span>{m.texto}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Paginacao
                paginaAtual={paginaValida}
                totalItens={pendencias.length}
                itensPorPagina={PENDENCIAS_POR_PAGINA}
                onChangePagina={setPaginaAtual}
              />
            </>
          )}

          {pesosAceitos.length > 0 && (
            <div className="necessidade-pesos-aceitos">
              <strong>Pesos acima de 5 kg/un aceitos</strong>
              <ul>
                {pesosAceitos.map((p) => (
                  <li key={`${p.codigo}-${p.codigoMp}`} title={autoria(p.decisao)}>
                    <span>
                      <strong>{p.codigo}</strong> – {p.produto}: {textoPeso(p)}
                    </span>
                    <button
                      type="button"
                      className="necessidade-btn-desfazer"
                      disabled={ocupado}
                      onClick={() => acao({ acao: "DESFAZER", codigo: p.codigo, peso: p })}
                    >
                      <RotateCcw size={13} aria-hidden="true" /> Desfazer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default AlertaPendencias;
