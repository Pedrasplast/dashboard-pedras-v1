
import { createClient } from "npm:@supabase/supabase-js@2";
const reply=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
  if(req.method!=="POST") return reply({erro:"Método não permitido"},405);
  const url=Deno.env.get("SUPABASE_URL"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service) return reply({erro:"Configuração ausente"},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get("x-cron-secret");
  if(!token) return reply({erro:"Não autorizado"},401);
  const ok=await db.rpc("validar_token_cron_pedidos_compra",{p_token:token});
  if(ok.error||ok.data!==true) return reply({erro:"Não autorizado"},401);
  const q=await db.from("pedidos_compra_omie").select("cod_ped_compra").eq("ausencias_varreduras",1).order("cod_ped_compra");
  if(q.error) return reply({erro:q.error.message},500);
  const ids=(q.data??[]).map((r:any)=>r.cod_ped_compra);
  if(ids.length!==80) return reply({erro:"Quantidade de ausentes mudou; arquivamento cancelado por segurança.",quantidade:ids.length},409);
  let arquivados=0;
  for(const id of ids){
    const r=await db.rpc("arquivar_remover_pedido_compra_fora_aprovacao",{p_codigo:id});
    if(r.error) return reply({erro:r.error.message,arquivados_antes_do_erro:arquivados,codigo:id},500);
    arquivados++;
  }
  return reply({sucesso:true,arquivados});
});
