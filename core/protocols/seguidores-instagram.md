# Protocolo — Seguidores qualificados no Instagram

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Quando consultar:** objetivo "Quero seguidores qualificados no Instagram". Responsáveis: Mídia, Criativo, Analista.

## Antes de anunciar: o perfil segura a visita?
Checklist (registrar o resultado na sessão):
- Foto e nome claros; bio diz o que a clínica faz, onde, e como agendar.
- Link funcionando (WhatsApp ou página).
- Destaques: procedimentos, bastidores/estrutura, dúvidas frequentes, depoimentos autorizados.
- Últimas publicações coerentes com o anúncio e sem conteúdo fora das regras de conformidade.
Se o perfil não estiver pronto, o Criativo propõe ajustes antes de investir.

## Configuração
`OUTCOME_TRAFFIC`, `destination_type INSTAGRAM_PROFILE`, `optimization_goal PROFILE_VISIT`, `promoted_object.page_id`.
**Disponibilidade limitada na API** (informada pela Meta): se a validação recusar, o sistema registra o erro e a campanha deve ser criada no Gerenciador com os dados do resumo. Não usar o botão "Impulsionar".

## Metas internas (configuráveis por clínica)
| Faixa | Custo por seguidor | Ação |
|---|---|---|
| Meta | abaixo de R$ 1,00 | manter; preparar variações para testar |
| Atenção | R$ 1,00 a R$ 1,99 | acompanhar; revisar criativo e perfil |
| Crítica | R$ 2,00 ou mais | investigar anúncio, público, conteúdo oferecido e experiência do perfil |

Metas internas, não garantia. Valores em `clinica.metas.custoSeguidor`.

## Medição honesta
- O custo por seguidor só é calculado com **seguidores atribuídos** pela Meta (coluna do Gerenciador, informada na tela de monitoramento).
- Sem atribuição: mostrar separadamente investimento, visitas ao perfil e crescimento total do perfil, com o aviso de que o crescimento não é atribuído à campanha.
- Acompanhar também CTR, CPC, desempenho por criativo e relevância geográfica (seguidores da região).

## Decisões
- Faixa crítica com poucos seguidores: inconclusivo → investigar, **não pausar automaticamente**.
- Faixa crítica com volume suficiente e qualidade ruim: candidato a pausa (com confirmação).
- Faixa de meta com volume e seguidores da região: testar novas variações e escalar gradualmente (`validacao-e-escala.md`).

## Registro
Monitoramento com custo por seguidor (ou "não calculável" e o motivo), decisão e justificativa.
