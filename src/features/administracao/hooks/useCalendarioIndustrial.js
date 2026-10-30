import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { obterAnoAtual } from "@/shared/lib/datas";

import { calcularIndicadores, mensagemErro } from "../calendarioIndustrial.regras";
import {
  listarCalendarioIndustrialAno,
  sincronizarFeriadosNacionais,
} from "../calendarioIndustrialAdminService";

/**
 * Dados do calendário do ano: carga, sincronização de feriados (automática e manual),
 * exceções, indicadores e a mensagem de retorno da tela.
 */
export default function useCalendarioIndustrial() {
  const [ano, setAno] = useState(obterAnoAtual());
  const [calendario, setCalendario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  const sincronizacaoAutomaticaRef = useRef(new Set());

  const mapaCalendario = useMemo(
    () => new Map(calendario.map((item) => [String(item.data), item])),
    [calendario],
  );

  const excecoes = useMemo(
    () =>
      calendario
        .filter((item) => item.origem === "EXCECAO")
        .sort((a, b) => String(a.data).localeCompare(String(b.data))),
    [calendario],
  );

  const indicadores = useMemo(() => calcularIndicadores(excecoes), [excecoes]);

  const carregarCalendario = useCallback(async () => {
    try {
      setLoading(true);

      const dados = await listarCalendarioIndustrialAno(ano);
      setCalendario(dados);
    } catch (error) {
      console.error("Erro ao carregar calendário industrial:", error);
      setMensagem({
        tipo: "erro",
        texto: mensagemErro(error, "Não foi possível carregar o calendário industrial."),
      });
    } finally {
      setLoading(false);
    }
  }, [ano]);

  useEffect(() => {
    void carregarCalendario();
  }, [carregarCalendario]);

  useEffect(() => {
    const anoAtual = obterAnoAtual();

    if (
      loading ||
      calendario.length === 0 ||
      ano < anoAtual ||
      ano > anoAtual + 1 ||
      sincronizacaoAutomaticaRef.current.has(ano)
    ) {
      return undefined;
    }

    sincronizacaoAutomaticaRef.current.add(ano);

    const chave = `pedrasplast:feriados-industriais:${ano}`;
    const ultimaSincronizacao = Number(window.localStorage.getItem(chave) || 0);
    const seteDias = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - ultimaSincronizacao < seteDias) {
      return undefined;
    }

    let cancelado = false;

    const executar = async () => {
      try {
        setSincronizando(true);

        await sincronizarFeriadosNacionais({
          ano,
          calendarioAtual: calendario,
        });

        if (cancelado) {
          return;
        }

        window.localStorage.setItem(chave, String(Date.now()));
        await carregarCalendario();
      } catch (error) {
        console.warn("Sincronização automática de feriados não concluída:", error);
      } finally {
        if (!cancelado) {
          setSincronizando(false);
        }
      }
    };

    void executar();

    return () => {
      cancelado = true;
    };
  }, [ano, calendario, loading, carregarCalendario]);

  useEffect(() => {
    if (!mensagem.texto) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMensagem({ tipo: "", texto: "" });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [mensagem]);

  const sincronizarFeriados = useCallback(async () => {
    try {
      setSincronizando(true);

      const resultado = await sincronizarFeriadosNacionais({
        ano,
        calendarioAtual: calendario,
      });

      await carregarCalendario();

      setMensagem({
        tipo: "sucesso",
        texto: `Feriados sincronizados: ${resultado.inseridos} novo(s), ${resultado.atualizados} atualizado(s) e ${resultado.preservados} decisão(ões) manual(is) preservada(s).`,
      });
    } catch (error) {
      console.error("Erro ao sincronizar feriados nacionais:", error);
      setMensagem({
        tipo: "erro",
        texto: mensagemErro(error, "Não foi possível sincronizar os feriados nacionais."),
      });
    } finally {
      setSincronizando(false);
    }
  }, [ano, calendario, carregarCalendario]);

  return {
    ano,
    setAno,
    loading,
    sincronizando,
    mensagem,
    setMensagem,
    mapaCalendario,
    excecoes,
    indicadores,
    carregarCalendario,
    sincronizarFeriados,
  };
}
