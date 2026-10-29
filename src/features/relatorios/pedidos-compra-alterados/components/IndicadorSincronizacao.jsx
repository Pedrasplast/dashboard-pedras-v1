import { FiAlertTriangle, FiCheckCircle, FiClock } from "react-icons/fi";

import { descreverSincronizacao } from "../pedidosCompraAlterados.regras";
import { formatarDataHora } from "@/shared/lib/datas";

/** Selo no cabeçalho com a última sincronização automática (ou o erro). */
export default function IndicadorSincronizacao({ dados, carregando, erro }) {
  const { falha, concluida, andamento, instante, cor, fundo, borda, mensagem } =
    descreverSincronizacao(dados, erro);

  return (
    <div
      role={falha ? "alert" : "status"}
      aria-live={falha ? "assertive" : "polite"}
      title={falha ? mensagem : "Última sincronização automática"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        marginLeft: "auto",
        padding: "9px 12px",
        minWidth: 0,
        maxWidth: "100%",
        borderRadius: 11,
        border: `1px solid ${borda}`,
        background: fundo,
      }}
    >
      <span
        style={{
          display: "flex",
          color: cor,
          flexShrink: 0,
        }}
      >
        {falha ? (
          <FiAlertTriangle size={17} />
        ) : concluida ? (
          <FiCheckCircle size={17} />
        ) : (
          <FiClock size={17} />
        )}
      </span>

      <span
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
        }}
      >
        <strong
          style={{
            fontSize: 11,
            color: cor,
          }}
        >
          {falha
            ? "Erro na atualização"
            : andamento
              ? "Sincronização em andamento"
              : "Última sincronização"}
        </strong>

        <span
          style={{
            fontSize: 12,
            color: "#334155",
            fontWeight: 650,
          }}
        >
          {carregando && !dados ? "Consultando..." : formatarDataHora(instante)}
        </span>

        {falha && (
          <span
            style={{
              fontSize: 11,
              color: cor,
              overflowWrap: "anywhere",
              maxWidth: 340,
            }}
          >
            {mensagem}
          </span>
        )}
      </span>
    </div>
  );
}
