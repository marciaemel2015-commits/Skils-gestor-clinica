# Regra permanente — Meta Ads

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

Quando consultar: antes de planejar, configurar, publicar, pausar, ativar ou ler métricas de qualquer campanha.

## 1. Princípios

- Campanhas são criadas pelo **Gerenciador de Anúncios / Marketing API**, nunca pelo botão "Impulsionar" do Instagram (que limita público, posicionamento e controle).
- Só práticas legítimas. Políticas vigentes: https://transparency.meta.com/policies/ad-standards/
- Nada é dado como "publicado", "aprovado" ou "ativo" sem o status retornado pela API.
- Não presumir que um objetivo, destino ou otimização está liberado para a conta: o sistema valida com `execution_options=["validate_only"]` antes de criar.

## 2. Versão e parâmetros usados (verificados na documentação em 14/10/2026)

| Item | Valor no sistema | Observação |
|---|---|---|
| Versão | `v26.0` (`META_API_VERSION`) | Lançada em 29/07/2026. Conferir em https://developers.facebook.com/docs/graph-api/changelog/versions |
| WhatsApp | `OUTCOME_ENGAGEMENT` + `destination_type=WHATSAPP` + `optimization_goal=CONVERSATIONS` + `billing_event=IMPRESSIONS` + `promoted_object{page_id, whatsapp_phone_number}`; criativo `call_to_action WHATSAPP_MESSAGE` com `link https://api.whatsapp.com/send` | Documentação de Click-to-WhatsApp |
| Mensagem pronta (WhatsApp) | `link_data.page_welcome_message` = `{type: VISUAL_EDITOR, version: 2, landing_screen_type: welcome_message, media_type: text, text_format: {customer_action_type: autofill_message, message: {text, autofill_message: {content}}}}` | A frase em `content` é o gatilho do fluxo no CRM (máx. 150 caracteres no sistema; passa pela triagem). Não se aplica quando o criativo é um post do Instagram |
| Visitas ao perfil (seguidores) | `OUTCOME_TRAFFIC` + `destination_type=INSTAGRAM_PROFILE` + `optimization_goal=PROFILE_VISIT` + `promoted_object{page_id}` | **Disponibilidade limitada na API** segundo a Meta. Se a validação falhar, criar no Gerenciador com os mesmos dados do resumo |
| Reconhecimento | `OUTCOME_AWARENESS` + `optimization_goal=REACH` | |
| Categoria especial | `special_ad_categories: []` | Estética não é categoria especial (crédito, emprego, moradia, política); revisar se a Meta mudar |
| Público | `geo_locations.custom_locations` (lat/long + raio km) + `age_min/age_max` + `genders` + `targeting_automation.advantage_audience=0` | Raio e idade são limites reais da clínica |
| Orçamento | `daily_budget` em centavos da moeda da conta | |
| Início | `start_time` = 00:00 do dia seguinte no `timezone_name` da conta | `app/lib/schedule.js` |
| Identidade Instagram | `instagram_user_id` | |

## 3. Permissões necessárias

`ads_management`, `ads_read`, `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`, `instagram_basic`. O botão "Verificar permissões" lista as que faltam. Apps em modo de desenvolvimento só funcionam para administradores/testadores do app; para outras clínicas é preciso App Review e acesso ao nível adequado da Marketing API.

## 4. Sequência obrigatória de publicação

1. Pendências zeradas no resumo (conta, página, fuso, região, idade, orçamento dentro do limite mensal, criativo, texto, conformidade sem bloqueio).
2. Gestora marca "Revisei e autorizo" **e** digita PUBLICAR.
3. Verificar permissões e status da conta (`account_status = 1`).
4. Validar campanha (`validate_only`).
5. Criar campanha **PAUSADA**.
6. Enviar imagem (se arquivo) → validar conjunto → criar conjunto → criativo → anúncio.
7. Ativar a campanha por último (entrega só a partir do `start_time`).
8. Ler `effective_status` e registrar: programada, em revisão, ativa, reprovada, com erro.

Falha em qualquer passo: parar, manter pausada, registrar ids e erro, explicar. **Não repetir automaticamente** (risco de duplicar). Uma campanha já publicada não pode ser publicada de novo pelo sistema.

## 5. Alterações que exigem confirmação

Publicar, ativar, pausar, mudar orçamento de forma relevante, duplicar, excluir. O sistema exige confirmação em todas as rotas de alteração.

## 6. Erros comuns e o que fazer

| Código | Significado | Ação |
|---|---|---|
| 190 | Token expirado/revogado | Reconectar a Meta |
| 10, 200–299 | Falta permissão | Reconectar autorizando tudo; verificar papel na conta/página |
| 4, 17, 32, 613, 80004 | Limite de chamadas | Aguardar; não insistir |
| 100 | Parâmetro recusado | Ler a mensagem; ajustar (ex.: orçamento mínimo, objetivo indisponível) |
| 1487 | Conta com restrição | Gerenciador › Qualidade da conta / pagamentos |
| 2635 | Versão descontinuada | Atualizar `META_API_VERSION` e testar |

## 7. Reprovação de anúncio

Não republicar igual. Ler o motivo (`ad_review_feedback`), ajustar o elemento, passar pela triagem, registrar o que mudou. Pedido de revisão à Meta só quando a gestora entender que a reprovação foi equivocada.
