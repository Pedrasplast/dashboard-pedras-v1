import { AlertTriangle } from "lucide-react";

import Spinner from "./Spinner";

import "./EstadoTela.css";

/**
 * Mensagem que ocupa o lugar do conteúdo enquanto ele não pode
 * ser mostrado: carregando, erro, nada cadastrado ou nenhum
 * resultado para os filtros.
 *
 *   <EstadoTela tipo="carregando" titulo="Carregando compras" />
 *   <EstadoTela tipo="erro" titulo="Erro ao carregar compras" texto={mensagem} />
 *   <EstadoTela icone={<Search size={27} />} titulo="Nenhuma compra encontrada"
 *               texto="Altere os filtros para visualizar outras compras." />
 *
 * `tipo`: "carregando" (mostra o Spinner), "erro" (ícone de alerta
 * e título em vermelho) ou "vazio" (padrão; usa o `icone` dado).
 */
export default function EstadoTela({ tipo = "vazio", icone, titulo, texto, children }) {
  const iconePadrao =
    tipo === "carregando" ? <Spinner /> : tipo === "erro" ? <AlertTriangle size={30} /> : null;

  return (
    <div
      className={`estado-tela${tipo === "erro" ? " estado-tela--erro" : ""}`}
      role={tipo === "erro" ? "alert" : tipo === "carregando" ? "status" : undefined}
    >
      {icone ?? iconePadrao}

      {titulo && <strong>{titulo}</strong>}

      {texto && <p>{texto}</p>}

      {children}
    </div>
  );
}
