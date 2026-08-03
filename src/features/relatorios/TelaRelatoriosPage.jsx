import React, { useMemo, useState } from 'react';
import { useNavigate } from "@/lib/navegacao";
import { FiArrowLeft, FiFileText, FiDownload } from 'react-icons/fi';
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useCargaMaquina } from "@/lib/cargaMaquina";
import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";
import jsPDF from 'jspdf';
import './TelaRelatorios.css';

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
    const navigate = useNavigate();

    /*
     * Quando os dados chegam por prop, a consulta é dispensada.
     * Caso contrário usa-se o cache compartilhado com o Dashboard.
     */
    const temDadosExternos =
        Array.isArray(dadosExternos) && dadosExternos.length > 0;

    const { dados, loading: carregando } = useCargaMaquina({
        enabled: !temDadosExternos,
    });

    const dadosBrutos = temDadosExternos ? dadosExternos : dados;
    const loading = temDadosExternos ? false : carregando;

    // Estado unificado de filtros compatível com o FiltrosDashboard
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        injetora: 'Todos',
        cod_prod: 'Todos',
        mp: 'Todos',
        tipo: [],
        status: 'todos' // Mantido caso queira o filtro específico de status
    });


    // --- LISTAS DINÂMICAS PARA OS SELECTS DO FILTRO ---
    const produtosDisponiveis = useMemo(() => {
        let lista = dadosBrutos;
        if (filtros.injetora && filtros.injetora !== 'Todos') {
            lista = lista.filter(d => d.injetora === filtros.injetora);
        }
        return [...new Set(lista.map(d => d.cod_prod || d.produto))].filter(Boolean);
    }, [dadosBrutos, filtros.injetora]);

    const mpsDisponiveis = useMemo(() => {
        return [...new Set(dadosBrutos.map(d => d.mp || d.materia_prima))].filter(Boolean);
    }, [dadosBrutos]);

    const tiposDisponiveis = useMemo(() => {
        return [...new Set(dadosBrutos.map(d => d.tipo))].filter(Boolean);
    }, [dadosBrutos]);

    // --- FILTRAGEM COMPLETA DOS DADOS ---
    const dadosFiltrados = useMemo(() => {
        if (!Array.isArray(dadosBrutos)) return [];

        return dadosBrutos.filter(item => {
            // Filtro de Status adicional (se implementado)
            const statusItem = String(item.status || '').trim().toLowerCase();
            if (filtros.status && filtros.status !== 'todos' && statusItem !== filtros.status) {
                return false;
            }

            // Filtro de Injetora
            if (filtros.injetora && filtros.injetora !== 'Todos' && item.injetora !== filtros.injetora) {
                return false;
            }

            // Filtro de Código do Produto
            const prodItem = item.cod_prod || item.produto;
            if (filtros.cod_prod && filtros.cod_prod !== 'Todos' && prodItem !== filtros.cod_prod) {
                return false;
            }

            // Filtro de Matéria-Prima
            const mpItem = item.mp || item.materia_prima;
            if (filtros.mp && filtros.mp !== 'Todos' && mpItem !== filtros.mp) {
                return false;
            }

            // Filtro de Tipos (Múltiplos selecionados via Checkbox)
            if (filtros.tipo && filtros.tipo.length > 0 && !filtros.tipo.includes(item.tipo)) {
                return false;
            }

            // Filtro de Datas
            if (filtros.dataInicio && item.data && item.data < filtros.dataInicio) return false;
            if (filtros.dataFim && item.data && item.data > filtros.dataFim) return false;

            return true;
        });
    }, [dadosBrutos, filtros]);

    const metricasFiltradas = useDashboardMetrics(dadosFiltrados);

    // --- RELATÓRIO EXECUTIVO EM PDF ---
    const handleGerarPDF = () => {
        if (dadosFiltrados.length === 0) {
            alert('Nenhum dado encontrado com os filtros selecionados.');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        let y = 15;

        // Cabeçalho
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text('RELATÓRIO DE PRODUÇÃO', margin, y);

        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, y);

        // Painel de Parâmetros Aplicados
        y += 10;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 2, 2, 'FD');

        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('PARÂMETROS DE FILTRAGEM:', margin + 4, y);

        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        let filtrosAtivosTexto = [];
        if (filtros.injetora && filtros.injetora !== 'Todos') filtrosAtivosTexto.push(`Injetora: ${filtros.injetora}`);
        if (filtros.cod_prod && filtros.cod_prod !== 'Todos') filtrosAtivosTexto.push(`Prod: ${filtros.cod_prod}`);
        if (filtros.mp && filtros.mp !== 'Todos') filtrosAtivosTexto.push(`MP: ${filtros.mp}`);
        if (filtros.dataInicio) filtrosAtivosTexto.push(`De: ${filtros.dataInicio.split('-').reverse().join('/')}`);
        if (filtros.dataFim) filtrosAtivosTexto.push(`Até: ${filtros.dataFim.split('-').reverse().join('/')}`);

        const textoFiltrosFinal = filtrosAtivosTexto.length > 0
            ? filtrosAtivosTexto.join('  |  ')
            : 'Nenhum filtro restritivo aplicado (Todos os registros)';

        doc.text(textoFiltrosFinal, margin + 4, y);

        // --- CABEÇALHO DA TABELA ---
        y += 14;
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);

        // Redimensionando o espaço para dar mais largura para a Injetora/Descrição
        const colunas = [
            { title: 'Data', x: margin + 2, width: 20 },
            { title: 'Injetora / Descrição', x: margin + 22, width: 62 }, // Espaço expandido
            { title: 'Produto', x: margin + 86, width: 32 },
            { title: 'Conforme', x: margin + 120, width: 18 },
            { title: 'Danificada', x: margin + 140, width: 20 },
            { title: 'Duração', x: margin + 162, width: 20 }
        ];

        colunas.forEach(col => {
            doc.text(col.title, col.x, y + 5.5);
        });

        // --- LINHAS DOS DADOS ---
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        dadosFiltrados.forEach((item, index) => {
            if (y > 275) {
                doc.addPage();
                y = 20;

                doc.setFillColor(30, 41, 59);
                doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(255, 255, 255);
                colunas.forEach(col => doc.text(col.title, col.x, y + 5.5));
                y += 8;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(51, 65, 85);
            }

            if (index % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
            }

            const dataFormatada = item.data ? String(item.data).split('-').reverse().join('/') : '-';
            const injetoraStr = item.injetora ? String(item.injetora) : '-';
            const produtoStr = item.cod_prod || item.produto ? String(item.cod_prod || item.produto) : '-';
            const conformeStr = item.conforme !== undefined ? String(item.conforme) : '0';
            const danificadaStr = item.danificada !== undefined ? String(item.danificada) : '0';
            const duracaoStr = item.duracao ? String(item.duracao) : '-';

            // Usando splitTextToSize para quebrar o texto caso ultrapasse o limite da coluna designada
            const injetoraTextoQuebrado = doc.splitTextToSize(injetoraStr, 58);

            doc.text(dataFormatada, colunas[0].x, y + 4.5);
            doc.text(injetoraTextoQuebrado, colunas[1].x, y + 4.5);
            doc.text(produtoStr, colunas[2].x, y + 4.5);
            doc.text(conformeStr, colunas[3].x, y + 4.5);
            doc.text(danificadaStr, colunas[4].x, y + 4.5);
            doc.text(duracaoStr, colunas[5].x, y + 4.5);

            doc.setDrawColor(241, 245, 249);
            doc.line(margin, y + 7, pageWidth - margin, y + 7);

            y += 7;
        });

        y += 6;
        if (y > 275) { doc.addPage(); y = 20; }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total de Registros Listados: ${dadosFiltrados.length}`, margin, y);

        doc.save(`relatorio_executivo_producao_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // --- EXPORTAR PARA CSV/EXCEL ---
    const handleGerarCSV = () => {
        if (dadosFiltrados.length === 0) {
            alert('Nenhum dado encontrado com os filtros selecionados.');
            return;
        }

        // Definindo o cabeçalho das colunas separado por ponto e vírgula (;)
        const colunasCsv = [
            "ID",
            "Data",
            "Injetora",
            "Produto",
            "Materia Prima",
            "Tipo",
            "Conforme",
            "Danificada",
            "Duracao"
        ];

        // 'sep=;' força o Excel a quebrar as colunas corretamente usando o ponto e vírgula
        let csvContent = "\uFEFF"; // BOM para o Excel reconhecer UTF-8 (acentos)
        csvContent += "sep=;\n";
        csvContent += colunasCsv.join(";") + "\n";

        dadosFiltrados.forEach(item => {
            const linha = [
                item.id || '',
                item.data ? String(item.data).split('-').reverse().join('/') : '',
                `"${String(item.injetora || '').replace(/"/g, '""')}"`,
                `"${String(item.cod_prod || item.produto || '').replace(/"/g, '""')}"`,
                `"${String(item.mp || item.materia_prima || '').replace(/"/g, '""')}"`,
                `"${String(item.tipo || '').replace(/"/g, '""')}"`,
                item.conforme !== undefined ? item.conforme : 0,
                item.danificada !== undefined ? item.danificada : 0,
                `"${String(item.duracao || '').replace(/"/g, '""')}"`
            ];

            csvContent += linha.join(";") + "\n";
        });

        // Criando o Blob e disparando o download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_producao_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="relatorios-loading">
                <p>Carregando dados para os relatórios...</p>
            </div>
        );
    }

    return (
        <div className="relatorios-container">
            <button className="btn-voltar-home" onClick={() => navigate('/')}>
                <FiArrowLeft /> <span>Voltar ao Início</span>
            </button>

            <div className="admin-header-block">
                <h2>Relatórios</h2>
                <p>Utilize os filtros abaixo para refinar os dados e emitir relatórios personalizados.</p>
            </div>

            {/* Integração Direta do seu Componente de Filtros */}
            <div className="card-filtros-wrapper" style={{ marginBottom: '24px' }}>
                <FiltrosDashboard
                    filtros={filtros}
                    setFiltros={setFiltros}
                    rawDados={dadosBrutos}
                    exibirPeriodo={true}
                    exibirInjetora={true}
                    exibirProduto={true}
                    exibirMp={true}
                    exibirTipo={true}
                    tiposDisponiveis={tiposDisponiveis}
                    produtosDisponiveis={produtosDisponiveis}
                    mpsDisponiveis={mpsDisponiveis}
                />
            </div>

            <div className="registros-contador">
                <strong>Registros encontrados para o relatório:</strong> <span>{dadosFiltrados.length}</span> item(ns)
            </div>

            <div className="acoes-botoes">
                <button onClick={handleGerarPDF} className="btn-acao btn-pdf">
                    <FiFileText size={18} /> Baixar Relatório (PDF Executivo)
                </button>

                <button onClick={handleGerarCSV} className="btn-acao btn-csv">
                    <FiDownload size={18} /> Exportar para Excel (CSV)
                </button>
            </div>
        </div>
    );
}

export default TelaRelatorios;