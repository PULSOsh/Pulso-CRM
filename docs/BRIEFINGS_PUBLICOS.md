# Briefings Públicos — Especificação Funcional

## Objetivo

Permitir que clientes e potenciais clientes respondam perguntas no site da PULSO, sem login, e que as respostas cheguem organizadas ao CRM. O briefing público é uma porta de entrada comercial, não apenas um formulário de contato.

## Jornada

1. O visitante escolhe um serviço ou recebe um link direto.
2. O sistema carrega a versão publicada do template.
3. O visitante informa seus dados básicos.
4. O formulário apresenta perguntas condicionais.
5. O rascunho é salvo automaticamente.
6. O visitante revisa e envia.
7. O CRM recebe uma submissão imutável com snapshot das perguntas.
8. A equipe revisa, identifica duplicidades e vincula ou cria contato, empresa e oportunidade.
9. A submissão pode originar um orçamento em site.

## Templates iniciais

- Link na Bio e Cartão Digital;
- Catálogo Digital;
- Site Essencial;
- Landing Page;
- Site Institucional;
- Loja Virtual;
- Integração com IA;
- Automação de Processos;
- Sistema Web, CRM, SaaS ou White Label;
- Briefing genérico.

## Estrutura dos templates

Cada template possui: nome, slug, descrição pública, produto relacionado, funil de destino, etapa de destino, responsável padrão, tema, mensagem de sucesso, versão, status e configuração de criação automática de oportunidade.

Cada versão possui seções, perguntas, opções e regras condicionais. Respostas antigas sempre permanecem vinculadas à versão usada no envio.

## Tipos de pergunta

Texto curto, texto longo, e-mail, telefone, URL, número, moeda, data, escolha única, múltipla escolha, lista, sim/não, escala, arquivo, consentimento e bloco informativo.

## Mapeamento para o CRM

Perguntas podem mapear para:

- nome do contato;
- e-mail;
- WhatsApp;
- nome da empresa;
- segmento;
- site atual;
- Instagram;
- origem;
- produto de interesse;
- orçamento estimado;
- prazo desejado;
- descrição da oportunidade;
- tags;
- campos personalizados.

O mapeamento sugere dados, mas não deve sobrescrever um registro existente sem confirmação quando houver conflito.

## Estados

`started`, `submitted`, `under_review`, `qualified`, `linked`, `proposal_created`, `archived`, `spam`.

## Segurança

- captcha adaptativo;
- honeypot;
- rate limit;
- tokens aleatórios;
- uploads privados;
- allowlist de tipos;
- sanitização de nome;
- consentimento versionado;
- não revelar existência de e-mail;
- idempotência no envio;
- retenção configurável de rascunhos.

## Critérios de aceite

- um template pode ser criado e publicado sem alterar código;
- condicionais funcionam no cliente e são revalidadas no servidor;
- uma nova versão não altera submissões antigas;
- o formulário pode ser retomado com token válido;
- submissões chegam à caixa do CRM;
- anexos privados não possuem URL permanente pública;
- notas internas nunca aparecem no portal público.
