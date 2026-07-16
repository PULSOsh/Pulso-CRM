# Segurança e Privacidade das Jornadas Públicas

## Dados coletados

Colete apenas dados necessários para qualificar, orçar, contratar e executar o serviço. Cada pergunta deve indicar finalidade, sensibilidade e se pode aparecer em proposta pública.

## Consentimento

Registre texto e versão do consentimento, data, hora, origem, finalidade e identificador da submissão. Consentimento para contato comercial deve ser separado quando necessário.

## Rascunhos

Rascunhos não enviados devem possuir retenção limitada. O token de retomada deve expirar e poder ser revogado.

## Uploads

- bucket privado;
- URL assinada de curta duração;
- allowlist de MIME e extensão;
- limite de tamanho;
- checksum;
- sanitização de nome;
- quarentena ou verificação quando disponível;
- nunca executar conteúdo enviado.

## Propostas públicas

- `noindex`;
- token de alta entropia;
- sem IDs internos na URL;
- revogação;
- expiração;
- dados públicos definidos por allowlist;
- CSP e cabeçalhos seguros;
- ações definitivas confirmadas;
- logs sem conteúdo sensível.

## Direitos e retenção

Documentar exportação, correção, exclusão, anonimização e retenção. Registros necessários para contrato, fraude, auditoria ou obrigação legal devem seguir política específica em vez de exclusão cega.

## Auditoria

Registrar ator, organização, ação, entidade, data, IP aproximado quando necessário, request ID e alterações relevantes. Mascarar documentos e chaves financeiras.
