# Questionário do atendimento (D5 — Diálogo e Conversão)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.

**Quando usar:** Antes de gerar scripts e treinamento, e quando o diagnóstico apontar gargalo no atendimento. Responsável: Atendimento.

## Como conduzir
- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.
- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).
- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".
- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).
- Resposta que pareça token ou senha é recusada.

## Perguntas

| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |
|---|---|---|---|---|---|---|
| `primeira_mensagem` | Como vocês respondem hoje a primeira mensagem? Cole um exemplo. | texto | — | não | — |  |
| `perguntas_qualificacao` | O que vocês precisam saber antes de agendar uma avaliação? | multi | Procedimento de interesse · Se já fez antes · Melhor dia e horário · Cidade/bairro · Se tem alguma dúvida de saúde (encaminhar à profissional) | sim | treinar |  |
| `nome_atendimento` | Como a clínica chama o primeiro atendimento com a Doutora? | opcao | Consulta · Avaliação | não | — | "Consulta" posiciona como atendimento completo e costuma ser usada quando é paga e conduzida pela profissional habilitada. "Avaliação" pode soar como orçamento rápido. A escolha muda os botões do anúncio e as mensagens. |
| `tem_avaliacao` | A clínica faz avaliação antes do procedimento? | opcao | Sim, gratuita · Sim, paga · Não | sim | treinar |  |
| `confirma_agendamento` | Vocês confirmam o agendamento na véspera? | opcao | Sim, sempre · Às vezes · Não | sim | treinar |  |
| `respostas_validadas` | Cole as respostas que a profissional aprovou para dor, recuperação, duração e cuidados. | texto | — | não | — | O sistema só usa essas respostas. Sem elas, o script orienta a encaminhar a dúvida para a profissional. |
| `dificuldades` | Onde o atendimento mais trava hoje? | multi | Demora para responder · Cliente some depois do preço · Não sabe explicar o procedimento · Falta confirmação · Muitas faltas · Não registra os contatos | sim | treinar |  |

## Como interpretar as respostas
- As respostas aprovadas pela profissional são o único texto clínico que os scripts podem usar.
- As dificuldades marcadas orientam quais módulos do treinamento priorizar.

## Registro e próximo passo
- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> atendimento <campo> "<valor>"`.
- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.
- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.
