/*
 * A sincronização com o Omie roda a cada 15 minutos (seg–sex, 07:00–17:45).
 * Pedidos novos/alterados chegam na hora pelo tempo real (Realtime em
 * pedidos_notificacoes), que já dispara a recarga da tabela e dos badges.
 * A leitura periódica fica só como rede de segurança — antes era a cada
 * 15 s (pedidos) e 30 s (notificações), baixando os mesmos dados dezenas de
 * vezes entre uma sincronização e outra (egress no Supabase).
 */
export const INTERVALO_LEITURA_SUPABASE = 5 * 60 * 1000;
export const INTERVALO_NOTIFICACOES = 5 * 60 * 1000;

/* Ao voltar para a aba, só recarrega se o dado tiver mais de 2 minutos. */
export const TEMPO_DADOS_FRESCOS_PEDIDOS = 2 * 60 * 1000;

export const PEDIDOS_POR_PAGINA = 8;

export const QUERY_KEY_PEDIDOS = ["pedidos-supabase"];
export const QUERY_KEY_NOTIFICACOES = ["pedidos-notificacoes-nao-lidas"];

/** Lista vazia estável (mesma referência entre renders). */
export const PEDIDOS_VAZIOS = Object.freeze([]);
