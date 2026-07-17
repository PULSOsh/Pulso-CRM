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

## 6. Problema atual conhecido

Os componentes de `components/ui/` usam classes como tokens que não estavam corretamente registrados no Tailwind. Por isso, telas passaram a utilizar Tailwind cru e identidades paralelas.

Correção obrigatória:

1. auditar Tailwind 4 e `@theme`;
2. registrar tokens semânticos;
3. verificar classes geradas;
4. criar uma página ou teste visual de componentes;
5. migrar shell e formulários principais;
6. remover estilos arbitrários progressivamente;
7. validar build.

Não fazer refatoração visual total em um único commit.

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
