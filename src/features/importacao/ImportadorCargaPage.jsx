import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useNavigate } from "@/lib/navegacao";

import { FiAlertTriangle, FiArrowLeft, FiFileText, FiUploadCloud, FiX } from "react-icons/fi";

import { inserirLoteImportacao } from "./importacao.service";
import { prepararRegistros } from "./planilhaBanco";
import PageHeader from "@/components/layout/PageHeader";

import "./ImportadorCarga.css";
import "./ImportadorConfirmacao.css";

const TAMANHO_LOTE = 500;

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function ImportadorCarga() {
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState("");
  const [porcentagem, setPorcentagem] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);

  const [tabelaDestino, setTabelaDestino] = useState("carga_maquina");

  /* =====================================================
     CONFIRMAÇÃO E PRÉVIA
  ===================================================== */

  const [arquivoPendente, setArquivoPendente] = useState(null);

  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);

  const [previa, setPrevia] = useState({
    carregando: false,
    quantidade: null,
    erro: "",
  });

  const fileInputRef = useRef(null);

  // Impede que uma prévia cancelada atualize o modal.
  const previaRequisicaoRef = useRef(0);

  /* =====================================================
     PROTEGER A PÁGINA DURANTE IMPORTAÇÃO
  ===================================================== */

  useEffect(() => {
    const handleBeforeUnload = (evento) => {
      if (!carregando) {
        return;
      }

      evento.preventDefault();
      evento.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [carregando]);

  /* =====================================================
     PROCESSAR E ENVIAR O ARQUIVO

     Somente é chamado após a confirmação.
  ===================================================== */

  const processarArquivo = useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      const extensao = file.name.split(".").pop()?.toLowerCase();

      if (!["xlsx", "xls", "xlsm"].includes(extensao)) {
        setStatus("❌ Erro: selecione um arquivo Excel .xlsx, .xls ou .xlsm.");
        return;
      }

      setCarregando(true);
      setStatus("Lendo arquivo...");
      setPorcentagem(0);

      const reader = new FileReader();

      reader.onerror = () => {
        setStatus("❌ Erro ao ler o arquivo.");

        setCarregando(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      reader.onload = (evento) => {
        setTimeout(async () => {
          try {
            const conteudo = evento.target?.result;

            if (!conteudo) {
              throw new Error("Não foi possível ler o conteúdo do arquivo.");
            }

            setStatus('Lendo a aba "Banco" e formatando os dados...');

            const { nomeAbaEncontrada, registrosValidos } = prepararRegistros(
              conteudo,
              tabelaDestino,
            );

            setStatus(`Enviando ${registrosValidos.length} registros da aba Banco...`);

            /* ===========================================
               ENVIO EM LOTES
            =========================================== */

            for (let indice = 0; indice < registrosValidos.length; indice += TAMANHO_LOTE) {
              const lote = registrosValidos.slice(indice, indice + TAMANHO_LOTE);

              try {
                await inserirLoteImportacao(tabelaDestino, lote);
              } catch (insertError) {
                const primeiraLinha = lote[0]?.__linhaExcel;

                throw new Error(
                  primeiraLinha
                    ? `Falha no lote iniciado na linha ${primeiraLinha} da aba Banco: ${insertError.message}`
                    : insertError.message,
                );
              }

              const processados = Math.min(indice + lote.length, registrosValidos.length);

              setPorcentagem(Math.round((processados / registrosValidos.length) * 100));
            }

            setStatus(
              `✅ Sucesso: ${registrosValidos.length} registros importados somente da aba "${nomeAbaEncontrada}".`,
            );
          } catch (erro) {
            console.error("Erro durante a importação:", erro);

            setStatus(`❌ Erro: ${erro?.message || "Falha desconhecida durante a importação."}`);
          } finally {
            setCarregando(false);

            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }, 50);
      };

      reader.readAsArrayBuffer(file);
    },
    [tabelaDestino],
  );

  /* =====================================================
     NOVO: CONTAR REGISTROS ANTES DA CONFIRMAÇÃO

     Apenas lê e prepara os registros.
     Não grava nada no Supabase.
  ===================================================== */

  const contarRegistrosArquivo = useCallback(async (arquivo, destino) => {
    const conteudo = await arquivo.arrayBuffer();

    const { registrosValidos } = prepararRegistros(conteudo, destino);

    return registrosValidos.length;
  }, []);

  /* =====================================================
     ABRIR CONFIRMAÇÃO

     Seleciona o arquivo e inicia a contagem.
     Nenhum INSERT é realizado aqui.
  ===================================================== */

  const solicitarConfirmacao = useCallback(
    async (arquivo) => {
      if (!arquivo || carregando || confirmacaoAberta) {
        return;
      }

      const extensao = arquivo.name.split(".").pop()?.toLowerCase();

      if (!["xlsx", "xls", "xlsm"].includes(extensao)) {
        setStatus("❌ Erro: selecione um arquivo Excel .xlsx, .xls ou .xlsm.");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        return;
      }

      const requisicao = ++previaRequisicaoRef.current;

      const destinoSelecionado = tabelaDestino;

      setStatus("");
      setPorcentagem(0);
      setArquivoPendente(arquivo);

      setPrevia({
        carregando: true,
        quantidade: null,
        erro: "",
      });

      setConfirmacaoAberta(true);

      try {
        const quantidade = await contarRegistrosArquivo(arquivo, destinoSelecionado);

        if (previaRequisicaoRef.current !== requisicao) {
          return;
        }

        setPrevia({
          carregando: false,
          quantidade,
          erro: "",
        });
      } catch (erro) {
        if (previaRequisicaoRef.current !== requisicao) {
          return;
        }

        setPrevia({
          carregando: false,
          quantidade: null,
          erro: erro?.message || "Não foi possível contar os registros.",
        });
      }
    },
    [carregando, confirmacaoAberta, tabelaDestino, contarRegistrosArquivo],
  );

  /* =====================================================
     CANCELAR CONFIRMAÇÃO
  ===================================================== */

  const cancelarConfirmacao = useCallback(() => {
    // Ignora uma leitura assíncrona que tenha sido cancelada.
    previaRequisicaoRef.current += 1;

    setConfirmacaoAberta(false);
    setArquivoPendente(null);

    setPrevia({
      carregando: false,
      quantidade: null,
      erro: "",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  /* =====================================================
     CONFIRMAR IMPORTAÇÃO

     Somente aqui o envio ao banco começa.
  ===================================================== */

  const confirmarImportacao = useCallback(() => {
    if (
      !arquivoPendente ||
      carregando ||
      previa.carregando ||
      previa.erro ||
      !Number.isInteger(previa.quantidade) ||
      previa.quantidade <= 0
    ) {
      return;
    }

    const arquivo = arquivoPendente;

    previaRequisicaoRef.current += 1;

    setConfirmacaoAberta(false);
    setArquivoPendente(null);

    setPrevia({
      carregando: false,
      quantidade: null,
      erro: "",
    });

    processarArquivo(arquivo);
  }, [arquivoPendente, carregando, previa, processarArquivo]);

  /* =====================================================
     ESC FECHA A CONFIRMAÇÃO
  ===================================================== */

  /* =====================================================
     NOME DO DESTINO
  ===================================================== */

  const nomeTabelaDestino = tabelaDestino === "ciclo_injetora" ? "Ciclo Injetora" : "Carga Máquina";

  /* =====================================================
     VOLTAR
  ===================================================== */

  const handleVoltar = useCallback(() => navigate("/"), [navigate]);

  /* =====================================================
     ALTERAR TABELA
  ===================================================== */

  const handleTabelaChange = useCallback((evento) => {
    setTabelaDestino(evento.target.value);
    setStatus("");
    setPorcentagem(0);
  }, []);

  /* =====================================================
     DRAG AND DROP
  ===================================================== */

  const handleDragOver = useCallback((evento) => {
    evento.preventDefault();
  }, []);

  const handleDragEnter = useCallback((evento) => {
    evento.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((evento) => {
    evento.preventDefault();

    if (!evento.currentTarget.contains(evento.relatedTarget)) {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (evento) => {
      evento.preventDefault();
      setIsDragActive(false);

      const arquivo = evento.dataTransfer.files?.[0];

      if (!carregando && !confirmacaoAberta && arquivo) {
        solicitarConfirmacao(arquivo);
      }
    },
    [carregando, confirmacaoAberta, solicitarConfirmacao],
  );

  /* =====================================================
     CLICK NA ÁREA DE UPLOAD
  ===================================================== */

  const handleDropzoneClick = useCallback(() => {
    if (!carregando && !confirmacaoAberta && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [carregando, confirmacaoAberta]);

  /* =====================================================
     SELECIONAR ARQUIVO
  ===================================================== */

  const handleFileChange = useCallback(
    (evento) => {
      const arquivo = evento.target.files?.[0];

      if (arquivo) {
        solicitarConfirmacao(arquivo);
      }
    },
    [solicitarConfirmacao],
  );

  /* =====================================================
     TECLADO
  ===================================================== */

  const handleDropzoneKeyDown = useCallback(
    (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        handleDropzoneClick();
      }
    },
    [handleDropzoneClick],
  );

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <div className="importador-container">
      {/* VOLTAR */}

      <button
        type="button"
        className="back-importador-btn"
        onClick={handleVoltar}
        disabled={carregando}
      >
        <FiArrowLeft />

        <span>Página Inicial</span>
      </button>

      {/* CABEÇALHO */}

      <PageHeader
        eyebrow="Administração"
        title="Importador de Dados"
        description="Importe planilhas para atualizar as bases de dados do sistema."
        icon={FiUploadCloud}
        className="importador-header"
        titleAs="h2"
      />

      {/* CONTEÚDO PRINCIPAL */}

      <div className="importador-card">
        {/* TABELA DE DESTINO */}

        <div className="select-tabela">
          <label htmlFor="tabela-destino">Selecione a tabela de destino:</label>

          <select
            id="tabela-destino"
            value={tabelaDestino}
            onChange={handleTabelaChange}
            disabled={carregando || confirmacaoAberta}
          >
            <option value="carga_maquina">Carga Máquina</option>

            <option value="ciclo_injetora">Ciclo Injetora</option>
          </select>
        </div>

        {/* ÁREA DE UPLOAD */}

        <div
          className={[
            "upload-dropzone",
            isDragActive ? "drag-active" : "",
            carregando ? "disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          role="button"
          tabIndex={carregando ? -1 : 0}
          aria-disabled={carregando}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleDropzoneClick}
          onKeyDown={handleDropzoneKeyDown}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.xlsm"
            onChange={handleFileChange}
            disabled={carregando}
            style={{
              display: "none",
            }}
          />

          <p>{carregando ? "Processando a aba Banco..." : "Arraste o arquivo ou clique aqui"}</p>

          {!carregando && (
            <small>Formatos aceitos: XLSX, XLS e XLSM. Somente a aba “Banco” será importada.</small>
          )}
        </div>

        {/* STATUS DA IMPORTAÇÃO */}

        {status && (
          <div className="status-container">
            <p>{status}</p>

            {carregando && (
              <div
                className="progress-bar-container"
                style={{
                  width: "100%",
                  marginTop: "8px",
                  overflow: "hidden",
                  background: "#e2e8f0",
                  borderRadius: "999px",
                }}
              >
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${porcentagem}%`,
                    height: "8px",
                    background: "linear-gradient(90deg, #0b1f5e, #2e5bba, #3dbb63)",
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================
          MODAL DE CONFIRMAÇÃO
      ================================================= */}

      {confirmacaoAberta && arquivoPendente && (
        <Modal
          asChild
          aberto={confirmacaoAberta}
          onFechar={cancelarConfirmacao}
          bloqueado={false}
          tamanho="grande"
          fecharAoClicarFora={true}
        >
          <section
            className="importacao-confirmacao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacao-importacao"
          >
            {/* CABEÇALHO */}

            <div className="importacao-confirmacao-header" data-modal-header="">
              <div className="importacao-confirmacao-icone" data-modal-icone="">
                <FiUploadCloud />
              </div>

              <div className="importacao-confirmacao-titulo">
                <span>IMPORTAÇÃO DE DADOS</span>

                <ModalTitulo>
                  <h3 id="titulo-confirmacao-importacao">Confirmar importação</h3>
                </ModalTitulo>

                <p>Confira as informações antes de continuar.</p>
              </div>

              <button
                type="button"
                className="importacao-confirmacao-fechar"
                onClick={cancelarConfirmacao}
                aria-label="Fechar confirmação"
                data-modal-fechar=""
              >
                <FiX />
              </button>
            </div>

            {/* INFORMAÇÕES */}

            <div className="importacao-confirmacao-conteudo" data-modal-body="">
              {/* ARQUIVO */}

              <div className="importacao-confirmacao-arquivo">
                <div className="importacao-confirmacao-arquivo-icone" data-modal-icone="">
                  <FiFileText />
                </div>

                <div>
                  <span>Arquivo selecionado</span>

                  <strong>{arquivoPendente.name}</strong>
                </div>
              </div>

              {/* DESTINO E ABA */}

              <div className="importacao-confirmacao-detalhes">
                <div>
                  <span>Destino</span>

                  <strong>{nomeTabelaDestino}</strong>
                </div>

                <div>
                  <span>Aba importada</span>

                  <strong>Banco</strong>
                </div>
              </div>

              {/* =========================================
                  NOVO: TOTAL DE REGISTROS
              ========================================= */}

              <div className="importacao-confirmacao-arquivo" aria-live="polite">
                <div className="importacao-confirmacao-arquivo-icone" data-modal-icone="">
                  <FiFileText />
                </div>

                <div>
                  <span>Registros preparados para importação</span>

                  <strong>
                    {previa.carregando
                      ? "Contando registros..."
                      : previa.quantidade !== null
                        ? `${previa.quantidade.toLocaleString("pt-BR")} registros`
                        : "Contagem indisponível"}
                  </strong>
                </div>
              </div>

              {/* ERRO NA CONTAGEM */}

              {previa.erro && (
                <div className="importacao-confirmacao-alerta" role="alert">
                  <FiAlertTriangle />

                  <div>
                    <strong>Não foi possível preparar a importação</strong>

                    <p>{previa.erro}</p>
                  </div>
                </div>
              )}

              {/* ALERTA DE CONFIRMAÇÃO */}

              <div className="importacao-confirmacao-alerta">
                <FiAlertTriangle />

                <div>
                  <strong>Atenção</strong>

                  <p>
                    Ao confirmar,{" "}
                    {previa.quantidade !== null
                      ? `${previa.quantidade.toLocaleString("pt-BR")} registros preparados`
                      : "os registros encontrados"}{" "}
                    na aba Banco serão enviados à tabela <strong>{nomeTabelaDestino}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* AÇÕES */}

            <div className="importacao-confirmacao-acoes" data-modal-footer="">
              <button
                type="button"
                className="importacao-confirmacao-cancelar"
                onClick={cancelarConfirmacao}
                data-modal-acao="secundaria"
              >
                Cancelar
              </button>

              <button
                type="button"
                className="importacao-confirmacao-importar"
                onClick={confirmarImportacao}
                disabled={
                  carregando || previa.carregando || Boolean(previa.erro) || !previa.quantidade
                }
                data-modal-acao="secundaria"
              >
                <FiUploadCloud />

                <span>Confirmar importação</span>
              </button>
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}
