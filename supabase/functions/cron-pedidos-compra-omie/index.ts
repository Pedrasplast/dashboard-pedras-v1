import {createClient} from 'npm:@supabase/supabase-js@2';
const answer=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json'}});
const obj=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const str=(v:any)=>String(v??'').trim();
const n=(v:any)=>{const x=Number(v??0);if(!Number.isFinite(x))throw Error('Número inválido recebido do Omie');return x;};
const id=(v:any)=>{const x=Number(v);if(!Number.isSafeInteger(x)||x<=0)throw Error('Identificador de pedido ou item inválido');return x;};
const array=(v:any,k:string,field:string)=>{if(!Array.isArray(v))throw Error('Bloco Omie ausente: '+k);return v.map(obj).sort((a:any,b:any)=>str(a[field]??JSON.stringify(a)).localeCompare(str(b[field]??JSON.stringify(b))));};
function normalize(input:any){const r=obj(input),c=obj(r.cabecalho_consulta),code=id(c.nCodPed);if(!str(c.cNumero)||!Array.isArray(r.produtos_consulta))throw Error('Pedido '+code+' incompleto');const seen=new Set<number>();const itens=r.produtos_consulta.map((raw:any)=>{const i=obj(raw),iid=id(i.nCodItem);if(seen.has(iid))throw Error('Item duplicado '+iid);seen.add(iid);return {codigo_item:iid,codigo_produto:i.nCodProd==null?null:id(i.nCodProd),codigo_comercial:str(i.cProduto),descricao:str(i.cDescricao),unidade:str(i.cUnidade),quantidade:n(i.nQtde),quantidade_recebida:n(i.nQtdeRec),preco_unitario:n(i.nValUnit),valor_total:n(i.nValTot),desconto:n(i.nDesconto),despesas:n(i.nDespesas),frete_item:n(i.nFrete),seguro:n(i.nSeguro),categoria:str(i.cCodCateg),observacao:str(i.cObs),local_estoque:str(i.codigo_local_estoque)};}).sort((a:any,b:any)=>a.codigo_item-b.codigo_item);const f=obj(r.frete_consulta),frete:Record<string,unknown>={};for(const k of ['cTpFrete','nCodTransp','nValFrete','nValOutras','nValSeguro','nPesoBruto','nPesoLiq','nQtdVol'])frete[k]=f[k]??null;return {codigo:code,snapshot:{codigo:code,numero:str(c.cNumero),codigo_integracao:str(c.cCodIntPed),fornecedor:str(c.nCodFor),contato:str(c.cContato),comprador:str(c.nCodCompr),centro_custo:str(c.nCodCC),categoria:str(c.cCodCateg),etapa:str(c.cEtapa),data_previsao:str(c.dDtPrevisao),data_inclusao:str(c.dIncData),hora_inclusao:str(c.cIncHora),condicao_pagamento:str(c.cCodParc),parcelas_quantidade:n(c.nQtdeParc),observacoes:str(c.cObs),observacoes_internas:str(c.cObsInt),contrato:str(c.cContrato),projeto:n(c.nCodProj),frete,parcelas:array(r.parcelas_consulta,'parcelas','nParcela'),departamentos:array(r.departamentos_consulta,'departamentos','cCodDepto'),caracteristicas:array(r.caracteristicas_consulta,'caracteristicas','cNome'),itens}};}

