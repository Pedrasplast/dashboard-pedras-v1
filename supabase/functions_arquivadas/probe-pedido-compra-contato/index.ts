
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8"}});

function safe(value:any):any{
  if(Array.isArray(value)) return value.map(safe);
  if(!value||typeof value!=="object") return value;
  const out:any={};
  for(const [k,v] of Object.entries(value)){
    const x=k.toLowerCase();
    if(
      x.includes("contat") ||
      x.includes("adicion") ||
      x.includes("projeto") ||
      x.includes("contrat") ||
      x.includes("observ") ||
      x.includes("parcela") ||
      x.includes("pedido") ||
      x.includes("fornecedor") ||
      x.includes("comprador") ||
      x.includes("categoria")
    ){
      out[k]=safe(v);
    }
  }
  return out;
}

Deno.serve(async(req)=>{
  if(req.method!=="POST") return json({erro:"metodo"},405);

  const url=Deno.env.get("SUPABASE_URL");
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const key=Deno.env.get("OMIE_APP_KEY");
  const secret=Deno.env.get("OMIE_APP_SECRET");
  if(!url||!service||!key||!secret) return json({erro:"config"},500);

  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get("x-cron-secret");
  if(!token) return json({erro:"nao_autorizado"},401);
  const check=await db.rpc("validar_token_cron_pedidos_compra",{p_token:token});
  if(check.error||check.data!==true) return json({erro:"nao_autorizado"},401);

  const response=await fetch("https://app.omie.com.br/api/v1/produtos/pedidocompra/",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({
      call:"ConsultarPedCompra",
      app_key:key,
      app_secret:secret,
      param:[{nCodPed:9225177248}]
    })
  });

  const data=await response.json();

  return json({
    pedido:"14552",
    http_status:response.status,
    ok:response.ok&&!data?.faultstring&&!data?.faultcode,
    fault:data?.faultstring??data?.faultcode??null,
    top_level_keys:data&&typeof data==="object"?Object.keys(data):[],
    campos_relevantes:safe(data)
  }, response.ok?200:response.status);
});
