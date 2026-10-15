# Questionário do público e objeções (D2 — Descoberta)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.

**Quando usar:** Antes de criar copy, criativos, scripts ou nomes de método. Responsáveis: Entrada e Criativo.

## Como conduzir
- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.
- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).
- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".
- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).
- Resposta que pareça token ou senha é recusada.

## Perguntas

| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |
|---|---|---|---|---|---|---|
| `genero` | A clínica atende quem? | opcao | Mulheres · Homens · Mulheres e homens | sim | whatsapp, seguidores, reconhecimento |  |
| `idade_min` | Qual a idade mínima das clientes que mais fazem esses procedimentos? | opcao | 18 · 21 · 25 · 30 · 35 · 40 · 45 | sim | whatsapp, seguidores, reconhecimento |  |
| `idade_max` | E a idade máxima? | opcao | 35 · 40 · 45 · 50 · 55 · 60 · 65 | sim | whatsapp, seguidores, reconhecimento |  |
| `desejos` | O que as clientes dizem que querem alcançar? | texto | — | sim | seguidores, criativo, metodo | Use as palavras delas, como aparecem no WhatsApp ou Instagram. |
| `valoriza` | O que elas mais valorizam num procedimento? | multi | Naturalidade · Segurança · Praticidade/pouco tempo · Preço · Atendimento acolhedor · Experiência da profissional · Resultado duradouro | sim | metodo |  |
| `objecoes` | Quais dúvidas ou receios aparecem antes de agendar? | multi | Medo de sentir dor · Medo de ficar artificial · Quanto tempo dura · Tempo de recuperação · Se é seguro · Medo de não gostar do resultado · Opinião do parceiro/família · Preço · Se é indicado para ela · Como funciona o atendimento | sim | whatsapp, criativo, modelar, treinar | Marque só o que você já ouviu de clientes reais. |
| `perguntas_whatsapp` | Quais perguntas chegam mais no WhatsApp? | texto | — | não | — |  |
| `perguntas_instagram` | Quais dúvidas aparecem nos comentários e direct? | texto | — | não | — |  |
| `ja_tentou` | O que elas já tentaram antes de chegar até vocês? | texto | — | não | — |  |
| `abordagens_que_agendam` | Que tipo de conversa costuma terminar em agendamento? | texto | — | não | — |  |
| `motivos_desistencia` | Por que algumas pessoas desistem? | texto | — | não | — |  |
| `perfil_que_comparece` | Que tipo de cliente costuma agendar e aparecer? | texto | — | não | — |  |

## Como interpretar as respostas
- Marcar apenas objeções efetivamente ouvidas de clientes reais; as opções são hipóteses iniciais a pesquisar, não fatos.
- Nunca atribuir medos, condições clínicas ou características pessoais a alguém sem evidência.
- As respostas viram: biblioteca de objeções, perguntas frequentes, ideias de conteúdo, ângulos de copy, scripts de atendimento e hipóteses de criativo (`gen.respostasObjecoes`).
- Idade mínima e máxima definem o público do anúncio; idade mínima nunca abaixo de 18.

## Registro e próximo passo
- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> publico <campo> "<valor>"`.
- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.
- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.
