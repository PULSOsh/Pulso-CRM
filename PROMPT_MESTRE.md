# PROMPT MESTRE — PULSO CRM (reconstrução completa)

> Este é o prompt melhorado, pra usar como instrução inicial em qualquer sessão (Claude ou outra) que for construir ou continuar o PULSO CRM. Substitui a instrução original, que estava correta na intenção mas confusa na forma.

---

## Missão

Construir o PULSO CRM: o sistema interno que a PULSO usa todo dia pra trabalhar, vender, executar, receber e decidir. Não é um produto pra vender, não é SaaS, não é multiempresa. É uma ferramenta de uso exclusivo e interno da PULSO, e cada decisão de escopo deve ser filtrada por isso.

Antes de escrever qualquer código, leia nesta ordem:

1. `docs/PRODUCT_VISION.md`
2. `docs/SCOPE_AND_NON_GOALS.md`
3. `docs/MODULE_SPECIFICATIONS.md`
4. `docs/ARCHITECTURE_AND_STANDARDS.md`
5. `docs/DESIGN_SYSTEM.md`
6. `docs/ROADMAP.md`
7. `docs/QUALITY_AND_ACCEPTANCE.md`
8. `STEP_BY_STEP_IMPLEMENTATION.md`

Esses documentos são a fonte de verdade. Se alguma coisa que eu pedir contradizer o que está escrito neles, aponte a contradição antes de agir — não resolva sozinho por suposição.

## O fluxo que o sistema inteiro serve

```
Origem do lead
→ briefing ou cadastro manual
→ contato e empresa
→ oportunidade
→ qualificação
→ diagnóstico
→ proposta (com versionamento e publicação real)
→ negociação
→ aceite
→ contrato (assinatura digital)
→ recebível (parcelas, baixas)
→ projeto (etapas, checklist, tarefas)
→ arquivos (entregáveis, evidências)
→ aprovação (cliente aprova entrega)
→ publicação ou entrega
→ garantia
→ manutenção
→ possível nova oportunidade
```

Todo módulo existe pra servir uma etapa deste fluxo. Se uma tela não avança esse fluxo, ela não é prioridade — por mais bonita que fique.

## Como trabalhar comigo (regras que já aprendemos na marra)

1. **Construir, validar, testar — só commitar quando for algo palpável de usar.** Não empilhe trabalho não testado. Rode `tsc --noEmit`, `biome check`, `vitest run` e `next build` de verdade antes de dizer que algo funciona. Nunca afirme que um comando passou sem ter executado ele.
2. **Não adivinhe a causa de um bug — investigue.** Quando algo quebra em produção, entre via SSH e leia os logs reais do container (`sudo docker logs`) antes de propor qualquer correção. Já resolvemos dois bugs de produção nesta sessão exatamente assim, e adivinhar teria custado mais tempo que investigar.
3. **Nunca faça deploy ou altere produção sem autorização explícita.** Push no `main` deste repositório aciona deploy automático em poucos minutos — trate todo push a essa branch como uma ação de deploy, não como um commit qualquer.
4. **Nunca apague ou sobrescreva algo sem entender o que é, e nunca altere produção sem backup.** Working tree desconhecido, migration já aplicada, dado real de cliente — pare e pergunte antes de agir.
5. **Formulário nenhum usa HTML cru.** Todo campo de formulário usa os componentes reais de `src/components/ui/` (`Button`, `Input`, `Select`, `Textarea`, `Modal`). Construímos um design system real neste projeto e ele ficou sem uso em 17 arquivos — isso é o motivo dos formulários terem ficado feios e inconsistentes. Não repita.
6. **Peça decisão só quando for de verdade ambíguo ou arriscado** (risco real de perda de dado, mudança irreversível, contradição nos documentos). Não pergunte de novo o que já está especificado nos documentos.
7. **Uma tela bonita não é um módulo concluído.** Um módulo só está pronto quando: schema + migration, validação (Zod), autorização (`requirePermission`), interface real, teste automatizado e teste manual passam juntos.

## Armadilhas técnicas já conhecidas (não redescubra na marra)

- **Next.js 16**: `params` e `searchParams` de toda rota dinâmica são `Promise` — sempre `await`. Isso já derrubou produção inteira uma vez porque nenhuma rota dinâmica tinha esse padrão.
- **Drizzle relations**: toda relação `many()` de um lado precisa de uma relação `one()` correspondente e explícita (`fields`/`references`) do outro lado — mesmo que pareça óbvio, o Drizzle não infere sozinho quando a tabela tem mais de uma FK possível. Isso já derrubou o Kanban em produção uma vez.
- **CSS Cascade Layers (Tailwind v4)**: CSS sem `@layer` sempre vence CSS dentro de `@layer` para propriedades de mesma especificidade — isso já quebrou uma correção de responsividade mobile porque a correção estava dentro de `@layer overrides` e perdia pra uma regra solta em `globals.css`. Se for sobrescrever algo do `globals.css`, não coloque em `@layer`.
- **`organization_id` nunca vem do cliente.** Toda action confia em `requirePermission()` pra obter o `organizationId` real da sessão — nunca no que o formulário/cliente mandou.

## O que o CRM não é (não desviar pra isso)

- Não é SaaS, não é white label, não é multiempresa pra terceiros.
- Não tem billing, planos, ou seletor de organização.
- Não é ERP genérico nem substituto de contabilidade.
- Não depende de IA autônoma tomando decisão sozinha.

## O pedido concreto desta rodada

Continuar construindo em cima do que já existe e funciona (Contatos, Empresas, Kanban, Tarefas, Atividades, Briefings, Produtos, Contratos, Projetos — todos testados e no ar), seguindo `STEP_BY_STEP_IMPLEMENTATION.md` fase por fase pra completar os módulos que nunca saíram do papel: Propostas com versionamento e publicação corrigidos, Arquivos, Aprovações, Financeiro/Recebíveis, Dashboard real, Relatórios, Notificações e Auditoria genérica. Não reescrever nem apagar o que já funciona — o problema nunca foi o código existente, foi a implementação não ter seguido a especificação até o fim.
