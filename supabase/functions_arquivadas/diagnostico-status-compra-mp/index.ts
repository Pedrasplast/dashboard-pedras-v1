import {createClient} from "npm:@supabase/supabase-js@2";
Deno.serve(async req=>{
 const key=Deno.env.get('OMIE_APP_KEY'),secret=Deno.env.get('OMIE_APP_SECRET'),url=Deno.env.get('SUPABASE_URL'),role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 const db=createClient(url!,role!);const r=await db.rpc('validar_token_cron_pedidos_compra',{p_token:req.headers.get('x-cron-secret')||''});
 if(r.error||r.data!==true)return Response.json({erro:'não autorizado'},{status:401});
 const filtros={nPagina:1,nRegsPorPagina:50,lApenasImportadoApi:'N',lExibirPedidosPendentes:'S',lExibirPedidosFaturados:'N',lExibirPedidosRecebidos:'N',lExibirPedidosCancelados:'N',lExibirPedidosEncerrados:'N',lExibirPedidosRecParciais:'N',lExibirPedidosFatParciais:'N'};
 const response=await fetch('https://app.omie.com.br/api/v1/produtos/pedidocompra/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({call:'PesquisarPedCompra',app_key:key,app_secret:secret,param:[filtros]})});
 const d=await response.json();return Response.json({http:response.status,erro:d.faultstring||null,paginas:d.nTotalPaginas,registros:d.nTotalRegistros,amostras:(d.pedidos_pesquisa||[]).slice(0,5).map((x:any)=>({numero:x.cabecalho_consulta?.cNumero,etapa:x.cabecalho_consulta?.cEtapa}))});
});
