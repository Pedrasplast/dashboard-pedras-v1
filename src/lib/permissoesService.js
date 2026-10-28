import { supabase } from "./supabaseClient";

/* =========================================================
   PERMISSÕES DO USUÁRIO

   Devolve as chaves das telas e dos relatórios liberados
   para o usuário (operador). Administradores não passam por
   aqui: têm acesso total.
========================================================= */

function chavesPermitidas(itens, permissoes, campoId, normalizarChave = (chave) => chave) {
  const chavePorId = new Map();

  for (const item of itens || []) {
    chavePorId.set(String(item.id), normalizarChave(item.chave));
  }

  const chaves = new Set();

  for (const permissao of permissoes || []) {
    if (!permissao.permitido) {
      continue;
    }

    const chave = chavePorId.get(String(permissao[campoId]));

    if (chave) {
      chaves.add(chave);
    }
  }

  return chaves;
}

export async function buscarPermissoesUsuario(usuarioId) {
  const [respostaTelas, respostaPermissoesTelas, respostaRelatorios, respostaPermissoesRelatorios] =
    await Promise.all([
      supabase.from("telas_sistema").select("id, chave, ativo").eq("ativo", true),

      supabase.from("usuario_permissoes").select("tela_id, permitido").eq("usuario_id", usuarioId),

      supabase.from("relatorios_sistema").select("id, chave, ativo").eq("ativo", true),

      supabase
        .from("usuario_relatorio_permissoes")
        .select("relatorio_id, permitido")
        .eq("usuario_id", usuarioId),
    ]);

  for (const resposta of [
    respostaTelas,
    respostaPermissoesTelas,
    respostaRelatorios,
    respostaPermissoesRelatorios,
  ]) {
    if (resposta.error) {
      throw resposta.error;
    }
  }

  return {
    telas: chavesPermitidas(respostaTelas.data, respostaPermissoesTelas.data, "tela_id"),

    // A Central de Relatórios sempre comparou as chaves sem espaços nas pontas.
    relatorios: chavesPermitidas(
      respostaRelatorios.data,
      respostaPermissoesRelatorios.data,
      "relatorio_id",
      (chave) => String(chave || "").trim(),
    ),
  };
}
