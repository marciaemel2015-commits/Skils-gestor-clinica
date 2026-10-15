# Contexto da clínica — como é guardado e consultado

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Importante:** este arquivo **não** guarda dados de clínicas. Dados de clínicas e pacientes ficam em `data/` (fora do Git, gravação conferida, separados por clínica). Markdown é versionável e pode ser copiado; dados pessoais e comerciais não podem morar aqui.

## Onde está o contexto de cada clínica
| Informação | Arquivo | Como consultar |
|---|---|---|
| Respostas dos questionários (clínica, público, campanha, criativo, atendimento) | `data/clinicas/<id>/clinica.json` | `node app/cli.js ver <id>` ou "Editar cadastro" |
| Conta de anúncios, página, Instagram, fuso, moeda | idem (`meta`) | tela "Configurar a Meta" |
| Metas configuráveis (custo por seguidor) | idem (`metas`) | `POST /api/clinicas/<id>/metas` |
| Tarefa em andamento | `data/clinicas/<id>/tarefa-atual.json` | `node app/cli.js retomada <id>` |
| Histórico de alterações (antes → depois) | `data/clinicas/<id>/historico.jsonl` | "Quero consultar o histórico" |
| Campanhas | `data/campanhas/<id>/` | `node app/cli.js campanhas <id>` |
| Criativos e arquivos | `data/criativos/<id>/` | tela de criativos |
| Monitoramentos e relatórios | `data/monitoramento/<id>/` | tela de monitoramento |
| CRM | `data/crm/<id>/contatos.json` | tela CRM / `node app/cli.js crm <id>` |
| Resumos de sessão | `data/sessoes/<id>/` | "Onde paramos" / histórico |

## Ficha-resumo (o que um agente deve saber antes de agir)
Ao iniciar, gerar mentalmente esta ficha a partir de `ver` + `retomada`, sem copiá-la para Markdown:
1. Clínica, cidade, raio, público (gênero/idade).
2. Procedimentos prioritários, preços reais, diferenciais, capacidade semanal.
3. Validação clínica feita? (sim/não) — define o que pode ser dito.
4. Orçamento diário e limite mensal.
5. Meta conectada? Conta/página/fuso.
6. Campanhas e estados; próximo monitoramento.
7. Objeções reais; quem atende e em que horário.
8. Tarefa em andamento e próximo passo.

## Clínica inicial deste pacote
Pasta preparada para a clínica da Dra. Márcia. Nenhum dado dela foi pré-cadastrado: o cadastro é feito na primeira abertura da interface, pela própria gestora, para não haver informação inventada.

## Regras
- Uma clínica por vez; confirmar qual antes de agir.
- Dado novo informado em conversa → gravar pelo questionário (interface ou `cli responder`), conferir o retorno e só então usar.
- Dado que mudou (preço, orçamento, raio) → regravar; o histórico mantém a versão anterior.
- Prazo de retenção de dados de contatos: definir com a clínica e registrar no resumo de sessão (ver `.agents/rules/seguranca.md`).
