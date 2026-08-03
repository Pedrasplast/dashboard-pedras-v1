import React, {
    useMemo,
    useState
} from 'react';

import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useCargaMaquina } from "@/lib/cargaMaquina";
import FiltrosDashboard from './FiltrosDashboard';
import Sidebar from '@/components/layout/Sidebar';

import {
    CheckCircle2,
    XCircle,
    Clock,
    PauseCircle,
    Calculator,
    Target
} from 'lucide-react';

import './Dashboard.css';



/*
 * Extrai a data no formato YYYY-MM-DD.
 *
 * Prioriza lista_de_data porque ela já representa
 * diretamente o dia do registro no banco.
 */
const extrairDataISORegistro = (registro) => {
    const valorData =
        registro?.lista_de_data ||
        registro?.inicio ||
        registro?.inicio_dia ||
        registro?.data ||
        null;

    if (!valorData) {
        return null;
    }

    const textoData =
        String(valorData).trim();

    const correspondencia =
        textoData.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (correspondencia) {
        return [
            correspondencia[1],
            correspondencia[2],
            correspondencia[3]
        ].join('-');
    }

    const data =
        new Date(valorData);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return null;
    }

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, '0');

    const dia =
        String(
            data.getDate()
        ).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
};

const ordenarValores = (valores) => {
    return [
        ...new Set(
            valores.filter(
                (valor) =>
                    valor !== null &&
                    valor !== undefined &&
                    String(valor).trim() !== ''
            )
        )
    ].sort((a, b) =>
        String(a).localeCompare(
            String(b),
            'pt-BR',
            {
                numeric: true,
                sensitivity: 'base'
            }
        )
    );
};

