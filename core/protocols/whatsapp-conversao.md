# Protocolo — Clientes no WhatsApp

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Quando consultar:** objetivo "Quero clientes no WhatsApp". Responsáveis: Entrada → Mídia + Criativo → Atendimento → Analista.

Funil: **Anúncio → WhatsApp → qualificação → agendamento → comparecimento → venda.** Não exige site nem Pixel.

## Pré-configuração (em ordem; o sistema só pergunta o que falta)
1. Procedimento divulgado (`campanha.procedimento`, a partir dos prioritários).
2. Preço ou condição comercial, se for divulgar, com validade (`campanha.oferta`, `oferta_validade`).
3. Cidade, ponto no mapa, raio (`segmentacao-local.md`).
4. Orçamento diário e limite mensal.
5. Público (gênero, idade).
6. Criativo (arquivo ou post).
7. Copy (4 variações, editável).
8. WhatsApp comercial com DDD; a página do Facebook precisa estar conectada a esse número no WhatsApp Business.
9. Configuração (conta, página, fuso).
10. Validação (pendências zeradas, conformidade sem bloqueio).
11. Resumo para aprovação.
12. Publicação só com confirmação e validação técnica.

## Configuração técnica
`OUTCOME_ENGAGEMENT`, `destination_type WHATSAPP`, `optimization_goal CONVERSATIONS`, CTA `WHATSAPP_MESSAGE`. Detalhes: `.agents/rules/meta-ads.md`.

## Fluxo automático de entrada
Se a clínica usa CRM com construtor de fluxo, configurar `core/templates/fluxo-whatsapp-automatico.md` antes de publicar a campanha: boas-vindas, 3 perguntas de qualificação, apresentação da **avaliação personalizada** (nunca "consulta") e passagem para a secretária, que oferece dois horários da agenda real da Doutora.

## Antes de publicar: a equipe está pronta?
- Quem responde e em que horário (`clinica.quem_responde`, `horario_funcionamento`).
- Scripts revisados (`core/templates/script-whatsapp.md`).
- CRM em uso (cada conversa vira um contato).
- Capacidade semanal comporta novos atendimentos.
Se a equipe não puder responder no horário em que o anúncio entrega, registrar como risco no resumo da sessão.

## Medição de sucesso
Não basta conversa. Medir: conversas (Meta) → em atendimento → qualificados → agendados → compareceram → vendas (CRM). O relatório mostra cada etapa com sua origem.

## Decisões frequentes
| Sinal | Ação |
|---|---|
| Cliques sem conversas | Verificar se o botão abre o WhatsApp correto e se a página está ligada ao número |
| Muitas conversas, poucas respostas | Revisar a expectativa do anúncio e a primeira mensagem |
| Respostas sem agendamento | Revisar qualificação, objeções, horários oferecidos |
| Muitas perguntas só de preço | Avaliar se o anúncio deve informar faixa de preço real |

## Registro
Rascunho, publicação (ids e estado), cada monitoramento, cada decisão — automático. Resumo de sessão ao final.
