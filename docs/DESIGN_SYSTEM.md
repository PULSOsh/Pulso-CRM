# Design system do PULSO CRM

## 1. Princípio

```text
O claro organiza.
O escuro estrutura.
O laranja sinaliza.
```

A interface deve parecer:

- autoral;
- editorial;
- compacta;
- confiável;
- técnica;
- clara;
- orientada à ação.

Não deve parecer:

- dashboard genérico de template;
- cyberpunk;
- gamer;
- neon;
- excessivamente futurista;
- decorativa;
- cheia de gradientes;
- produto criado por IA sem direção.

## 2. Tokens

```text
Pulso Paper   #F4F2ED
Pulso Carbon  #161616
Pulso Signal  #E65318
Pulso Mineral #7A7A7A
Pulso Neutral #C9C9C9
```

O projeto também pode possuir tokens atualizados do brandbook, mas deve escolher uma fonte única e mapear aliases de forma consistente. Não espalhar hexadecimais em componentes.

## 3. Tipografia

- Manrope: interface e texto principal;
- IBM Plex Mono: códigos, números, valores, datas, protocolos e metadados.

Usar SVGs oficiais em `public/brand/`. Não redigitar o wordmark.

## 4. Uso do Signal

Pulso Signal serve para:

- CTA principal;
- seleção;
- foco visual;
- alerta;
- indicador de ação;
- estado importante;
- ponto de energia da interface.

Não deve dominar grandes superfícies.

## 5. Componentes-base

Corrigir e utilizar de verdade:

- Button;
- Card;
- Badge;
- Modal/Dialog;
- Input;
- Select;
- Textarea;
- Checkbox;
- Radio;
- Table;
- Tabs;
- EmptyState;
- Alert;
- Toast;
- Skeleton;
- Dropdown;
- Command/Search;
- DatePicker;
- FileUpload.

Evitar criar variantes locais repetidas em cada página.

## 6. Status real dos componentes-base (atualizado após auditoria)

Os tokens **já estão** corretamente registrados no Tailwind 4 (`rounded-control`, `border-pulso-border`, `focus:ring-pulso-signal-soft` etc. funcionam de verdade). O passo 1-4 da correção original (auditar tokens, registrar, verificar classes geradas) já foi feito. `src/components/ui/` já tem, implementados e funcionando: `Button` (variantes `primary/secondary/outline/ghost/destructive`, tamanhos `sm/md/lg/icon`), `Input`, `Select`, `Textarea`, `Modal` (com foco automático, `Escape` pra fechar, `aria-modal`), `Card`, `Badge`, `Tabs`, `Accordion`.

**O problema real não era o design system estar quebrado — era ele existir e não ser usado.** Uma auditoria encontrou 17 arquivos com `<input>`/`<select>`/`<button>` cru, com Tailwind ad-hoc reinventando o que os componentes acima já resolviam, de forma inconsistente entre telas. Essa é a causa raiz de qualquer reclamação de "os formulários estão feios/inconsistentes".

### Regra obrigatória a partir de agora

**Nenhum formulário usa elemento HTML de formulário cru.** Sempre os componentes de `components/ui/`:

```tsx
// Errado — Tailwind ad-hoc, reinventa o que já existe, gera inconsistência
<input
  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
/>
<button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
  Salvar
</button>

// Certo — usa o design system real
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

<Input />
<Button>Salvar</Button>
```

Modais também: usar `<Modal open={} onClose={} title={} description={}>` de `@/components/ui/modal` em vez de reconstruir `fixed inset-0 bg-black/50` manualmente — o componente já resolve foco automático, `Escape`, e overlay clicável.

Tabelas de edição inline densa (linhas de item de orçamento, por exemplo) são a única exceção deliberada: usam inputs mais compactos que o padrão de 44px de altura porque o padrão quebraria o layout da linha — mas isso é exceção documentada, não regra geral.

### Ainda não construído (verdadeiro gap, não confundir com o problema acima)

`Checkbox` e `Radio` como componentes próprios (hoje usam `<input type="checkbox">` nativo estilizado inline — aceitável, mas sem padronização), `Table`, `EmptyState`, `Alert`, `Toast`, `Skeleton`, `Dropdown`, `Command/Search`, `DatePicker`, `FileUpload`. Construir sob demanda, conforme os módulos que os exigem (`FileUpload` é bloqueante pro módulo de Arquivos, por exemplo).

## 7. Layout

- navegação compacta;
- hierarquia clara;
- densidade adequada para trabalho diário;
- títulos objetivos;
- ações primárias visíveis;
- ações destrutivas discretas e confirmadas;
- tabelas úteis;
- cards menores e acionáveis;
- formulários agrupados por decisão;
- evitar blocos enormes apenas para “encher dashboard”.

## 8. Kanban

Cards devem mostrar:

- empresa ou contato;
- avatar ou iniciais;
- produto;
- temperatura;
- valor;
- responsável;
- próxima ação;
- prazo;
- atraso;
- tags essenciais.

Fornecer alternativa ao arrastar.

## 9. Documentos públicos

Propostas e contratos devem parecer documentos digitais da PULSO, não dashboards.

- leitura confortável;
- boa hierarquia;
- investimento evidente;
- escopo transparente;
- CTA claro;
- versão e validade visíveis;
- responsividade;
- impressão e PDF coerentes.

## 10. Acessibilidade

Obrigatório:

- WCAG 2.2 AA como referência;
- foco visível;
- navegação por teclado;
- alvo mínimo de 44px;
- labels associados;
- erros vinculados aos campos;
- contraste adequado;
- `prefers-reduced-motion`;
- alternativa a drag-and-drop;
- loading;
- vazio;
- erro;
- sucesso;
- acesso negado;
- responsividade.
