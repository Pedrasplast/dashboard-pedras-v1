import { supabase } from "@/lib/supabaseClient";

function garantirSemErro(resposta, mensagemPadrao) {
  if (resposta?.error) {
    throw new Error(resposta.error.message || mensagemPadrao);
  }

  return resposta?.data;
}

async function obterMensagemErroFunction(error) {
  if (!error?.context) {
    return "";
  }

  try {
    const resposta = await error.context.json();

    return resposta?.erro || "";
  } catch {
    return "";
  }
}

export async function buscarDadosGerenciamento() {
  const [
    respostaUsuarios,
    respostaTelas,
    respostaPermissoes,
    respostaRelatorios,
    respostaPermissoesRelatorios,
  ] = await Promise.all([
    supabase.from("perfis").select("id, email, regra").order("email", {
      ascending: true,
    }),

    supabase
      .from("telas_sistema")
      .select("id, chave, nome, rota, ordem, ativo")
      .eq("ativo", true)
      .order("ordem", {
        ascending: true,
      }),

    supabase.from("usuario_permissoes").select("usuario_id, tela_id, permitido"),

    supabase
      .from("relatorios_sistema")
      .select("id, chave, nome, categoria, ordem, ativo")
      .eq("ativo", true)
      .order("ordem", {
        ascending: true,
      }),

    supabase.from("usuario_relatorio_permissoes").select("usuario_id, relatorio_id, permitido"),
  ]);

  return {
    usuarios: garantirSemErro(respostaUsuarios, "Erro ao buscar usuários.") || [],

    telas: garantirSemErro(respostaTelas, "Erro ao buscar telas.") || [],

    permissoes: garantirSemErro(respostaPermissoes, "Erro ao buscar permissões.") || [],

    relatorios: garantirSemErro(respostaRelatorios, "Erro ao buscar relatórios.") || [],

    permissoesRelatorios:
      garantirSemErro(respostaPermissoesRelatorios, "Erro ao buscar permissões de relatórios.") ||
      [],
  };
}

export async function cadastrarUsuario({ email, redirectTo }) {
  const { data, error } = await supabase.functions.invoke("criar-usuario", {
    body: {
      email,
      redirectTo,
    },
  });

  if (error) {
    const mensagemDetalhada = await obterMensagemErroFunction(error);

    throw new Error(mensagemDetalhada || error.message || "Não foi possível cadastrar o usuário.");
  }

  if (!data?.sucesso) {
    throw new Error(data?.erro || "Não foi possível cadastrar o usuário.");
  }

  if (!data?.link_primeiro_acesso) {
    throw new Error("O usuário foi criado, mas o link de primeiro acesso não foi retornado.");
  }

  return data;
}

export async function atualizarRegraUsuario(usuarioId, novaRegra) {
  const resposta = await supabase
    .from("perfis")
    .update({
      regra: novaRegra,
    })
    .eq("id", usuarioId);

  garantirSemErro(resposta, "Erro ao atualizar nível de acesso.");
}

export async function salvarPermissoesUsuario({
  usuarioId,
  telas,
  relatorios,
  permissoesTelas,
  permissoesRelatorios,
}) {
  const updatedAt = new Date().toISOString();

  const registrosTelas = telas.map((tela) => ({
    usuario_id: usuarioId,

    tela_id: tela.id,

    permitido: Boolean(permissoesTelas[String(tela.id)]),

    updated_at: updatedAt,
  }));

  const registrosRelatorios = relatorios.map((relatorio) => ({
    usuario_id: usuarioId,

    relatorio_id: relatorio.id,

    permitido: Boolean(permissoesRelatorios[String(relatorio.id)]),

    updated_at: updatedAt,
  }));

  const operacoes = [];

  if (registrosTelas.length > 0) {
    operacoes.push(
      supabase.from("usuario_permissoes").upsert(registrosTelas, {
        onConflict: "usuario_id,tela_id",
      }),
    );
  }

  if (registrosRelatorios.length > 0) {
    operacoes.push(
      supabase.from("usuario_relatorio_permissoes").upsert(registrosRelatorios, {
        onConflict: "usuario_id,relatorio_id",
      }),
    );
  }

  const respostas = await Promise.all(operacoes);

  for (const resposta of respostas) {
    garantirSemErro(resposta, "Erro ao salvar permissões.");
  }
}

export async function excluirUsuarioCompleto(usuarioId) {
  const resposta = await supabase.rpc("apagar_usuario_completo", {
    usuario_id: usuarioId,
  });

  garantirSemErro(resposta, "Erro ao excluir usuário.");
}
