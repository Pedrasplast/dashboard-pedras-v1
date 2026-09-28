import { AlertTriangle, Search, ShoppingCart } from "lucide-react";

/* Mensagens de carregando / erro / sem compras / sem resultado. */

export function EstadoCarregando() {
  return (
    <div className="compras-futuras-estado">
      <span className="compras-futuras-loading" />
      <strong>Carregando compras</strong>
    </div>
  );
}

export function EstadoErro({ mensagem }) {
  return (
    <div className="compras-futuras-estado compras-futuras-erro">
      <AlertTriangle size={30} />
      <strong>Erro ao carregar compras</strong>
      <p>{mensagem}</p>
    </div>
  );
}

export function EstadoSemCompras() {
  return (
    <div className="compras-futuras-estado">
      <ShoppingCart size={34} />
      <strong>Nenhuma compra cadastrada</strong>
      <p>Cadastre as compras de matéria-prima previstas para recebimento.</p>
    </div>
  );
}

export function EstadoSemResultado() {
  return (
    <div className="compras-futuras-estado">
      <Search size={27} />
      <strong>Nenhuma compra encontrada</strong>
      <p>Altere os filtros para visualizar outras compras.</p>
    </div>
  );
}
