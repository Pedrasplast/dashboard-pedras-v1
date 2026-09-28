import { AlertTriangle, PackageCheck } from "lucide-react";

/* Mensagens de carregando / erro / vazio / sem resultado. */

export function EstadoCarregando() {
  return (
    <div className="entradas-pp-estado">
      <span className="entradas-pp-loading" />
      <strong>Carregando recebimentos</strong>
    </div>
  );
}

export function EstadoErro({ mensagem }) {
  return (
    <div className="entradas-pp-estado entradas-pp-erro">
      <AlertTriangle size={30} />
      <strong>Erro ao carregar entradas</strong>
      <p>{mensagem}</p>
    </div>
  );
}

export function EstadoVazio({ titulo, texto }) {
  return (
    <div className="entradas-pp-estado">
      <PackageCheck size={34} />
      <strong>{titulo}</strong>
      <p>{texto}</p>
    </div>
  );
}
