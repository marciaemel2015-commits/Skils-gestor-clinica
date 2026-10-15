# Questionário da campanha (D3 — Demanda)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.

**Quando usar:** A cada nova campanha (WhatsApp, seguidores, reconhecimento). Responsável: Mídia.

## Como conduzir
- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.
- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).
- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".
- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).
- Resposta que pareça token ou senha é recusada.

## Perguntas

| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |
|---|---|---|---|---|---|---|
| `procedimento` | Qual procedimento esta campanha vai divulgar? | opcao_dinamica | (opções de clinica.procedimentos_prioritarios) | sim | whatsapp, seguidores, reconhecimento |  |
| `oferta` | Vai divulgar preço ou condição? Qual, exatamente? | texto | — | não | — | Só condição real e válida. Deixe em branco para não divulgar preço. |
| `oferta_validade` | Até quando essa condição vale? | data | — | não | — |  |
| `orcamento_diario` | Quanto investir por dia nesta campanha? (R$) | moeda | — | sim | whatsapp, seguidores, reconhecimento |  |
| `duracao_dias` | Por quantos dias, no mínimo, você quer deixar rodando antes de avaliar? | opcao | 5 · 7 · 10 · 14 | sim | whatsapp, seguidores, reconhecimento | Avaliar cedo demais leva a decisões erradas. |

## Como interpretar as respostas
- Oferta só com condição real e data de validade; sem validade, a triagem pede ajuste.
- `duracao_dias` é o prazo mínimo antes da decisão sobre o criativo; o monitoramento de D+3 é checagem de saúde.
- O orçamento sugerido vem do cadastro da clínica e pode ser alterado para esta campanha.

## Registro e próximo passo
- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> campanha <campo> "<valor>"`.
- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.
- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.
