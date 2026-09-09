import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function responder(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function criarSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRole) {
    throw new Error("Credenciais administrativas do Supabase não encontradas.");
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function normalizarEmail(valor: unknown) {
  return String(valor ?? "").trim().toLowerCase();
}

async function buscarUsuarioExistente(
  supabaseAdmin: ReturnType<typeof criarSupabaseAdmin>,
  email: string,
) {
  const porPagina = 200;
  let pagina = 1;

  for (;;) {
    const { data, error } =
      await supabaseAdmin.auth.admin.listUsers({
        page: pagina,
        perPage: porPagina,
      });

    if (error) {
      throw error;
    }

    const usuarios = data?.users || [];

    const encontrado = usuarios.find(
      (usuario) =>
        normalizarEmail(usuario?.email) === email,
    );

    if (encontrado) {
      return encontrado;
    }

    if (usuarios.length < porPagina) {
      return null;
    }

    pagina += 1;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return responder({ ok: true });
  }

  if (req.method !== "POST") {
    return responder({ erro: "Método não permitido." }, 405);
  }

  try {
    const authorization = req.headers.get("Authorization") ?? "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return responder({ erro: "Sessão não informada." }, 401);
    }

    const supabaseAdmin = criarSupabaseAdmin();

    const { data: usuarioLogado, error: erroUsuario } =
      await supabaseAdmin.auth.getUser(token);

    if (erroUsuario || !usuarioLogado?.user) {
      return responder({ erro: "Sessão inválida ou expirada." }, 401);
    }

    const { data: perfil, error: erroPerfil } = await supabaseAdmin
      .from("perfis")
      .select("regra")
      .eq("id", usuarioLogado.user.id)
      .single();

    if (erroPerfil || perfil?.regra !== "admin") {
      return responder(
        { erro: "Somente administradores podem cadastrar usuários." },
        403,
      );
    }

    const corpo = await req.json().catch(() => ({}));
    const email = normalizarEmail(corpo?.email);
    const redirectTo = String(corpo?.redirectTo ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return responder({ erro: "Informe um e-mail válido." }, 400);
    }

    if (!redirectTo) {
      return responder({ erro: "URL de primeiro acesso não informada." }, 400);
    }

    let destino: URL;

    try {
      destino = new URL(redirectTo);
    } catch {
      return responder({ erro: "URL de primeiro acesso inválida." }, 400);
    }

    const ehLocal =
      destino.hostname === "localhost" ||
      destino.hostname === "127.0.0.1";

    if (destino.protocol !== "https:" && !ehLocal) {
      return responder(
        { erro: "A URL de primeiro acesso precisa usar HTTPS." },
        400,
      );
    }

    const origemRequisicao = String(
      req.headers.get("Origin") || "",
    ).trim();

    if (origemRequisicao) {
      try {
        const origem = new URL(origemRequisicao);

        if (origem.origin !== destino.origin) {
          return responder(
            { erro: "A URL de primeiro acesso não pertence à aplicação atual." },
            400,
          );
        }
      } catch {
        return responder({ erro: "Origem da aplicação inválida." }, 400);
      }
    }

    const usuarioExistente = await buscarUsuarioExistente(
      supabaseAdmin,
      email,
    );

    if (usuarioExistente) {
      return responder(
        {
          erro:
            "Este e-mail já pertence a um usuário cadastrado. Nenhuma alteração foi realizada.",
        },
        409,
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
        error.message || "Não foi possível cadastrar o usuário.";

      if (/already|registered|exists|exist/i.test(mensagem)) {
        return responder(
          {
            erro:
              "Este e-mail já pertence a um usuário cadastrado. Nenhuma alteração foi realizada.",
          },
          409,
        );
      }

      throw error;
    }

    const link = data?.properties?.action_link;
    const novoUsuario = data?.user;

    if (!link || !novoUsuario?.id) {
      throw new Error("O Supabase não retornou o link de primeiro acesso.");
    }

    let tokenHash = "";

    try {
      tokenHash = new URL(link).searchParams.get("token") ?? "";
    } catch {
      tokenHash = "";
    }

    if (!tokenHash) {
      throw new Error("O Supabase não retornou o token do primeiro acesso.");
    }

    const linkCurto = new URL(destino.toString());
    linkCurto.search = "";
    linkCurto.hash = "";
    linkCurto.searchParams.set("t", tokenHash);

    return responder({
      sucesso: true,
      usuario: {
        id: novoUsuario.id,
        email: novoUsuario.email,
      },
      link_primeiro_acesso: linkCurto.toString(),
    });
  } catch (erro) {
    console.error("Erro ao cadastrar usuário:", erro);

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
