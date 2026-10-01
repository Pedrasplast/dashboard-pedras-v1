import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import PageHeader from "@/components/layout/PageHeader";

import CadastroReceitaModal from "./CadastroReceitaModal";
import useCadastroReceitas from "./useCadastroReceitas";

import "./CadastroReceitas.css";


function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function formatarPercentual(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0%";
  }

  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
}


function CardResumo({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
}) {
  return (
    <article className="cadastro-receitas-resumo-card">
      <div className="cadastro-receitas-resumo-card__topo">
        <span>{titulo}</span>
        <Icone size={19} />
      </div>

      <strong>{valor}</strong>
      <small>{subtitulo}</small>
    </article>
  );
}


export default function CadastroReceitasPage() {
  const [pesquisa, setPesquisa] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [receitaEdicao, setReceitaEdicao] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  const {
    receitas,
    fornecedores,
    carregando,
    erro,
    salvando,
    alterandoStatus,
    salvarReceita,
    alterarStatusReceita,
  } = useCadastroReceitas();


  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo = useMemo(
    () => ({
      total: receitas.length,

      ativas:
        receitas.filter(
          (receita) => receita.ativo,
        ).length,

      inativas:
        receitas.filter(
          (receita) => !receita.ativo,
        ).length,

      configuradas:
        receitas.filter(
          (receita) => receita.configurada,
        ).length,
    }),
    [receitas],
  );


  /* =======================================================
     FILTRO
  ======================================================= */

  const receitasFiltradas = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    if (!termo) {
      return receitas;
    }

    return receitas.filter((receita) => {
      const fornecedoresTexto =
        receita.itens
          .map((item) => item.fornecedorNome)
          .join(" ");

      return normalizarTexto(
        `${receita.nome} ${receita.descricao} ${fornecedoresTexto}`,
      ).includes(termo);
    });
  }, [
    receitas,
    pesquisa,
  ]);


  /* =======================================================
     MODAL
  ======================================================= */

  function abrirNovaReceita() {
    setMensagemSucesso("");
    setErroAcao("");
    setReceitaEdicao(null);
    setModalAberto(true);
  }


  function abrirEdicao(receita) {
    setMensagemSucesso("");
    setErroAcao("");
    setReceitaEdicao(receita);
    setModalAberto(true);
  }


  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setReceitaEdicao(null);
  }


  /* =======================================================
     SALVAR
  ======================================================= */

  async function handleSalvar(dados) {
    const resultado =
      await salvarReceita(dados);

    setMensagemSucesso(
      resultado?.acao === "criada"
        ? "Receita cadastrada com sucesso."
        : "Receita atualizada com sucesso.",
    );

    setModalAberto(false);
    setReceitaEdicao(null);

    return resultado;
  }


  /* =======================================================
     STATUS
  ======================================================= */

  async function handleAlterarStatus(receita) {
    setMensagemSucesso("");
    setErroAcao("");

    const novoStatus =
      !receita.ativo;

    try {
      await alterarStatusReceita({
        id: receita.id,
        ativo: novoStatus,
      });

      setMensagemSucesso(
        novoStatus
          ? `Receita “${receita.nome}” ativada com sucesso.`
          : `Receita “${receita.nome}” desativada com sucesso.`,
      );
    } catch (error) {
      setErroAcao(
        error?.message ||
          "Não foi possível alterar o status da receita.",
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <main className="cadastro-receitas-page">
        <div className="cadastro-receitas-container">

          <PageHeader
            eyebrow="Cadastro"
            title="Cadastro de receita"
            description="Cadastre receitas independentes de produto. A receita será escolhida somente na programação de cada dia."
            icon={FlaskConical}
          />


          {/* =================================================
              RESUMO
          ================================================= */}

          <section className="cadastro-receitas-resumo">

            <CardResumo
              titulo="Receitas"
              valor={
                carregando
                  ? "-"
                  : resumo.total
              }
              subtitulo="Total cadastrado"
              icone={FlaskConical}
            />


            <CardResumo
              titulo="Ativas"
              valor={
                carregando
                  ? "-"
                  : resumo.ativas
              }
              subtitulo="Disponíveis para programação"
              icone={CheckCircle2}
            />


            <CardResumo
              titulo="Inativas"
              valor={
                carregando
                  ? "-"
                  : resumo.inativas
              }
              subtitulo="Ocultas para novas programações"
              icone={PowerOff}
            />


            <CardResumo
              titulo="Composição válida"
              valor={
                carregando
                  ? "-"
                  : resumo.configuradas
              }
              subtitulo="Receitas totalizando 100%"
              icone={CheckCircle2}
            />

          </section>


          {/* =================================================
              MENSAGENS
          ================================================= */}

          {mensagemSucesso && (
            <div className="cadastro-receitas-sucesso">
              {mensagemSucesso}
            </div>
          )}


          {(erro || erroAcao) && (
            <div className="cadastro-receitas-erro">
              <AlertTriangle size={17} />

              <span>
                {erroAcao || erro}
              </span>
            </div>
          )}


          {/* =================================================
              CONTEÚDO
          ================================================= */}

          <section className="cadastro-receitas-conteudo">

            <div className="cadastro-receitas-toolbar">

              <div className="cadastro-receitas-pesquisa">
                <Search size={18} />

                <input
                  type="text"
                  value={pesquisa}
                  onChange={(evento) =>
                    setPesquisa(
                      evento.target.value,
                    )
                  }
                  placeholder="Buscar receita ou fornecedor..."
                />
              </div>


              <button
                type="button"
                className="cadastro-receitas-botao-primario"
                onClick={abrirNovaReceita}
              >
                <Plus size={17} />
                Nova receita
              </button>

            </div>


            {/* =================================================
                TABELA
            ================================================= */}

            <div className="cadastro-receitas-tabela-scroll">

              <table className="cadastro-receitas-tabela">

                <thead>
                  <tr>
                    <th>Receita</th>
                    <th>Composição</th>
                    <th className="numero">
                      Total
                    </th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>


                <tbody>

                  {carregando ? (

                    <tr>
                      <td
                        colSpan={5}
                        className="cadastro-receitas-vazio"
                      >
                        Carregando receitas...
                      </td>
                    </tr>

                  ) : receitasFiltradas.length === 0 ? (

                    <tr>
                      <td
                        colSpan={5}
                        className="cadastro-receitas-vazio"
                      >
                        {receitas.length === 0
                          ? "Nenhuma receita cadastrada."
                          : "Nenhuma receita encontrada para a pesquisa."}
                      </td>
                    </tr>

                  ) : (

                    receitasFiltradas.map(
                      (receita) => (
                        <tr key={receita.id}>

                          {/* RECEITA */}

                          <td className="cadastro-receitas-coluna-receita">

                            <strong>
                              {receita.nome}
                            </strong>

                            <span>
                              {receita.descricao ||
                                "Sem descrição"}
                            </span>

                          </td>


                          {/* COMPOSIÇÃO */}

                          <td>

                            <div className="cadastro-receitas-composicao-lista">

                              {receita.itens.map(
                                (item) => (
                                  <span
                                    key={
                                      item.id ??
                                      `${receita.id}-${item.fornecedorId}`
                                    }
                                    className="cadastro-receitas-componente-tag"
                                  >
                                    {item.fornecedorNome}

                                    <strong>
                                      {formatarPercentual(
                                        item.percentual,
                                      )}
                                    </strong>
                                  </span>
                                ),
                              )}


                              {receita.itens.length === 0 && (
                                <span className="cadastro-receitas-sem-composicao">
                                  Sem composição
                                </span>
                              )}

                            </div>

                          </td>


                          {/* TOTAL */}

                          <td className="numero">

                            <span
                              className={
                                receita.configurada
                                  ? "cadastro-receitas-total-tabela cadastro-receitas-total-tabela--valido"
                                  : "cadastro-receitas-total-tabela cadastro-receitas-total-tabela--invalido"
                              }
                            >
                              {formatarPercentual(
                                receita.percentualTotal,
                              )}
                            </span>

                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={
                                receita.ativo
                                  ? "cadastro-receitas-status cadastro-receitas-status--ativo"
                                  : "cadastro-receitas-status cadastro-receitas-status--inativo"
                              }
                            >
                              {receita.ativo
                                ? "Ativa"
                                : "Inativa"}
                            </span>

                          </td>


                          {/* AÇÕES */}

                          <td>

                            <div className="cadastro-receitas-acoes">

                              <button
                                type="button"
                                className="cadastro-receitas-editar"
                                onClick={() =>
                                  abrirEdicao(
                                    receita,
                                  )
                                }
                                disabled={alterandoStatus}
                              >
                                <Pencil size={15} />
                                Editar
                              </button>


                              <button
                                type="button"
                                className={
                                  receita.ativo
                                    ? "cadastro-receitas-status-botao cadastro-receitas-status-botao--desativar"
                                    : "cadastro-receitas-status-botao cadastro-receitas-status-botao--ativar"
                                }
                                onClick={() =>
                                  void handleAlterarStatus(
                                    receita,
                                  )
                                }
                                disabled={alterandoStatus}
                              >
                                {receita.ativo ? (
                                  <PowerOff size={15} />
                                ) : (
                                  <Power size={15} />
                                )}

                                {receita.ativo
                                  ? "Desativar"
                                  : "Ativar"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      ),
                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>
      </main>


      {/* ===================================================
          MODAL
      =================================================== */}

      <CadastroReceitaModal
        aberto={modalAberto}
        receita={receitaEdicao}
        fornecedores={fornecedores}
        salvando={salvando}
        onCancelar={fecharModal}
        onSalvar={handleSalvar}
      />
    </>
  );
}