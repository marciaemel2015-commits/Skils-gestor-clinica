# Questionário de ponto de partida da Meta (D3 — Demanda)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.

**Quando usar:** Ao abrir "Configurar a Meta" pela primeira vez em uma clínica. Responsáveis: Entrada e Suporte.

## Como conduzir
- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.
- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).
- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".
- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).
- Resposta que pareça token ou senha é recusada.

## Perguntas

| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |
|---|---|---|---|---|---|---|
| `ja_anuncia` | A clínica já anuncia pelo Gerenciador de Anúncios (com conta e pagamento configurados)? | opcao | Sim · Não · Não sei | sim | meta | Se sim, vamos direto conectar e conferir. Se não, mostramos o passo a passo do que falta. |
| `tem_perfil_admin` | A dona da clínica tem perfil pessoal no Facebook e é administradora das contas da clínica? | opcao | Sim · Não · Não sei | sim | meta_ativos | Página, portfólio empresarial e conta de anúncios ficam ligados a um perfil pessoal real, com acesso de administradora. |
| `tem_pagina` | A clínica tem página no Facebook? | opcao | Sim · Não · Não sei | sim | meta_ativos |  |
| `tem_instagram_profissional` | O Instagram da clínica é profissional e está ligado à página? | opcao | Sim · Não · Não sei | sim | meta_ativos |  |
| `tem_bm` | Existe um portfólio empresarial (Business Manager) da clínica? | opcao | Sim · Não · Não sei | sim | meta_ativos |  |
| `tem_conta_anuncios` | Existe uma conta de anúncios da clínica? | opcao | Sim · Não · Não sei | sim | meta_ativos |  |
| `tem_pagamento` | A conta de anúncios já tem forma de pagamento cadastrada? | opcao | Sim · Não · Não sei | sim | meta_ativos | O cadastro do pagamento é sempre feito pela dona da clínica, na Central de Cobrança da Meta. |
| `whatsapp_conectado` | O WhatsApp Business da clínica está conectado à página? | opcao | Sim · Não · Não sei | sim | meta_ativos |  |

## Como interpretar as respostas
- `ja_anuncia = Sim` → a clínica vai direto para conectar a conta e a conferência automática pela API (botão "Conferir tudo").
- `ja_anuncia = Não` ou `Não sei` → o sistema pergunta item por item (página, Instagram profissional, portfólio empresarial/BM, conta de anúncios, pagamento, WhatsApp) e mostra o passo a passo com link oficial só para o que falta (`app/lib/onboarding.js`).
- As respostas são o que a gestora declara; depois de conectar, a conferência pela API é que confirma. Se a API não conseguir ler um item (pagamento, WhatsApp), ele aparece como "conferir", nunca como pronto.
- Limite real: o sistema não cria página, Instagram profissional nem forma de pagamento. Essas etapas são feitas pela dona das contas, logada no Facebook dela.

## Registro e próximo passo
- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> meta <campo> "<valor>"`.
- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.
- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.
