# Questionário do criativo (D4 — Desenvolvimento de Criativos)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.

**Quando usar:** Antes de produzir, adaptar ou modelar qualquer peça. Responsável: Criativo.

## Como conduzir
- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.
- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).
- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".
- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).
- Resposta que pareça token ou senha é recusada.

## Perguntas

| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |
|---|---|---|---|---|---|---|
| `tem_criativo` | Você já tem um criativo (foto ou vídeo) para usar? | opcao | Sim, tenho o arquivo · Tenho um post no Instagram que foi bem · Não, quero criar do zero · Quero modelar um anúncio que vi | sim | whatsapp, seguidores, reconhecimento, criativo |  |
| `formato` | Que formato? | opcao | Imagem · Carrossel · Vídeo | sim | whatsapp, seguidores, reconhecimento, criativo, modelar |  |
| `referencia` | Tem algum anúncio ou vídeo de referência? Cole o link. | texto | — | não | modelar |  |
| `referencia_dados` | Esse material de referência tem resultado comprovado (vendas, agendamentos, muitos seguidores)? | opcao | Sim, tenho os números · Foi bem no orgânico · Não sei, só gostei · É de outra clínica | não | modelar |  |
| `modelar_ou_zero` | Quer modelar a ideia ou criar do zero? | opcao | Modelar uma referência · Criar do zero | sim | criativo |  |
| `paleta` | Quais são as cores da clínica? | texto | — | não | — |  |
| `quem_aparece` | Quem pode aparecer no vídeo ou foto? | opcao | A profissional · A equipe · Clientes com autorização assinada · Ninguém, só o ambiente | sim | reconhecimento, criativo |  |
| `autorizacao_imagem` | Se aparecer cliente: existe autorização de uso de imagem por escrito? | opcao | Sim · Não · Não vai aparecer cliente | sim | criativo |  |

## Como interpretar as respostas
- Referência sem dados de desempenho é hipótese, não prova.
- Se aparecer cliente, a autorização de uso de imagem por escrito é obrigatória (a triagem bloqueia sem ela).
- Com post do Instagram que foi bem, preferir usá-lo como criativo (ID do post).

## Registro e próximo passo
- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> criativo <campo> "<valor>"`.
- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.
- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.