export default function Dashboard() {
    /*
     * Registros de carga_maquina vindos do cache
     * compartilhado, com paginação completa.
     */
    const {
        dados: rawDados,
        loading,
        erro
    } = useCargaMaquina();

    const [
        filtros,
        setFiltros
    ] = useState({
        injetora: 'Todos',
        cod_prod: 'Todos',
        tipo: [],
        dataInicio: '',
        dataFim: ''
    });


    /*
     * Tipos disponíveis.
     */
    const tiposDisponiveis =
        useMemo(() => {
            return ordenarValores(
                rawDados.map(
                    (registro) =>
                        registro.tipo
                )
            );
        }, [rawDados]);

    /*
     * Produtos disponíveis conforme
     * a injetora selecionada.
     */
    const produtosDisponiveis =
        useMemo(() => {
            const baseProdutos =
                filtros.injetora ===
                    'Todos'
                    ? rawDados
                    : rawDados.filter(
                        (registro) =>
                            registro.injetora ===
                            filtros.injetora
                    );

            return ordenarValores(
                baseProdutos.map(
                    (registro) =>
                        registro.cod_prod
                )
            );
        }, [
            rawDados,
            filtros.injetora
        ]);

    /*
     * Aplica somente:
     *
     * - injetora;
     * - produto;
     * - período.
     *
     * O Tipo NÃO é aplicado nesta base.
     *
     * Isso impede que Conforme, Danificadas,
     * Qualidade e Hora Trabalhada fiquem zerados.
     */
    const dadosFiltrados =
        useMemo(() => {
            return rawDados.filter(
                (registro) => {
                    if (
                        filtros.injetora !==
                        'Todos' &&
                        registro.injetora !==
                        filtros.injetora
                    ) {
                        return false;
                    }

                    if (
                        filtros.cod_prod !==
                        'Todos' &&
                        registro.cod_prod !==
                        filtros.cod_prod
                    ) {
                        return false;
                    }

                    const dataRegistro =
                        extrairDataISORegistro(
                            registro
                        );

                    if (
                        filtros.dataInicio
                    ) {
                        if (
                            !dataRegistro ||
                            dataRegistro <
                            filtros.dataInicio
                        ) {
                            return false;
                        }
                    }

                    if (
                        filtros.dataFim
                    ) {
                        if (
                            !dataRegistro ||
                            dataRegistro >
                            filtros.dataFim
                        ) {
                            return false;
                        }
                    }

                    return true;
                }
            );
        }, [
            rawDados,
            filtros.injetora,
            filtros.cod_prod,
            filtros.dataInicio,
            filtros.dataFim
        ]);

    /*
     * O Tipo é enviado separadamente.
     *
     * Ele será usado pelo hook somente para:
     *
     * - incluir sábado e domingo no cartão
     *   Hora Parada quando Tipo 3 estiver ativo.
     */
    const metrics =
        useDashboardMetrics(
            dadosFiltrados,
            filtros.tipo
        );

    const maiorMotivo =
        metrics?.motivos?.[0]?.value ||
        0;

    if (loading) {
        return (
            <div className="loading-spinner">
                Processando dados de produção...
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar>
                <FiltrosDashboard
                    filtros={filtros}
                    setFiltros={setFiltros}
                    tiposDisponiveis={
                        tiposDisponiveis
                    }
                    produtosDisponiveis={
                        produtosDisponiveis
                    }
                    rawDados={rawDados}
                    exibirMp={false}
                />
            </Sidebar>

            <main className="main-content">
                <header className="dashboard-header">
                    <h1>
                        Dashboard de Produção
                    </h1>
                </header>

                {erro && (
                    <div className="dashboard-error">
                        {erro}
                    </div>
                )}

                <section className="kpi-grid">
                    <div className="kpi-card verde">
                        <CheckCircle2
                            size={24}
                            color="#16a34a"
                        />

                        <span>
                            CONFORME
                        </span>

                        <strong>
                            {Number(
                                metrics
                                    ?.totalConforme ||
                                0
                            ).toLocaleString(
                                'pt-BR'
                            )}
                        </strong>
                    </div>

                    <div className="kpi-card vermelho">
                        <XCircle
                            size={20}
                            color="#dc2626"
                        />

                        <span>
                            DANIFICADAS
                        </span>

                        <strong>
                            {Number(
                                metrics
                                    ?.totalDanificadas ||
                                0
                            ).toLocaleString(
                                'pt-BR'
                            )}
                        </strong>
                    </div>

                    <div className="kpi-card verde">
                        <Target
                            size={20}
                            color="#3b82f6"
                        />

                        <span>
                            QUALIDADE
                        </span>

                        <strong>
                            {Number(
                                metrics?.qualidade ||
                                0
                            ).toFixed(2)}{' '}
                            %
                        </strong>
                    </div>

                    <div className="kpi-card verde kpi-horas-trabalhadas">
                        <div className="dias-trabalhados-indicador">
                            <small>
                                DIAS
                            </small>

                            <strong>
                                {metrics?.diasTrabalhados || '0.00'}
                            </strong>
                        </div>

                        <Clock
                            size={20}
                            color="#6b7280"
                        />

                        <span>
                            HORA TRABALHADA
                        </span>

                        <strong className="valor-horas-trabalhadas">
                            {metrics?.horasTrabalhadas || '00:00'} hrs
                        </strong>
                    </div>

                    <div className="kpi-card vermelho kpi-horas-trabalhadas">
                        <div className="dias-trabalhados-indicador">
                            <small>
                                DIAS
                            </small>

                            <strong>
                                {metrics?.diasParados || '0d 00h'}
                            </strong>
                        </div>

                        <PauseCircle
                            size={20}
                            color="#dc2626"
                        />

                        <span>
                            HORA PARADA
                        </span>

                        <strong className="valor-horas-trabalhadas">
                            {metrics
                                ?.horasParadas ||
                                '00:00'}{' '}
                            hrs
                        </strong>
                    </div>

                    <div className="kpi-card verde kpi-horas-trabalhadas">
                        <div className="dias-trabalhados-indicador">
                            <small>
                                DIAS
                            </small>

                            <strong>
                                {metrics?.diasTotais || '0d 00h'}
                            </strong>
                        </div>

                        <Calculator
                            size={20}
                            color="#6b7280"
                        />

                        <span>
                            TOTAL DE HORAS
                        </span>

                        <strong className="valor-horas-trabalhadas">
                            {metrics
                                ?.horasTotais ||
                                '00:00'}{' '}
                            hrs
                        </strong>
                    </div>
                </section>

                <section className="chart-container">
                    <h3>
                        MOTIVOS DE PARADA
                    </h3>

                    <div className="motivos-list">
                        {(metrics?.motivos ||
                            []).length === 0 ? (
                            <p className="sem-dados">
                                Nenhum motivo de parada encontrado.
                            </p>
                        ) : (
                            (
                                metrics?.motivos ||
                                []
                            ).map((item) => {
                                const largura =
                                    maiorMotivo > 0
                                        ? Math.min(
                                            100,
                                            (
                                                item.value /
                                                maiorMotivo
                                            ) * 100
                                        )
                                        : 0;

                                return (
                                    <div
                                        key={item.name}
                                        className="motivo-bar"
                                    >
                                        <div className="label-row">
                                            <span>
                                                {item.name}
                                            </span>

                                            <span>
                                                {
                                                    item.formattedValue
                                                }
                                            </span>
                                        </div>

                                        <div className="progress-bg">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${largura}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}