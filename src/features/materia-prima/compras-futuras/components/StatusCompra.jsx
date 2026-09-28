import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { STATUS, normalizarStatus, rotuloStatus } from "../utils/comprasFuturasUtils";

const ICONES = {
  [STATUS.PREVISTA]: Clock3,
  [STATUS.CONFIRMADA]: Clock3,
  [STATUS.RECEBIDA]: CheckCircle2,
  [STATUS.CANCELADA]: XCircle,
};

export default function StatusCompra({ status }) {
  const statusNormalizado = normalizarStatus(status);
  const Icone = ICONES[statusNormalizado];

  return (
    <span className={`compras-futuras-status ${statusNormalizado.toLowerCase()}`}>
      <Icone size={13} />
      {rotuloStatus(statusNormalizado)}
    </span>
  );
}
