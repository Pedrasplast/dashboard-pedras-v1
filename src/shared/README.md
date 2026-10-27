# src/shared

Código usado por mais de uma tela. Antes de escrever um formatador, conversor
ou componente dentro de `features/`, procure aqui.

## lib/ — funções puras (sem React, sem Supabase)

| Arquivo       | O que tem                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `numeros.js`  | `paraNumero`, `paraNumeroOu`, `paraNumeroOuNull`, `converterNumeroFlexivel(OuNull)`, `converterNumeroBrOuNull`, `converterNumeroDecimal`, `ehNumeroInvalido`, `numeroParaCampo`                                                                                                                                             |
| `texto.js`    | `paraTexto`, `normalizarTexto`, `normalizarTextoCompacto`, `normalizarTextoSemAparar`, `normalizarCodigo`, `ordenarTexto`                                                                                                                                                                                                   |
| `datas.js`    | `obterHoje`, `obterHojeISO`, `formatarDataISOLocal`, `obterAnoAtual`, `obterMesAtual`, `converterData`, `converterDataLocal`, `formatarDataBR`, `formatarHora`, `formatarDataHora` ("27/10/2026 08:05"), `formatarDataHoraFrase` ("… às 08:05"), `formatarDataHoraComSegundos`, `FUSO_BRASILIA` (só para regras de negócio) |
| `formatar.js` | `formatarNumeroPtBR` / `formatarReaisPtBR` (Intl em cache), `formatarNumeroCasasFixas`, `formatarNumeroFlexivel`                                                                                                                                                                                                            |
| `colecoes.js` | `valoresUnicos`, `valoresUnicosOrdenados`, `compararPtBR`                                                                                                                                                                                                                                                                   |

## Regras

- Cada função tem uma regra exata (como trata vazio, vírgula, fuso). Mudar uma
  regra muda números em várias telas: rode `npm test` e confira quem importa.
- Formato de exibição específico de uma tela (casas decimais, traço para vazio)
  fica no módulo da tela, montado com estas funções — por exemplo
  `formatarNumeroPtBR(paraNumero(valor), { maximumFractionDigits: 0 })`.
- Em vez de `numero.toLocaleString("pt-BR", opcoes)`, use
  `formatarNumeroPtBR(numero, opcoes)`: mesmo resultado, sem recriar o formatador.
