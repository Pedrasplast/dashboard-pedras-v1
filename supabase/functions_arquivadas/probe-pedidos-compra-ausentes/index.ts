
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function text(v: unknown) {
  return String(v ?? "").trim();
}

async function consultarPedido(
  codigo: number,
  appKey: string,
  appSecret: string,
) {
  const response = await fetch(
    "https://app.omie.com.br/api/v1/produtos/pedidocompra/",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call: "ConsultarPedCompra",
        app_key: appKey,
        app_secret: appSecret,
        param: [{ nCodPed: codigo }],
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || data?.faultstring || data?.faultcode) {
    return {
      ok: false,
      erro: text(data?.faultstring || data?.message || data?.faultcode || response.status),
    };
  }

  const cab = data?.cabecalho_consulta ?? {};

  return {
    ok: true,
    numero: text(cab?.cNumero),
    etapa: text(cab?.cEtapa),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ erro: "Método não permitido" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appKey = Deno.env.get("OMIE_APP_KEY");
  const appSecret = Deno.env.get("OMIE_APP_SECRET");

  if (!url || !service || !appKey || !appSecret) {
    return json({ erro: "Configuração ausente" }, 500);
  }

  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const q = await db
    .from("pedidos_compra_omie")
    .select("cod_ped_compra,snapshot,ausencias_varreduras")
    .gt("ausencias_varreduras", 0)
    .order("cod_ped_compra", { ascending: true })
    .limit(50);

  if (q.error) return json({ erro: q.error.message }, 500);

  const resultados = [];

  for (const row of q.data ?? []) {
    const codigo = Number(row.cod_ped_compra);
    const numeroLocal = text(row?.snapshot?.numero);
    const consulta = await consultarPedido(codigo, appKey, appSecret);

    resultados.push({
      cod_ped_compra: codigo,
      numero_local: numeroLocal,
      ausencias_varreduras: row.ausencias_varreduras,
      ...consulta,
    });

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return json({
    sucesso: true,
    total: resultados.length,
    resultados,
  });
});
