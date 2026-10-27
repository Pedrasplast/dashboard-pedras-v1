/** "AAAA-MM-DD" → "DD/MM/AAAA" no texto dos filtros; vazio vira "Sem limite". */
export function formatarFiltroData(valor) {
  if (!valor) {
    return "Sem limite";
  }

  return String(valor).split("-").reverse().join("/");
}
