import ProdutosPage from "./produtos/ProdutosPage";
import FornecedoresPage from "./fornecedores/FornecedoresPage";
import MateriaisPage from "./materiais/MateriaisPage";
import "./CadastrosPage.css";

/** Preserva a interface das rotas existentes: <CadastrosPage tipo="..." />. */
export default function CadastrosPage({ tipo = "produtos" }) {
  if (tipo === "fornecedores") return <FornecedoresPage />;
  if (tipo === "materiais") return <MateriaisPage />;
  return <ProdutosPage />;
}