function dataBr(d:Date){return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);}
async function pesquisarOmie(page:number,key:string,secret:string,incremental:boolean,desdeIncremental?:string|null){
  const base:any={
    nPagina:page,nRegsPorPagina:50,lApenasImportadoApi:'N',
    lExibirPedidosPendentes:'S',lExibirPedidosFaturados:'S',lExibirPedidosRecebidos:'S',
    lExibirPedidosCancelados:'N',lExibirPedidosEncerrados:'N',
    lExibirPedidosRecParciais:'S',lExibirPedidosFatParciais:'S'
  };
  if(incremental){
    const hoje=new Date();
    const marcoMs=desdeIncremental&&Number.isFinite(Date.parse(desdeIncremental))
      ? Date.parse(desdeIncremental)
      : Date.now()-24*60*60*1000;
    const inicioComSobreposicao=new Date(marcoMs-60*60*1000);
    base.dDataInicial=dataBr(inicioComSobreposicao);
    base.dDataFinal=dataBr(hoje);
    base.lApenasAlterados=true;
  }

  let ultimoErro='';
  for(let tentativa=1;tentativa<=3;tentativa++){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),28000);
    try{
      const response=await fetch('https://app.omie.com.br/api/v1/produtos/pedidocompra/',{
        method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,
        body:JSON.stringify({call:'PesquisarPedCompra',app_key:key,app_secret:secret,param:[base]})
      });
      const data=await response.json();
      if(response.ok&&!data.faultstring&&!data.faultcode)return data;

      ultimoErro=str(data.faultstring||data.message||data.faultcode||response.status);
      const redundant=ultimoErro.toLowerCase().includes('redundant')||ultimoErro.toLowerCase().includes('redundante');

      if(!redundant)throw Error(ultimoErro);

      if(tentativa<3){
        const esperaMs=tentativa===1?1200:2200;
        await new Promise(resolve=>setTimeout(resolve,esperaMs));
        continue;
      }

      throw Error(ultimoErro);
    } finally {
      clearTimeout(timer);
    }
  }

  throw Error(ultimoErro||'Falha desconhecida ao consultar Omie');
}
Deno.serve(async req=>{
  if(req.method!=='POST')return answer({erro:'Método não permitido'},405);
  const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),key=Deno.env.get('OMIE_APP_KEY'),secret=Deno.env.get('OMIE_APP_SECRET');
  if(!url||!service||!key||!secret)return answer({erro:'Configuração ausente'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get('x-cron-secret'); if(!token)return answer({erro:'Não autorizado'},401);
  const check=await db.rpc('validar_token_cron_pedidos_compra',{p_token:token}); if(check.error||check.data!==true)return answer({erro:'Não autorizado'},401);

  let body:any={}; try{body=await req.json();}catch{}
  const modoPedido=str(body?.modo).toLowerCase();
  const forcarIncremental=modoPedido==='incremental';
  const continuarCompleto=modoPedido==='continuar_completo';
  let state0=await db.from('sincronizacao_pedidos_compra_omie').select('*').eq('id',1).single();
  if(state0.error) return answer({sucesso:false,erro:state0.error.message},500);

  // Libera automaticamente somente locks abandonados ha mais de 20 minutos.
  // Nao toca em pedidos, itens, historicos ou qualquer outro dado de negocio.
  const lockExpiradoAntesDe=new Date(Date.now()-20*60000).toISOString();
  if(
    state0.data.status==='executando' &&
    state0.data.atualizado_em &&
    new Date(state0.data.atualizado_em).getTime()<new Date(lockExpiradoAntesDe).getTime()
  ){
    const liberadoEm=new Date().toISOString();
    const cleanup=await db.from('sincronizacao_pedidos_compra_omie').update({
      status:'erro',
      finalizado_em:liberadoEm,
      atualizado_em:liberadoEm,
      mensagem:'Execucao anterior expirada; lock liberado automaticamente.'
    }).eq('id',1).eq('status','executando').lt('atualizado_em',lockExpiradoAntesDe);
    if(cleanup.error)return answer({sucesso:false,erro:cleanup.error.message},500);

    state0=await db.from('sincronizacao_pedidos_compra_omie').select('*').eq('id',1).single();
    if(state0.error)return answer({sucesso:false,erro:state0.error.message},500);
  }

  // Daily trigger: reset cursor and let this execution + subsequent auto runs perform the full scan.
  if(modoPedido==='completo'){
    if(state0.data.status==='executando') return answer({sucesso:true,ignorado:true,motivo:'Sincronização já em andamento'});
    const now=new Date().toISOString();
    const reset=await db.from('sincronizacao_pedidos_compra_omie').update({
      pagina_proxima:1,total_paginas_previstas:0,total_paginas:0,total_pedidos:0,total_alterados:0,
      proxima_tentativa_em:null,varredura_iniciada_em:now,status:'aguardando',
      mensagem:'Conferência completa diária iniciada.'
    }).eq('id',1);
    if(reset.error)return answer({sucesso:false,erro:reset.error.message},500);
  }

  const state1=await db.from('sincronizacao_pedidos_compra_omie').select('*').eq('id',1).single();
  if(state1.error)return answer({sucesso:false,erro:state1.error.message},500);
  const existeCompletoPendente =
    Number(state1.data.total_paginas_previstas??0)>0 ||
    Number(state1.data.pagina_proxima??1)>1;

  if(continuarCompleto && !existeCompletoPendente){
    return answer({
      sucesso:true,
      ignorado:true,
      motivo:'Nenhuma conferencia completa pendente.'
    });
  }

  const fullPendente =
    modoPedido==='completo' ||
    continuarCompleto ||
    (!forcarIncremental && existeCompletoPendente);

  // Modo incremental pode rodar mesmo durante uma conferencia completa pendente.
  if(!fullPendente){
    if(state1.data.status==='executando')return answer({sucesso:true,ignorado:true,motivo:'Outra execução em andamento'});
    const now=new Date().toISOString();
    const lock=await db.from('sincronizacao_pedidos_compra_omie').update({
      status:'executando',iniciado_em:now,finalizado_em:null,atualizado_em:now,
      mensagem:'Sincronização incremental: consultando pedidos alterados.'
    }).eq('id',1).neq('status','executando').select('id').maybeSingle();
    if(lock.error)return answer({sucesso:false,erro:lock.error.message},500);
    if(!lock.data)return answer({sucesso:true,ignorado:true,motivo:'Outra execução em andamento'});

    let page=1,processed=0,novas=0,alteradas=0,iguais=0,totalRegs=0;
    const cursorIncremental=state1.data.ultima_incremental_sucesso_em??null;
    const begin=Date.now();
    try{
      while(processed<8 && Date.now()-begin<43000){
        const data=await pesquisarOmie(page,key,secret,true,cursorIncremental);
        const pages=Math.max(0,Number(data.nTotalPaginas??0));
        totalRegs=Number(data.nTotalRegistros??0);
        const raw=Array.isArray(data.pedidos_pesquisa)?data.pedidos_pesquisa:[];
        if(pages===0||raw.length===0)break;
        const records=raw.map(normalize);
        const saved=await db.rpc('registrar_lote_pedidos_compra_omie',{p_pedidos:records});
        if(saved.error)throw saved.error;
        novas+=n(saved.data?.novas); alteradas+=n(saved.data?.alteradas); iguais+=n(saved.data?.iguais);
        processed++; if(page>=pages)break; page++;
      }
      const end=new Date().toISOString();
      const upd=await db.from('sincronizacao_pedidos_compra_omie').update({
        status:'sucesso',finalizado_em:end,atualizado_em:end,ultima_conciliacao_em:end,proxima_tentativa_em:null,
        ultima_incremental_sucesso_em:end,
        mensagem:'Incremental concluído: '+totalRegs+' alterados no período; '+novas+' novos; '+alteradas+' atualizados.'
      }).eq('id',1);
      if(upd.error)throw upd.error;
      return answer({sucesso:true,modo:'incremental',registros_periodo:totalRegs,paginas_processadas:processed,novas,alteradas,iguais});
    }catch(e){
      const message=e instanceof Error?e.message:(typeof e==='object'&&e!==null?JSON.stringify(e):String(e));
      const end=new Date().toISOString();
      const redundant=message.toLowerCase().includes('redundant')||message.toLowerCase().includes('redundante');

      if(redundant){
        await db.from('sincronizacao_pedidos_compra_omie').update({
          status:'sucesso',
          finalizado_em:end,
          atualizado_em:end,
          proxima_tentativa_em:null,
          mensagem:'Consulta temporariamente adiada pela Omie. Nova tentativa automática no próximo ciclo.'
        }).eq('id',1);

        return answer({
          sucesso:true,
          modo:'incremental',
          ignorado:true,
          motivo:'Limite temporário da Omie; nova tentativa automática no próximo ciclo.'
        });
      }

      await db.from('sincronizacao_pedidos_compra_omie').update({
        status:'erro',
        finalizado_em:end,
        atualizado_em:end,
        mensagem:message.slice(0,900)
      }).eq('id',1);

      return answer({sucesso:false,modo:'incremental',erro:message},500);
    }
  }

  // Full scan mode: continue from saved cursor, several pages per run.
  let locked=false,processed=0,page=1;
  try{
    const begin=Date.now(),now=new Date().toISOString();
    const expired=new Date(Date.now()-20*60000).toISOString();
    await db.from('sincronizacao_pedidos_compra_omie').update({status:'erro',atualizado_em:now,mensagem:'Execução expirada'}).eq('id',1).eq('status','executando').lt('atualizado_em',expired);
    const lock=await db.from('sincronizacao_pedidos_compra_omie').update({
      status:'executando',iniciado_em:now,finalizado_em:null,atualizado_em:now,
      mensagem:'Conferência completa de pedidos de compra em andamento.'
    }).eq('id',1).neq('status','executando').select('id').maybeSingle();
    if(lock.error)throw lock.error;if(!lock.data)return answer({sucesso:true,ignorado:true,motivo:'Outra execução em andamento'});
    locked=true;
    const state=await db.from('sincronizacao_pedidos_compra_omie').select('pagina_proxima,total_paginas_previstas,total_pedidos,total_alterados,varredura_iniciada_em').eq('id',1).single();
    if(state.error)throw state.error;
    page=Math.max(1,n(state.data.pagina_proxima));let pagesExpected=n(state.data.total_paginas_previstas),count=page===1?0:n(state.data.total_pedidos),changes=page===1?0:n(state.data.total_alterados);
    let scanStart=page===1?now:state.data.varredura_iniciada_em??now;
    for(let iteration=0;iteration<8;iteration++){
      if(iteration>0&&Date.now()-begin>43000)break;
      const data=await pesquisarOmie(page,key,secret,false);
      const pages=n(data.nTotalPaginas),reported=data.nPagina==null?null:Number(data.nPagina),recordsRaw=data.pedidos_pesquisa;
      const discrepancy=(reported!==null&&reported!==page)||!Number.isSafeInteger(pages)||pages<1||pages>100000||!Array.isArray(recordsRaw)||!recordsRaw.length||page>pages||(page>1&&pagesExpected>0&&pages!==pagesExpected);
      if(discrepancy)throw Error('Paginação inconsistente na página '+page+'.');
      const records=recordsRaw.map(normalize);
      const saved=await db.rpc('registrar_lote_pedidos_compra_omie',{p_pedidos:records});
      if(saved.error)throw saved.error;
      count+=records.filter((r:any)=>r.snapshot.etapa==='15').length; changes+=n(saved.data?.alteradas); processed++;
      const done=page>=pages,next=done?1:page+1,end=new Date().toISOString();
      if(done){
        const reconciliacao=await db.rpc('reconciliar_ausentes_pedidos_compra_aprovacao',{p_inicio:scanStart});
        if(reconciliacao.error) throw reconciliacao.error;
      }
      const updated=await db.from('sincronizacao_pedidos_compra_omie').update({
        pagina_proxima:next,total_paginas_previstas:done?0:pages,total_paginas:pages,total_pedidos:count,total_alterados:changes,
        varredura_iniciada_em:done?null:scanStart,status:done?'sucesso':'executando',finalizado_em:done?end:null,atualizado_em:end,
        ultima_conciliacao_em:done?end:state1.data.ultima_conciliacao_em,
        ultima_incremental_sucesso_em:state1.data.ultima_incremental_sucesso_em,
        mensagem:done?'Conferência completa concluída: '+count+' pedidos na Aprovação. Modo incremental permanece independente.':'Conferência completa: página '+page+'/'+pages+' concluída.'
      }).eq('id',1).eq('status','executando');
      if(updated.error)throw updated.error;
      if(done){locked=false;return answer({sucesso:true,modo:'completo',concluido:true,paginas_processadas:processed,paginas:pages,pedidos_aprovacao:count,alteradas:changes});}
      page=next;pagesExpected=pages;
    }
    const end=new Date().toISOString();
    const paused=await db.from('sincronizacao_pedidos_compra_omie').update({
      status:'sucesso',finalizado_em:end,atualizado_em:end,proxima_tentativa_em:null,
      mensagem:'Conferência parcial; prosseguirá da página '+page+'/'+pagesExpected
    }).eq('id',1).eq('status','executando');
    if(paused.error)throw paused.error;locked=false;
    return answer({sucesso:true,modo:'completo',concluido:false,paginas_processadas:processed,proxima_pagina:page,paginas:pagesExpected});
  }catch(e){
    const message=e instanceof Error?e.message:(typeof e==='object'&&e!==null?JSON.stringify(e):String(e));
    const redundant=message.toLowerCase().includes('redundant')||message.toLowerCase().includes('redundante');

    if(redundant){
      if(locked){
        const end=new Date().toISOString();
        await db.from('sincronizacao_pedidos_compra_omie').update({
          status:'sucesso',
          finalizado_em:end,
          atualizado_em:end,
          proxima_tentativa_em:null,
          mensagem:'Conferência temporariamente adiada pela Omie. Nova tentativa automática no próximo ciclo.'
        }).eq('id',1);
      }

      return answer({
        sucesso:true,
        modo:'completo',
        ignorado:true,
        paginas_processadas:processed,
        pagina:page,
        motivo:'Limite temporário da Omie; nova tentativa automática no próximo ciclo.'
      });
    }

    if(locked){
      const end=new Date().toISOString();
      await db.from('sincronizacao_pedidos_compra_omie').update({
        status:'erro',
        finalizado_em:end,
        atualizado_em:end,
        mensagem:message.slice(0,900)
      }).eq('id',1);
    }

    return answer({sucesso:false,modo:'completo',paginas_processadas:processed,pagina:page,erro:message},500);
  }
});
