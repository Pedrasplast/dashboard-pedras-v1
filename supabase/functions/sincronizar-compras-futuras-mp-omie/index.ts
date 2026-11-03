import {createClient} from 'npm:@supabase/supabase-js@2';
const answer=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json'}});
const obj=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const str=(v:any)=>String(v??'').trim();
const n=(v:any)=>{const x=Number(v??0);if(!Number.isFinite(x))throw Error('Número inválido recebido do Omie');return x;};
const id=(v:any)=>{const x=Number(v);if(!Number.isSafeInteger(x)||x<=0)throw Error('Identificador de pedido ou item inválido');return x;};
const array=(v:any,k:string,field:string)=>{if(!Array.isArray(v))throw Error('Bloco Omie ausente: '+k);return v.map(obj).sort((a:any,b:any)=>str(a[field]??JSON.stringify(a)).localeCompare(str(b[field]??JSON.stringify(b))));};
function normalize(input:any){const r=obj(input),c=obj(r.cabecalho_consulta),code=id(c.nCodPed);if(!str(c.cNumero)||!Array.isArray(r.produtos_consulta))throw Error('Pedido '+code+' incompleto');const seen=new Set<number>();const itens=r.produtos_consulta.map((raw:any)=>{const i=obj(raw),iid=id(i.nCodItem);if(seen.has(iid))throw Error('Item duplicado '+iid);seen.add(iid);return {codigo_item:iid,codigo_produto:i.nCodProd==null?null:id(i.nCodProd),codigo_comercial:str(i.cProduto),descricao:str(i.cDescricao),unidade:str(i.cUnidade),quantidade:n(i.nQtde),quantidade_recebida:n(i.nQtdeRec),preco_unitario:n(i.nValUnit),valor_total:n(i.nValTot),desconto:n(i.nDesconto),despesas:n(i.nDespesas),frete_item:n(i.nFrete),seguro:n(i.nSeguro),categoria:str(i.cCodCateg),observacao:str(i.cObs),local_estoque:str(i.codigo_local_estoque)};}).sort((a:any,b:any)=>a.codigo_item-b.codigo_item);const f=obj(r.frete_consulta),frete:Record<string,unknown>={};for(const k of ['cTpFrete','nCodTransp','nValFrete','nValOutras','nValSeguro','nPesoBruto','nPesoLiq','nQtdVol'])frete[k]=f[k]??null;return {codigo:code,snapshot:{codigo:code,numero:str(c.cNumero),codigo_integracao:str(c.cCodIntPed),fornecedor:str(c.nCodFor),contato:str(c.cContato),comprador:str(c.nCodCompr),centro_custo:str(c.nCodCC),categoria:str(c.cCodCateg),etapa:str(c.cEtapa),data_previsao:str(c.dDtPrevisao),data_inclusao:str(c.dIncData),hora_inclusao:str(c.cIncHora),condicao_pagamento:str(c.cCodParc),parcelas_quantidade:n(c.nQtdeParc),observacoes:str(c.cObs),observacoes_internas:str(c.cObsInt),contrato:str(c.cContrato),projeto:n(c.nCodProj),frete,parcelas:array(r.parcelas_consulta,'parcelas','nParcela'),departamentos:array(r.departamentos_consulta,'departamentos','cCodDepto'),caracteristicas:array(r.caracteristicas_consulta,'caracteristicas','cNome'),itens}};}

const CODIGOS=new Set(['PRD11295','867']);
async function paginaOmie(page:number,key:string,secret:string){
 const filtros={nPagina:page,nRegsPorPagina:50,lApenasImportadoApi:'N',
 lExibirPedidosPendentes:'S',lExibirPedidosFaturados:'N',lExibirPedidosRecebidos:'N',
 lExibirPedidosCancelados:'N',lExibirPedidosEncerrados:'N',
 lExibirPedidosRecParciais:'N',lExibirPedidosFatParciais:'N'};
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);
 try{
 const res=await fetch('https://app.omie.com.br/api/v1/produtos/pedidocompra/',{method:'POST',
 headers:{'Content-Type':'application/json'},signal:ctl.signal,
 body:JSON.stringify({call:'PesquisarPedCompra',app_key:key,app_secret:secret,param:[filtros]})});
 const data=await res.json();
 if(!res.ok||data.faultstring||data.faultcode)throw Error(str(data.faultstring||data.faultcode||res.status));
 if(!Array.isArray(data.pedidos_pesquisa)||Number(data.nPagina)!==page)throw Error('Pagina Omie incompleta');
 return data;
 }finally{clearTimeout(timer);}
}
Deno.serve(async req=>{
 if(req.method!=='POST')return answer({sucesso:false,erro:'Metodo nao permitido'},405);
 const url=Deno.env.get('SUPABASE_URL'),role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const key=Deno.env.get('OMIE_APP_KEY'),secret=Deno.env.get('OMIE_APP_SECRET');
 if(!url||!role||!key||!secret)return answer({sucesso:false,erro:'Configuracao ausente'},500);
 const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}});
 const auth=await db.rpc('validar_token_cron_pedidos_compra',{p_token:req.headers.get('x-cron-secret')||''});
 if(auth.error||auth.data!==true)return answer({sucesso:false,erro:'Nao autorizado'},401);
 let input:any={};try{input=await req.json();}catch{}
 const dryRun=input.dry_run===true;
 try{
  const first=await paginaOmie(1,key!,secret!);
  const pages=Number(first.nTotalPaginas||0);
  if(pages<1||pages>20)throw Error('Total de paginas de pendentes fora do limite de seguranca: '+pages);
  const records:any[]=[];const codes=new Set<number>();
  for(let page=1;page<=pages;page++){
   const d=page===1?first:await paginaOmie(page,key!,secret!);
   if(Number(d.nTotalPaginas)!==pages)throw Error('Paginacao Omie mudou durante varredura; nenhum registro confirmado');
   for(const x of d.pedidos_pesquisa){
    const r=normalize(x);
    if(r.snapshot.etapa!=='15')continue;
    if(!r.snapshot.itens.some((it:any)=>CODIGOS.has(str(it.codigo_comercial).toUpperCase())&&it.categoria==='2.01.03'&&Math.max(0,it.quantidade-it.quantidade_recebida)>0))continue;
    if(codes.has(r.codigo))throw Error('Pedido repetido em diferentes paginas: '+r.codigo);
    codes.add(r.codigo);records.push(r);
   }
  }
  if(!dryRun){
    for(let i=0;i<records.length;i+=30){
      const saved=await db.rpc('registrar_lote_pedidos_compra_omie',{p_pedidos:records.slice(i,i+30)});
      if(saved.error)throw saved.error;
    }
    const confirmed=await db.rpc('atualizar_compras_mp_pendentes_confirmados',{p_codigos:[...codes]});
    if(confirmed.error)throw confirmed.error;
  }
  return answer({sucesso:true,modo:dryRun?'simulacao':'confirmacao',paginas:pages,pedidos_confirmados:codes.size,codigos_materiais:[...CODIGOS],numeros:records.map(r=>r.snapshot.numero)});
 }catch(e){return answer({sucesso:false,erro:e instanceof Error?e.message:String(e)},500);}
});
