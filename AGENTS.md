# PULSO — Instruções para agentes de código

Antes de alterar interfaces, leia `design-system/DESIGN_SYSTEM.md`, `design-system/tokens.css`, `design-system/components.md`, `design-system/accessibility.md` e `design-system/brand-direction.md`.

## Regras obrigatórias
- Use apenas os SVGs oficiais de `public/brand/`; nunca redigite o wordmark.
- Manrope é a fonte principal; IBM Plex Mono é técnica.
- Paper organiza, Carbon estrutura e Signal sinaliza.
- Não invente cores, sombras, raios, fontes ou espaçamentos.
- Não use valores hexadecimais ou classes Tailwind arbitrárias dentro de componentes.
- Reutilize componentes existentes e mantenha WCAG AA, foco visível e alvos de 44 px.
- Sem cyberpunk, glow, gradientes genéricos, estética gamer ou dashboard fictício.
- Server Components por padrão; Client Components somente quando há interação.
- Execute `npm run check` antes de concluir.
