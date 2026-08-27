import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function responder(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

function criarSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRole) {
    throw new Error(
      "Credenciais administrativas do Supabase não encontradas.",
    );
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return responder({ ok: true });
  }

  if (req.method !== "POST") {
    return responder(
      { erro: "Método não permitido." },
      405,
    );
  }

  try {
    const authorization =
      req.headers.get("Authorization") ?? "";

    const token = authorization
      .replace(/^Bearer\s+/i, "")
      .trim();

    if (!token) {
      return responder(
        { erro: "Sessão não informada." },
        401,
      );
    }

    const supabaseAdmin = criarSupabaseAdmin();

    const {
      data: usuarioLogado,
      error: erroUsuario,
    } = await supabaseAdmin.auth.getUser(token);

    if (erroUsuario || !usuarioLogado?.user) {
      return responder(
        { erro: "Sessão inválida ou expirada." },
        401,
      );
    }

    const { data: perfil, error: erroPerfil } =
      await supabaseAdmin
        .from("perfis")
        .select("regra")
        .eq("id", usuarioLogado.user.id)
        .single();

    if (erroPerfil || perfil?.regra !== "admin") {
      return responder(
        {
          erro:
            "Somente administradores podem cadastrar usuários.",
        },
        403,
      );
    }

    const corpo = await req.json().catch(() => ({}));

    const email = String(corpo?.email ?? "")
      .trim()
      .toLowerCase();

    const redirectTo = String(
      corpo?.redirectTo ?? "",
    ).trim();

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return responder(
        { erro: "Informe um e-mail válido." },
        400,
      );
    }

    if (!redirectTo) {
      return responder(
        {
          erro:
            "URL de primeiro acesso não informada.",
        },
        400,
      );
    }

    let destino: URL;

    try {
      destino = new URL(redirectTo);
    } catch {
      return responder(
        {
          erro:
            "URL de primeiro acesso inválida.",
        },
        400,
      );
    }

    if (
      !(
        destino.protocol === "https:" ||
        destino.hostname === "localhost" ||
        destino.hostname === "127.0.0.1"
      )
    ) {
      return responder(
        {
          erro:
            "A URL de primeiro acesso precisa usar HTTPS.",
        },
        400,
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo: destino.toString(),
        },
      });

    if (error) {
      const mensagem =
        error.message ||
        "Não foi possível cadastrar o usuário.";

      if (
        /already|registered|exists|exist/i.test(
          mensagem,
        )
      ) {
        return responder(
          {
            erro:
              "Já existe um usuário cadastrado com este e-mail.",
          },
          409,
        );
      }

      throw error;
    }

    const link = data?.properties?.action_link;
    const novoUsuario = data?.user;

    if (!link || !novoUsuario?.id) {
      throw new Error(
        "O Supabase não retornou o link de primeiro acesso.",
      );
    }

    return responder({
      sucesso: true,
      usuario: {
        id: novoUsuario.id,
        email: novoUsuario.email,
      },
      link_primeiro_acesso: link,
    });
  } catch (erro) {
    console.error(
      "Erro ao cadastrar usuário:",
      erro,
    );

    return responder(
      {
        erro:
          erro instanceof Error
            ? erro.message
            : "Erro inesperado ao cadastrar usuário.",
      },
      500,
    );
  }
});
