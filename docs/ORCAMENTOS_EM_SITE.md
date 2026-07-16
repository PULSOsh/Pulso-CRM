# Gerador de Orçamento em Site — Especificação Funcional

## Visão

O orçamento da PULSO será uma proposta comercial publicada como site responsivo. Ele pode ser criado a partir de um briefing, de uma oportunidade ou por preenchimento manual.

## Entradas

### A partir do briefing

Importar dados do cliente, contexto, objetivos, referências, prazo, orçamento, anexos e produto sugerido. Toda importação deve ser revisável.

### A partir da oportunidade

Importar contato, empresa, produtos, valor, notas e briefings relacionados.

### Manual

Permitir selecionar ou criar cliente, digitar contexto, adicionar produtos, escopo, valores e condições sem existir briefing.

## Blocos do editor

- capa;
- contexto entendido;
- objetivos;
- diagnóstico;
- solução recomendada;
- escopo;
- entregáveis;
- não incluídos;
- cronograma;
- investimento;
- pagamento;
- adicionais;
- responsabilidades;
- garantia;
- manutenção;
- FAQ;
- validade;
- termos resumidos;
- CTA;
- contato.

## Cálculo

O servidor é a fonte da verdade. Subtotal, desconto, total, adicionais e parcelas são recalculados no backend. Valores da versão publicada ficam congelados em snapshot.

## Estados

`draft`, `ready`, `published`, `viewed`, `accepted`, `rejected`, `changes_requested`, `expired`, `cancelled`.

## Versionamento

- rascunho muda livremente;
- publicar cria versão imutável;
- editar após envio cria nova versão;
- uma única versão fica ativa para resposta;
- versão aceita não pode ser substituída.

## Página pública

A página deve conter navegação clara, escopo, cronograma, investimento, pagamento, validade, aceite, recusa, solicitação de alteração, WhatsApp e download de PDF.

Não exibir dados internos, notas, CPF, informações bancárias completas ou respostas sensíveis do briefing.

## Eventos

Publicado, enviado, visualizado, PDF baixado, WhatsApp clicado, adicional selecionado, alteração solicitada, recusado, aceito, expirado e revogado.

## Aceite

Registrar nome, e-mail, relação com a empresa, declaração explícita, versão, hash do snapshot, data, hora, IP, user agent, pagamento escolhido e adicionais selecionados.

## Critérios de aceite

- orçamento pode nascer com ou sem briefing;
- dados importados mostram sua origem;
- edição manual não é sobrescrita sem confirmação;
- total do navegador e servidor coincide;
- publicação gera token não enumerável;
- resposta do cliente atualiza CRM e histórico;
- PDF representa a mesma versão publicada.
