import { useState } from "react";
import { formatarConsumo, formatarKg, formatarMoeda, formatarPrecoUnitario } from "../utils/formatadoresNecessidade";

function interpretarEstoqueSeguranca(valor) {
 const texto=String(valor??"").trim().replace(/\s/g,"");
 if (!texto) return 0;
 let normalizado=texto;
 if(texto.includes(",")) normalizado=texto.replace(/\./g,"").replace(",",".");
 else if (/^\d{1,3}(\.\d{3})+$/.test(texto)) normalizado=texto.replace(/\./g,"");
 const resultado=Number(normalizado);
 return Number.isFinite(resultado)?resultado:null;
}

export default function ResumoMaterialNecessidade({ materialAtual, alterarAjuste }) {
 const [editandoEstoqueSeguranca,setEditandoEstoqueSeguranca]=useState(false);
 return (
<div className="necessidade-tabela-container necessidade-resumo-container">
                      <table className="necessidade-tabela">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Consumo (kg)</th>
                            <th>% Compra</th>
                            <th>Consumo considerado (kg)</th>
                            <th>Estoque OMIE (Kg)</th>
                            <th>Compras futuras (kg)</th>
                            <th>Saldo projetado (Kg)</th>
                            <th>Estoque Segurança (Kg)</th>
                            <th>Necessidade (Kg)</th>
                            <th>Preço de referência (R$/kg)</th>
                            <th>Valor estimado</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr className="necessidade-linha-resumo necessidade-linha-resumo-destaque">
                            <th>
                              <span className="necessidade-resumo-material">
                                {materialAtual.material}
                              </span>
                            </th>

                            {/* CONSUMO — 2 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarConsumo(
                                  materialAtual.consumo
                                )}
                              </span>
                            </td>

                            {/* PERCENTUAL EDITÁVEL */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-input">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="10"
                                className="necessidade-resumo-input"
                                value={materialAtual.percentual}
                                aria-label={`Percentual de compra ${materialAtual.material}`}
                                onChange={(event) =>
                                  alterarAjuste(
                                    materialAtual.id,
                                    "percentual",
                                    event.target.value
                                  )
                                }
                              />
                            </td>

                            {/* CONSUMO CONSIDERADO — 2 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarConsumo(
                                  materialAtual.consumoConsiderado
                                )}
                              </span>
                            </td>

                            {/* ESTOQUE API — 2 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor necessidade-resumo-valor-secundario">
                                {materialAtual.estoqueDisponivel
                                  ? formatarKg(
                                      materialAtual.estoqueApi
                                    )
                                  : "Sem dados"}
                              </span>
                            </td>

                            {/* COMPRAS FUTURAS — 2 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarKg(
                                  materialAtual.comprasFuturas
                                )}
                              </span>
                            </td>

                            {/* SALDO PROJETADO — 2 CASAS */}

                            <td
                              className={`necessidade-resumo-celula ${
                                materialAtual.saldoProjetado !== null &&
                                materialAtual.saldoProjetado < 0
                                  ? "necessidade-negativo"
                                  : ""
                              }`}
                            >
                              <span
                                className={
                                  materialAtual.saldoProjetado !== null &&
                                  materialAtual.saldoProjetado < 0
                                    ? "necessidade-resumo-valor necessidade-resumo-valor-negativo"
                                    : "necessidade-resumo-valor necessidade-resumo-valor-secundario"
                                }
                              >
                                {materialAtual.estoqueDisponivel
                                  ? formatarKg(
                                      materialAtual.saldoProjetado
                                    )
                                  : "—"}
                              </span>
                            </td>

                            {/* TETO EDITÁVEL */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-input">
                              <input
                                type="text"
                                inputMode="decimal"
                                className="necessidade-resumo-input"
                                value={editandoEstoqueSeguranca
                                  ? String(materialAtual.teto)
                                  : formatarKg(materialAtual.teto)}
                                aria-label={`Estoque de segurança ${materialAtual.material}`}
                                onFocus={() => setEditandoEstoqueSeguranca(true)}
                                onBlur={() => setEditandoEstoqueSeguranca(false)}
                                onChange={(event) => {
                                  const valor = interpretarEstoqueSeguranca(event.target.value);
                                  if (valor !== null && valor >= 0) {
                                    alterarAjuste(materialAtual.id, "teto", valor);
                                  }
                                }}
                              />
                            </td>

                            {/* NECESSIDADE — 2 CASAS */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-necessidade">
                              <span className="necessidade-resumo-valor necessidade-resumo-valor-principal">
                                {materialAtual.estoqueDisponivel
                                  ? formatarKg(
                                      materialAtual.necessidade
                                    )
                                  : "—"}
                              </span>
                            </td>

                            {/* PREÇO DA TABELA DE PREÇOS: MÉDIA OU ÚLTIMA COMPRA */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {materialAtual.preco != null
                                  ? formatarPrecoUnitario(
                                      materialAtual.preco
                                    )
                                  : "Sem preço"}
                              </span>
                            </td>

                            {/* VALOR ESTIMADO — MOEDA */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-valor">
                              <span className="necessidade-resumo-valor necessidade-resumo-valor-destaque">
                                {materialAtual.estoqueDisponivel
                                  ? formatarMoeda(
                                      materialAtual.valorEstimado
                                    )
                                  : "—"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
 );
}
