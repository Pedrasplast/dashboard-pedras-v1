import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const headers = {"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info"};
const respond = (status:number,body:unknown) => new Response(JSON.stringify(body),{status,headers});
const txt = (v:unknown) => String(v??"").trim().toUpperCase();
const num = (v:unknown) => {const n=Number(v);return Number.isFinite(n)?n:null;};
const hojeBR=()=>new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return respond(200,{ok:true});
 if(req.method!=="POST")return respond(405,{erro:"Método não permitido"});
 try {
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),role=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),appKey=Deno.env.get("OMIE_APP_KEY"),secret=Deno.env.get("OMIE_APP_SECRET");
  if(!url||!anon||!role||!appKey||!secret)return respond(500,{erro:"Configuração incompleta"});
  if(!token)return respond(401,{erro:"Autenticação necessária"});
  const userClient=createClient(url,anon,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:auth,error:authError}=await userClient.auth.getUser(token);
  if(authError||!auth.user)return respond(401,{erro:"Usuário não autenticado"});
  const db=createClient(url,role);
  const {data:materials,error:e1}=await db.from("materia_prima_materiais").select("id,nome,codigo_omie").eq("ativo",true);
  if(e1)throw e1;
  const cadastrado=(materials||[]).filter(m=>txt(m.codigo_omie));
  const ausentes=(materials||[]).filter(m=>!txt(m.codigo_omie)).map(m=>({material:m.nome,motivo:"Sem código Omie"}));
  if(!cadastrado.length)return respond(422,{erro:"Nenhum código Omie informado",ausentes});
  const codigos=cadastrado.map(m=>txt(m.codigo_omie));
  const {data:refs,error:e2}=await db.from("materia_prima_material_itens_omie").select("codigo_produto,codigo_produto_omie");
  if(e2)throw e2;
  const identificados=cadastrado.map(m=>({...m,omie_id:(refs||[]).find(r=>txt(r.codigo_produto)===txt(m.codigo_omie))?.codigo_produto_omie??null}));
  const semCorrespondencia=identificados.filter(m=>!m.omie_id).map(m=>({material:m.nome,codigo_omie:m.codigo_omie}));
  if(semCorrespondencia.length)return respond(422,{erro:"Existem códigos não identificados",semCorrespondencia,ausentes});
  const omieIds=new Map(identificados.map(m=>[String(m.omie_id),{material:m.nome,codigo_omie:m.codigo_omie}]));
  const requestOmie=async(pagina:number)=>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);
    try{
      const resp=await fetch("https://app.omie.com.br/api/v1/estoque/consulta/",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({call:"ListarPosEstoque",app_key:appKey,app_secret:secret,param:[{nPagina:pagina,nRegPorPagina:100,dDataPosicao:hojeBR(),cExibeTodos:"S",lista_local_estoque:"TODOS"}]})});
      const data=await resp.json();
      if(!resp.ok||data?.faultstring||data?.faultcode)throw Error(data?.faultstring||"Falha na consulta Omie");
      if(!Array.isArray(data?.produtos))throw Error("Resposta sem lista de produtos");
      return data;
    }finally{clearTimeout(timer);}
  };
  const primeira=await requestOmie(1);
  const paginas=num(primeira.nTotPaginas);
  if(paginas===null||paginas<1||paginas>2000||!Number.isInteger(paginas))throw Error("Paginação inválida");
  const todas=[...primeira.produtos];
  for(let i=2;i<=paginas;i++){const dados=await requestOmie(i);todas.push(...dados.produtos);}
  const encontrados=todas.filter(p=>omieIds.has(String(p.nCodProd)));
  const invalidos=encontrados.filter(p=>num(p.nCodProd)===null||num(p.codigo_local_estoque)===null||num(p.fisico)===null);
  if(invalidos.length)throw Error("Posições Omie com campos numéricos ausentes ou inválidos");
  const duplicadas=new Set();
  for(const p of encontrados){const k=`${p.nCodProd}:${p.codigo_local_estoque}`;if(duplicadas.has(k))throw Error("Posição duplicada no Omie");duplicadas.add(k);}
  const resumo=identificados.map(m=>{
   const linhas=encontrados.filter(p=>String(p.nCodProd)===String(m.omie_id));
   return {material:m.nome,codigo_omie:m.codigo_omie,codigo_produto_omie:m.omie_id,posicoes:linhas.length,estoque_fisico_kg:linhas.reduce((t,p)=>t+Number(p.fisico),0)};
  });
  return respond(200,{sucesso:true,modo:"DIAGNOSTICO_SOMENTE_LEITURA",paginas,produtos_retornados:todas.length,posicoes_identificadas:encontrados.length,materiais:resumo,sem_codigo:ausentes,aviso:"Nenhum dado foi gravado. Verifique os locais de estoque antes de ativar sincronização."});
 }catch(e){return respond(500,{sucesso:false,erro:e instanceof Error?e.message:"Erro inesperado"});}
});
