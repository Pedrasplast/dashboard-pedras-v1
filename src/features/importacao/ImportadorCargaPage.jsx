import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  useNavigate
} from "@/lib/navegacao";

import * as XLSX from 'xlsx';

import {
  formatISO,
  isValid,
  parse
} from 'date-fns';

import {
  FiAlertTriangle,
  FiArrowLeft,
  FiFileText,
  FiUploadCloud,
  FiX
} from 'react-icons/fi';

import {
  supabase
} from "@/lib/supabaseClient";

import './ImportadorCarga.css';
import './ImportadorConfirmacao.css';


const NOME_ABA_IMPORTACAO =
  'banco';

const TAMANHO_LOTE =
  500;


export default function ImportadorCarga() {
  const navigate =
    useNavigate();


  const [
    carregando,
    setCarregando
  ] =
    useState(false);


  const [
    status,
    setStatus
  ] =
    useState('');


  const [
    porcentagem,
    setPorcentagem
  ] =
    useState(0);


  const [
    isDragActive,
    setIsDragActive
  ] =
    useState(false);


  const [
    tabelaDestino,
    setTabelaDestino
  ] =
    useState(
      'carga_maquina'
    );


  /* =====================================================
     CONFIRMAÇÃO
  ===================================================== */

  const [
    arquivoPendente,
    setArquivoPendente
  ] =
    useState(null);


  const [
    confirmacaoAberta,
    setConfirmacaoAberta
  ] =
    useState(false);


  const fileInputRef =
    useRef(null);


  /* =====================================================
     EVITA FECHAR A PÁGINA DURANTE IMPORTAÇÃO
  ===================================================== */

  useEffect(() => {
    const handleBeforeUnload =
      (evento) => {
        if (!carregando) {
          return;
        }


        evento.preventDefault();

        evento.returnValue =
          '';
      };


    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );


    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };
  }, [
    carregando
  ]);


  /* =====================================================
     DATA
  ===================================================== */

  const formatarData =
    useCallback(
      (valor) => {
        if (
          valor === null ||
          valor === undefined ||
          valor === ''
        ) {
          return null;
        }


        /*
         * Data serial do Excel.
         */

        if (
          typeof valor ===
          'number'
        ) {
          const dataExcel =
            XLSX.SSF
              .parse_date_code(
                valor
              );


          if (!dataExcel) {
            return null;
          }


          const ano =
            String(
              dataExcel.y
            ).padStart(
              4,
              '0'
            );


          const mes =
            String(
              dataExcel.m
            ).padStart(
              2,
              '0'
            );


          const dia =
            String(
              dataExcel.d
            ).padStart(
              2,
              '0'
            );


          return (
            `${ano}-${mes}-${dia}`
          );
        }


        /*
         * Objeto Date.
         */

        if (
          valor instanceof
          Date
        ) {
          if (
            Number.isNaN(
              valor.getTime()
            )
          ) {
            return null;
          }


          return formatISO(
            valor,
            {
              representation:
                'date'
            }
          );
        }


        /*
         * Data em texto.
         */

        if (
          typeof valor ===
          'string'
        ) {
          const texto =
            valor.trim();


          if (!texto) {
            return null;
          }


          const formatosPossiveis = [
            'dd/MM/yyyy HH:mm:ss',
            'dd/MM/yyyy HH:mm',
            'dd/MM/yyyy',
            'yyyy-MM-dd HH:mm:ss',
            'yyyy-MM-dd HH:mm',
            'yyyy-MM-dd'
          ];


          for (
            const formato
            of formatosPossiveis
          ) {
            const dataConvertida =
              parse(
                texto,
                formato,
                new Date()
              );


            if (
              isValid(
                dataConvertida
              )
            ) {
              return formatISO(
                dataConvertida,
                {
                  representation:
                    'date'
                }
              );
            }
          }
        }


        return null;
      },
      []
    );


  /* =====================================================
     DATA E HORA
  ===================================================== */

  const formatarDataHora =
    useCallback(
      (valor) => {
        if (
          valor === null ||
          valor === undefined ||
          valor === ''
        ) {
          return null;
        }


        const montarTimestamp =
          (
            ano,
            mes,
            dia,
            hora = 0,
            minuto = 0,
            segundo = 0
          ) => {
            const anoFormatado =
              String(
                ano
              ).padStart(
                4,
                '0'
              );


            const mesFormatado =
              String(
                mes
              ).padStart(
                2,
                '0'
              );


            const diaFormatado =
              String(
                dia
              ).padStart(
                2,
                '0'
              );


            const horaFormatada =
              String(
                hora
              ).padStart(
                2,
                '0'
              );


            const minutoFormatado =
              String(
                minuto
              ).padStart(
                2,
                '0'
              );


            const segundoFormatado =
              String(
                Math.floor(
                  segundo
                )
              ).padStart(
                2,
                '0'
              );


            return (
              `${anoFormatado}-${mesFormatado}-${diaFormatado}` +
              `T${horaFormatada}:${minutoFormatado}:${segundoFormatado}-03:00`
            );
          };


        /*
         * Número serial do Excel.
         */

        if (
          typeof valor ===
          'number'
        ) {
          const dataExcel =
            XLSX.SSF
              .parse_date_code(
                valor
              );


          if (!dataExcel) {
            return null;
          }


          return montarTimestamp(
            dataExcel.y,
            dataExcel.m,
            dataExcel.d,
            dataExcel.H ||
              0,
            dataExcel.M ||
              0,
            dataExcel.S ||
              0
          );
        }


        /*
         * Objeto Date.
         */

        if (
          valor instanceof
          Date
        ) {
          if (
            Number.isNaN(
              valor.getTime()
            )
          ) {
            return null;
          }


          return montarTimestamp(
            valor.getFullYear(),
            valor.getMonth() +
              1,
            valor.getDate(),
            valor.getHours(),
            valor.getMinutes(),
            valor.getSeconds()
          );
        }


        /*
         * Texto.
         */

        const texto =
          String(
            valor
          ).trim();


        if (!texto) {
          return null;
        }


        const formatosPossiveis = [
          'dd/MM/yyyy HH:mm:ss',
          'dd/MM/yyyy HH:mm',
          'dd/MM/yyyy',
          'yyyy-MM-dd HH:mm:ss',
          'yyyy-MM-dd HH:mm',
          'yyyy-MM-dd'
        ];


        for (
          const formato
          of formatosPossiveis
        ) {
          const dataConvertida =
            parse(
              texto,
              formato,
              new Date()
            );


          if (
            isValid(
              dataConvertida
            )
          ) {
            return montarTimestamp(
              dataConvertida
                .getFullYear(),

              dataConvertida
                .getMonth() +
                1,

              dataConvertida
                .getDate(),

              dataConvertida
                .getHours(),

              dataConvertida
                .getMinutes(),

              dataConvertida
                .getSeconds()
            );
          }
        }


        return null;
      },
      []
    );


  /* =====================================================
     DURAÇÃO
  ===================================================== */

  const formatarDuracao =
    useCallback(
      (valor) => {
        if (
          valor === null ||
          valor === undefined ||
          valor === ''
        ) {
          return '';
        }


        let totalSegundos =
          null;


        /*
         * Excel armazena duração
         * como fração de um dia.
         */

        if (
          typeof valor ===
          'number'
        ) {
          if (
            !Number.isFinite(
              valor
            )
          ) {
            return '';
          }


          totalSegundos =
            Math.round(
              valor *
              24 *
              60 *
              60
            );
        }


        /*
         * Objeto Date.
         */

        else if (
          valor instanceof
          Date
        ) {
          if (
            Number.isNaN(
              valor.getTime()
            )
          ) {
            return '';
          }


          const baseExcelUTC =
            Date.UTC(
              1899,
              11,
              30,
              0,
              0,
              0
            );


          const valorUTC =
            Date.UTC(
              valor
                .getUTCFullYear(),

              valor
                .getUTCMonth(),

              valor
                .getUTCDate(),

              valor
                .getUTCHours(),

              valor
                .getUTCMinutes(),

              valor
                .getUTCSeconds()
            );


          totalSegundos =
            Math.round(
              (
                valorUTC -
                baseExcelUTC
              ) /
              1000
            );


          if (
            !Number.isFinite(
              totalSegundos
            ) ||
            totalSegundos <
              0
          ) {
            totalSegundos =
              valor.getUTCHours() *
                3600 +
              valor.getUTCMinutes() *
                60 +
              valor.getUTCSeconds();
          }
        }


        /*
         * Texto.
         */

        else {
          const texto =
            String(
              valor
            )
              .trim()
              .replace(
                /\s+/g,
                ''
              );


          if (!texto) {
            return '';
          }


          const resultado =
            texto.match(
              /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/
            );


          if (!resultado) {
            const numeroConvertido =
              Number(
                texto.replace(
                  ',',
                  '.'
                )
              );


            if (
              Number.isFinite(
                numeroConvertido
              )
            ) {
              totalSegundos =
                Math.round(
                  numeroConvertido *
                  24 *
                  60 *
                  60
                );
            } else {
              return texto;
            }
          } else {
            const horas =
              Number(
                resultado[1]
              );


            const minutos =
              Number(
                resultado[2]
              );


            const segundos =
              Number(
                resultado[3] ||
                0
              );


            totalSegundos =
              horas *
                3600 +
              minutos *
                60 +
              segundos;
          }
        }


        if (
          totalSegundos ===
            null ||
          !Number.isFinite(
            totalSegundos
          )
        ) {
          return '';
        }


        totalSegundos =
          Math.max(
            0,
            Math.round(
              totalSegundos
            )
          );


        const horas =
          Math.floor(
            totalSegundos /
            3600
          );


        const minutos =
          Math.floor(
            (
              totalSegundos %
              3600
            ) /
            60
          );


        const segundos =
          totalSegundos %
          60;


        return [
          String(
            horas
          ).padStart(
            2,
            '0'
          ),

          String(
            minutos
          ).padStart(
            2,
            '0'
          ),

          String(
            segundos
          ).padStart(
            2,
            '0'
          )
        ].join(
          ':'
        );
      },
      []
    );


  /* =====================================================
     NÚMEROS
  ===================================================== */

  const parseNumero =
    useCallback(
      (valor) => {
        if (
          valor === undefined ||
          valor === null ||
          valor === ''
        ) {
          return 0;
        }


        if (
          typeof valor ===
          'number'
        ) {
          return Number.isFinite(
            valor
          )
            ? valor
            : 0;
        }


        let texto =
          String(
            valor
          )
            .trim()
            .replace(
              /\s/g,
              ''
            );


        if (
          texto.includes(
            ','
          ) &&
          texto.includes(
            '.'
          )
        ) {
          texto =
            texto
              .replace(
                /\./g,
                ''
              )
              .replace(
                ',',
                '.'
              );
        } else {
          texto =
            texto.replace(
              ',',
              '.'
            );
        }


        const resultado =
          Number.parseFloat(
            texto
          );


        return Number.isFinite(
          resultado
        )
          ? resultado
          : 0;
      },
      []
    );


  /* =====================================================
     LIMPAR TEXTO
  ===================================================== */

  const limparTexto =
    useCallback(
      (valor) => {
        return String(
          valor ??
          ''
        )
          .replace(
            /[\r\n\t]+/g,
            ' '
          )
          .replace(
            /\s+/g,
            ' '
          )
          .trim();
      },
      []
    );


  /* =====================================================
     NORMALIZAR CABEÇALHO
  ===================================================== */

  const normalizarCabecalho =
    useCallback(
      (valor) => {
        return String(
          valor ||
          ''
        )
          .trim()
          .toLowerCase()
          .normalize(
            'NFD'
          )
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /\s+/g,
            ' '
          );
      },
      []
    );


  /* =====================================================
     PROCESSAR E ENVIAR O ARQUIVO

     SOMENTE É CHAMADO DEPOIS DA CONFIRMAÇÃO.
  ===================================================== */

  const processarArquivo =
    useCallback(
      async (file) => {
        if (!file) {
          return;
        }


        const extensao =
          file.name
            .split('.')
            .pop()
            ?.toLowerCase();


        if (
          ![
            'xlsx',
            'xls',
            'xlsm'
          ].includes(
            extensao
          )
        ) {
          setStatus(
            '❌ Erro: selecione um arquivo Excel .xlsx, .xls ou .xlsm.'
          );

          return;
        }


        setCarregando(
          true
        );

        setStatus(
          'Lendo arquivo...'
        );

        setPorcentagem(
          0
        );


        const reader =
          new FileReader();


        reader.onerror =
          () => {
            setStatus(
              '❌ Erro ao ler o arquivo.'
            );


            setCarregando(
              false
            );


            if (
              fileInputRef
                .current
            ) {
              fileInputRef
                .current
                .value =
                '';
            }
          };


        reader.onload =
          (evento) => {
            setTimeout(
              async () => {
                try {
                  const conteudo =
                    evento.target
                      ?.result;


                  if (!conteudo) {
                    throw new Error(
                      'Não foi possível ler o conteúdo do arquivo.'
                    );
                  }


                  /*
                   * cellDates false:
                   * duração continua numérica.
                   */

                  const workbook =
                    XLSX.read(
                      conteudo,
                      {
                        type:
                          'array',

                        cellDates:
                          false,

                        cellNF:
                          true,

                        cellText:
                          true
                      }
                    );


                  /*
                   * Somente aba Banco.
                   */

                  const nomeAbaEncontrada =
                    workbook
                      .SheetNames
                      .find(
                        (
                          nomeAba
                        ) =>
                          nomeAba
                            .trim()
                            .toLowerCase() ===
                          NOME_ABA_IMPORTACAO
                      );


                  if (
                    !nomeAbaEncontrada
                  ) {
                    const abasEncontradas =
                      workbook
                        .SheetNames
                        .map(
                          (
                            nome
                          ) =>
                            `"${nome}"`
                        )
                        .join(
                          ', '
                        );


                    throw new Error(
                      `A aba "Banco" não foi encontrada. Abas existentes: ${
                        abasEncontradas ||
                        'nenhuma'
                      }.`
                    );
                  }


                  const sheet =
                    workbook
                      .Sheets[
                        nomeAbaEncontrada
                      ];


                  if (!sheet) {
                    throw new Error(
                      'Não foi possível acessar a aba Banco.'
                    );
                  }


                  const rows =
                    XLSX
                      .utils
                      .sheet_to_json(
                        sheet,
                        {
                          defval:
                            '',

                          raw:
                            true
                        }
                      );


                  if (
                    rows.length ===
                    0
                  ) {
                    throw new Error(
                      'A aba Banco está vazia.'
                    );
                  }


                  setStatus(
                    `Lendo a aba "${nomeAbaEncontrada}" e formatando os dados...`
                  );


                  const cacheAliasesCabecalho =
                    new Map();


                  const obterAliasesNormalizados =
                    (
                      chavesPossiveis
                    ) => {
                      const chaveCache =
                        chavesPossiveis.join(
                          '\u0000'
                        );


                      if (
                        !cacheAliasesCabecalho
                          .has(
                            chaveCache
                          )
                      ) {
                        cacheAliasesCabecalho
                          .set(
                            chaveCache,

                            new Set(
                              chavesPossiveis
                                .map(
                                  normalizarCabecalho
                                )
                            )
                          );
                      }


                      return cacheAliasesCabecalho
                        .get(
                          chaveCache
                        );
                    };


                  const dadosFormatados =
                    rows.map(
                      (
                        linha,
                        indice
                      ) => {
                        const linhaExcel =
                          indice +
                          2;


                        const chavesDaLinha =
                          Object
                            .keys(
                              linha
                            )
                            .map(
                              (
                                chave
                              ) => ({
                                chave,

                                normalizada:
                                  normalizarCabecalho(
                                    chave
                                  )
                              })
                            );


                        const getVal =
                          (
                            chavesPossiveis
                          ) => {
                            const aliases =
                              obterAliasesNormalizados(
                                chavesPossiveis
                              );


                            const itemEncontrado =
                              chavesDaLinha
                                .find(
                                  (
                                    item
                                  ) =>
                                    aliases.has(
                                      item.normalizada
                                    )
                                );


                            return itemEncontrado
                              ? linha[
                                  itemEncontrado
                                    .chave
                                ]
                              : '';
                          };


                        /* =================================
                           CICLO INJETORA
                        ================================= */

                        if (
                          tabelaDestino ===
                          'ciclo_injetora'
                        ) {
                          const registroCiclo = {
                            injetora:
                              limparTexto(
                                getVal([
                                  'Injetora'
                                ])
                              ),

                            data:
                              formatarData(
                                getVal([
                                  'Data'
                                ])
                              ),

                            cod_produto:
                              limparTexto(
                                getVal([
                                  'Cód. Produto',
                                  'Cod. Produto',
                                  'Cod Produto',
                                  'Codigo Produto'
                                ])
                              ),

                            descricao:
                              limparTexto(
                                getVal([
                                  'Descrição',
                                  'Descricao'
                                ])
                              ),

                            cavidade_molde:
                              Math.trunc(
                                parseNumero(
                                  getVal([
                                    'Cavidade Molde',
                                    'Cavidade'
                                  ])
                                )
                              ),

                            tempo_resfriamento:
                              formatarDuracao(
                                getVal([
                                  'Tempo de Resfriamento',
                                  'Resfriamento'
                                ])
                              ),

                            ciclo:
                              formatarDuracao(
                                getVal([
                                  'Ciclo'
                                ])
                              ),

                            tempo_injecao:
                              formatarDuracao(
                                getVal([
                                  'Tempo de Injeção',
                                  'Tempo Injecao'
                                ])
                              ),

                            kg_un:
                              parseNumero(
                                getVal([
                                  'Kg UN',
                                  'KG UN',
                                  'Kg/Un'
                                ])
                              ),

                            kg_haste:
                              parseNumero(
                                getVal([
                                  'Kg HASTE',
                                  'KG HASTE',
                                  'Kg/Haste'
                                ])
                              ),

                            observacao:
                              limparTexto(
                                getVal([
                                  'Observação',
                                  'Observacao',
                                  'Obs'
                                ])
                              )
                          };


                          Object
                            .defineProperty(
                              registroCiclo,
                              '__linhaExcel',
                              {
                                value:
                                  linhaExcel,

                                enumerable:
                                  false
                              }
                            );


                          return registroCiclo;
                        }


                        /* =================================
                           CARGA MÁQUINA
                        ================================= */

                        const registro = {
                          cod_prod:
                            limparTexto(
                              getVal([
                                'Cód.Prod',
                                'Cod. Prod',
                                'Cod Prod',
                                'Cód. Produto',
                                'Cod_Prod'
                              ])
                            ),

                          injetora:
                            limparTexto(
                              getVal([
                                'Injetora'
                              ])
                            ),

                          inicio:
                            formatarDataHora(
                              getVal([
                                'Início',
                                'Inicio'
                              ])
                            ),

                          fim:
                            formatarDataHora(
                              getVal([
                                'Fim',
                                'Término',
                                'Termino'
                              ])
                            ),

                          duracao:
                            formatarDuracao(
                              getVal([
                                'Duração',
                                'Duracao'
                              ])
                            ),

                          op:
                            limparTexto(
                              getVal([
                                'OP',
                                'Ordem',
                                'Ordem Producao'
                              ])
                            ),

                          tipo:
                            limparTexto(
                              getVal([
                                'Tipo'
                              ])
                            ),

                          motivo:
                            limparTexto(
                              getVal([
                                'Motivo'
                              ])
                            ),

                          justificativa:
                            limparTexto(
                              getVal([
                                'Justificativa'
                              ])
                            ),

                          celula:
                            limparTexto(
                              getVal([
                                'Célula',
                                'Celula'
                              ])
                            ),

                          operador:
                            limparTexto(
                              getVal([
                                'Operador'
                              ])
                            ),

                          material:
                            limparTexto(
                              getVal([
                                'Material'
                              ])
                            ),

                          qtde_perdida_devido_pausa:
                            parseNumero(
                              getVal([
                                'Qtde perdida devido pausa',
                                'Qtde Perdida Devido Pausa'
                              ])
                            ),

                          cliente:
                            limparTexto(
                              getVal([
                                'Cliente'
                              ])
                            ),

                          status:
                            limparTexto(
                              getVal([
                                'Status'
                              ])
                            ),

                          lista_de_data:
                            formatarData(
                              getVal([
                                'ListaDeData',
                                'Lista De Data',
                                'Lista de Data'
                              ])
                            ),

                          inicio_dia:
                            formatarDataHora(
                              getVal([
                                'InicioDia',
                                'Início Dia',
                                'InícioDia'
                              ])
                            ),

                          fim_dia:
                            formatarDataHora(
                              getVal([
                                'FimDia',
                                'Fim Dia'
                              ])
                            ),

                          tempo:
                            formatarDuracao(
                              getVal([
                                'Tempo'
                              ])
                            ),

                          conforme:
                            Math.trunc(
                              parseNumero(
                                getVal([
                                  'Conforme'
                                ])
                              )
                            ),

                          danificada:
                            Math.trunc(
                              parseNumero(
                                getVal([
                                  'Danificada'
                                ])
                              )
                            ),

                          mp:
                            limparTexto(
                              getVal([
                                'M.P',
                                'MP'
                              ])
                            ),

                          pecas:
                            Math.trunc(
                              parseNumero(
                                getVal([
                                  'Peças',
                                  'Pecas'
                                ])
                              )
                            ),

                          no_injetora:
                            limparTexto(
                              getVal([
                                '№ Injetora',
                                'No Injetor',
                                'Nº Injetora'
                              ])
                            ),

                          peso:
                            parseNumero(
                              getVal([
                                'Peso'
                              ])
                            ),

                          consumido:
                            parseNumero(
                              getVal([
                                'Consumido'
                              ])
                            )
                        };


                        Object
                          .defineProperty(
                            registro,
                            '__linhaExcel',
                            {
                              value:
                                linhaExcel,

                              enumerable:
                                false
                            }
                          );


                        return registro;
                      }
                    );


                  /* =======================================
                     REGISTROS VÁLIDOS
                  ======================================= */

                  const registrosValidos =
                    dadosFormatados
                      .filter(
                        (
                          registro
                        ) => {
                          if (
                            tabelaDestino ===
                            'ciclo_injetora'
                          ) {
                            return Boolean(
                              registro.injetora ||
                              registro.data ||
                              registro.cod_produto
                            );
                          }


                          return Boolean(
                            registro.injetora ||
                            registro.cod_prod ||
                            registro.status ||
                            registro.motivo
                          );
                        }
                      );


                  if (
                    registrosValidos.length ===
                    0
                  ) {
                    throw new Error(
                      'A aba Banco não contém registros válidos para importação.'
                    );
                  }


                  setStatus(
                    `Enviando ${registrosValidos.length} registros da aba Banco...`
                  );


                  /* =======================================
                     ENVIO EM LOTES
                  ======================================= */

                  for (
                    let indice = 0;
                    indice <
                    registrosValidos.length;
                    indice +=
                    TAMANHO_LOTE
                  ) {
                    const lote =
                      registrosValidos
                        .slice(
                          indice,
                          indice +
                          TAMANHO_LOTE
                        );


                    const {
                      error:
                        insertError
                    } =
                      await supabase
                        .from(
                          tabelaDestino
                        )
                        .insert(
                          lote
                        );


                    if (
                      insertError
                    ) {
                      const primeiraLinha =
                        lote[0]
                          ?.__linhaExcel;


                      throw new Error(
                        primeiraLinha
                          ? `Falha no lote iniciado na linha ${primeiraLinha} da aba Banco: ${insertError.message}`
                          : insertError.message
                      );
                    }


                    const processados =
                      Math.min(
                        indice +
                        lote.length,

                        registrosValidos.length
                      );


                    setPorcentagem(
                      Math.round(
                        (
                          processados /
                          registrosValidos.length
                        ) *
                        100
                      )
                    );
                  }


                  setStatus(
                    `✅ Sucesso: ${registrosValidos.length} registros importados somente da aba "${nomeAbaEncontrada}".`
                  );
                } catch (
                  erro
                ) {
                  console.error(
                    'Erro durante a importação:',
                    erro
                  );


                  setStatus(
                    `❌ Erro: ${
                      erro?.message ||
                      'Falha desconhecida durante a importação.'
                    }`
                  );
                } finally {
                  setCarregando(
                    false
                  );


                  if (
                    fileInputRef
                      .current
                  ) {
                    fileInputRef
                      .current
                      .value =
                      '';
                  }
                }
              },
              50
            );
          };


        reader
          .readAsArrayBuffer(
            file
          );
      },
      [
        tabelaDestino,
        formatarData,
        formatarDataHora,
        formatarDuracao,
        parseNumero,
        limparTexto,
        normalizarCabecalho
      ]
    );


  /* =====================================================
     ABRIR CONFIRMAÇÃO

     NÃO IMPORTA NADA AQUI.
  ===================================================== */

  const solicitarConfirmacao =
    useCallback(
      (arquivo) => {
        if (
          !arquivo ||
          carregando
        ) {
          return;
        }


        const extensao =
          arquivo.name
            .split('.')
            .pop()
            ?.toLowerCase();


        if (
          ![
            'xlsx',
            'xls',
            'xlsm'
          ].includes(
            extensao
          )
        ) {
          setStatus(
            '❌ Erro: selecione um arquivo Excel .xlsx, .xls ou .xlsm.'
          );


          if (
            fileInputRef
              .current
          ) {
            fileInputRef
              .current
              .value =
              '';
          }


          return;
        }


        setStatus(
          ''
        );


        setPorcentagem(
          0
        );


        setArquivoPendente(
          arquivo
        );


        setConfirmacaoAberta(
          true
        );
      },
      [
        carregando
      ]
    );


  /* =====================================================
     CANCELAR CONFIRMAÇÃO
  ===================================================== */

  const cancelarConfirmacao =
    useCallback(
      () => {
        setConfirmacaoAberta(
          false
        );


        setArquivoPendente(
          null
        );


        if (
          fileInputRef
            .current
        ) {
          fileInputRef
            .current
            .value =
            '';
        }
      },
      []
    );


  /* =====================================================
     CONFIRMAR IMPORTAÇÃO

     SOMENTE AQUI O PROCESSAMENTO COMEÇA.
  ===================================================== */

  const confirmarImportacao =
    useCallback(
      () => {
        if (
          !arquivoPendente ||
          carregando
        ) {
          return;
        }


        const arquivo =
          arquivoPendente;


        setConfirmacaoAberta(
          false
        );


        setArquivoPendente(
          null
        );


        processarArquivo(
          arquivo
        );
      },
      [
        arquivoPendente,
        carregando,
        processarArquivo
      ]
    );


  /* =====================================================
     ESC FECHA A CONFIRMAÇÃO
  ===================================================== */

  useEffect(
    () => {
      if (
        !confirmacaoAberta
      ) {
        return;
      }


      const aoPressionarTecla =
        (
          evento
        ) => {
          if (
            evento.key ===
            'Escape'
          ) {
            cancelarConfirmacao();
          }
        };


      document
        .addEventListener(
          'keydown',
          aoPressionarTecla
        );


      return () => {
        document
          .removeEventListener(
            'keydown',
            aoPressionarTecla
          );
      };
    },
    [
      confirmacaoAberta,
      cancelarConfirmacao
    ]
  );


  /* =====================================================
     NOME DO DESTINO
  ===================================================== */

  const nomeTabelaDestino =
    tabelaDestino ===
    'ciclo_injetora'
      ? 'Ciclo Injetora'
      : 'Carga Máquina';


  /* =====================================================
     VOLTAR
  ===================================================== */

  const handleVoltar =
    useCallback(
      () =>
        navigate(
          '/'
        ),
      [
        navigate
      ]
    );


  /* =====================================================
     ALTERAR TABELA
  ===================================================== */

  const handleTabelaChange =
    useCallback(
      (
        evento
      ) => {
        setTabelaDestino(
          evento.target
            .value
        );


        setStatus(
          ''
        );


        setPorcentagem(
          0
        );
      },
      []
    );


  /* =====================================================
     DRAG
  ===================================================== */

  const handleDragOver =
    useCallback(
      (
        evento
      ) => {
        evento.preventDefault();
      },
      []
    );


  const handleDragEnter =
    useCallback(
      (
        evento
      ) => {
        evento.preventDefault();


        setIsDragActive(
          true
        );
      },
      []
    );


  const handleDragLeave =
    useCallback(
      (
        evento
      ) => {
        evento.preventDefault();


        if (
          !evento.currentTarget
            .contains(
              evento.relatedTarget
            )
        ) {
          setIsDragActive(
            false
          );
        }
      },
      []
    );


  const handleDrop =
    useCallback(
      (
        evento
      ) => {
        evento.preventDefault();


        setIsDragActive(
          false
        );


        const arquivo =
          evento
            .dataTransfer
            .files?.[0];


        if (
          !carregando &&
          arquivo
        ) {
          solicitarConfirmacao(
            arquivo
          );
        }
      },
      [
        carregando,
        solicitarConfirmacao
      ]
    );


  /* =====================================================
     CLICK DROPZONE
  ===================================================== */

  const handleDropzoneClick =
    useCallback(
      () => {
        if (
          !carregando &&
          !confirmacaoAberta &&
          fileInputRef.current
        ) {
          fileInputRef
            .current
            .click();
        }
      },
      [
        carregando,
        confirmacaoAberta
      ]
    );


  /* =====================================================
     SELECIONAR ARQUIVO

     AGORA ABRE A CONFIRMAÇÃO.
  ===================================================== */

  const handleFileChange =
    useCallback(
      (
        evento
      ) => {
        const arquivo =
          evento
            .target
            .files?.[0];


        if (arquivo) {
          solicitarConfirmacao(
            arquivo
          );
        }
      },
      [
        solicitarConfirmacao
      ]
    );


  /* =====================================================
     TECLADO
  ===================================================== */

  const handleDropzoneKeyDown =
    useCallback(
      (
        evento
      ) => {
        if (
          evento.key ===
            'Enter' ||
          evento.key ===
            ' '
        ) {
          evento.preventDefault();


          handleDropzoneClick();
        }
      },
      [
        handleDropzoneClick
      ]
    );


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="importador-container">

      <button
        type="button"
        className="back-importador-btn"
        onClick={
          handleVoltar
        }
        disabled={
          carregando
        }
      >
        <FiArrowLeft />

        <span>
          Página Inicial
        </span>
      </button>


      <div className="importador-card">

        <h3>
          Importador de Dados
        </h3>


        <div className="select-tabela">

          <label
            htmlFor="tabela-destino"
          >
            Selecione a tabela de destino:
          </label>


          <select
            id="tabela-destino"
            value={
              tabelaDestino
            }
            onChange={
              handleTabelaChange
            }
            disabled={
              carregando ||
              confirmacaoAberta
            }
          >
            <option
              value="carga_maquina"
            >
              Carga Máquina
            </option>


            <option
              value="ciclo_injetora"
            >
              Ciclo Injetora
            </option>

          </select>

        </div>


        <div
          className={[
            'upload-dropzone',

            isDragActive
              ? 'drag-active'
              : '',

            carregando
              ? 'disabled'
              : ''
          ]
            .filter(
              Boolean
            )
            .join(
              ' '
            )}
          role="button"
          tabIndex={
            carregando
              ? -1
              : 0
          }
          aria-disabled={
            carregando
          }
          onDragEnter={
            handleDragEnter
          }
          onDragLeave={
            handleDragLeave
          }
          onDragOver={
            handleDragOver
          }
          onDrop={
            handleDrop
          }
          onClick={
            handleDropzoneClick
          }
          onKeyDown={
            handleDropzoneKeyDown
          }
        >

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".xlsx,.xls,.xlsm"
            onChange={
              handleFileChange
            }
            disabled={
              carregando
            }
            style={{
              display:
                'none'
            }}
          />


          <p>
            {carregando
              ? 'Processando a aba Banco...'
              : 'Arraste o arquivo ou clique aqui'}
          </p>


          {!carregando && (
            <small>
              Formatos aceitos: XLSX, XLS e XLSM. Somente a aba “Banco” será importada.
            </small>
          )}

        </div>


        {status && (
          <div className="status-container">

            <p>
              {status}
            </p>


            {carregando && (
              <div
                className="progress-bar-container"
                style={{
                  width:
                    '100%',

                  marginTop:
                    '8px',

                  overflow:
                    'hidden',

                  background:
                    '#e2e8f0',

                  borderRadius:
                    '999px'
                }}
              >

                <div
                  className="progress-bar-fill"
                  style={{
                    width:
                      `${porcentagem}%`,

                    height:
                      '8px',

                    background:
                      'linear-gradient(90deg, #0b1f5e, #2e5bba, #3dbb63)',

                    transition:
                      'width 0.2s ease'
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

      {confirmacaoAberta &&
        arquivoPendente && (

          <div
            className="importacao-confirmacao-overlay"
            role="presentation"
            onMouseDown={
              (
                evento
              ) => {
                if (
                  evento.target ===
                  evento.currentTarget
                ) {
                  cancelarConfirmacao();
                }
              }
            }
          >

            <section
              className="importacao-confirmacao-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-confirmacao-importacao"
            >

              {/* ===========================================
                  CABEÇALHO
              =========================================== */}

              <div className="importacao-confirmacao-header">

                <div className="importacao-confirmacao-icone">

                  <FiUploadCloud />

                </div>


                <div className="importacao-confirmacao-titulo">

                  <span>
                    IMPORTAÇÃO DE DADOS
                  </span>


                  <h3
                    id="titulo-confirmacao-importacao"
                  >
                    Confirmar importação
                  </h3>


                  <p>
                    Confira as informações
                    antes de continuar.
                  </p>

                </div>


                <button
                  type="button"
                  className="importacao-confirmacao-fechar"
                  onClick={
                    cancelarConfirmacao
                  }
                  aria-label="Fechar confirmação"
                >
                  <FiX />
                </button>

              </div>


              {/* ===========================================
                  INFORMAÇÕES
              =========================================== */}

              <div className="importacao-confirmacao-conteudo">

                <div className="importacao-confirmacao-arquivo">

                  <div className="importacao-confirmacao-arquivo-icone">
                    <FiFileText />
                  </div>


                  <div>

                    <span>
                      Arquivo selecionado
                    </span>


                    <strong>
                      {arquivoPendente.name}
                    </strong>

                  </div>

                </div>


                <div className="importacao-confirmacao-detalhes">

                  <div>

                    <span>
                      Destino
                    </span>

                    <strong>
                      {nomeTabelaDestino}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Aba importada
                    </span>

                    <strong>
                      Banco
                    </strong>

                  </div>

                </div>


                <div className="importacao-confirmacao-alerta">

                  <FiAlertTriangle />


                  <div>

                    <strong>
                      Atenção
                    </strong>


                    <p>
                      Ao confirmar, os registros
                      encontrados na aba Banco
                      serão adicionados à tabela{" "}
                      <strong>
                        {nomeTabelaDestino}
                      </strong>.
                    </p>

                  </div>

                </div>

              </div>


              {/* ===========================================
                  AÇÕES
              =========================================== */}

              <div className="importacao-confirmacao-acoes">

                <button
                  type="button"
                  className="importacao-confirmacao-cancelar"
                  onClick={
                    cancelarConfirmacao
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="importacao-confirmacao-importar"
                  onClick={
                    confirmarImportacao
                  }
                >

                  <FiUploadCloud />

                  <span>
                    Confirmar importação
                  </span>

                </button>

              </div>

            </section>

          </div>

        )}

    </div>
  );
}