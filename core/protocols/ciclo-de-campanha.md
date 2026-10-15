# Protocolo — Ciclo de campanha

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Quando consultar:** sempre que uma campanha for planejada, publicada, acompanhada, alterada ou encerrada. Responsáveis: Mídia (execução), Analista (decisão), Suporte (registro).

## Etapas e critérios de passagem

| # | Etapa | Entradas | Saída / critério para avançar | Onde no sistema |
|---|---|---|---|---|
| 1 | Diagnóstico (D1/D2) | questionários clínica e público | dados obrigatórios do objetivo respondidos | tela de perguntas |
| 2 | Objetivo e indicador | objetivo escolhido | indicador principal definido (ver tabela abaixo) | botão de objetivo |
| 3 | Estratégia | região, público, orçamento | resumo de segmentação sem pendências | `buildPlan` |
| 4 | Criativo | arquivo, post ou criação | criativo salvo na biblioteca | "Qual criativo vamos usar?" |
| 5 | Copy | 4 variações + edição | triagem sem bloqueio | "Escolha o texto" |
| 6 | Conformidade | texto, oferta, imagem, público | status ≠ bloqueado | `review()` |
| 7 | Configuração | Meta conectada, conta/página | pendências = 0 | resumo |
| 8 | Revisão | resumo completo | gestora leu | "Confira antes de publicar" |
| 9 | Confirmação | marcação + PUBLICAR | rota aceita | botão Publicar |
| 10 | Publicação | API | estado real registrado | `publish()` |
| 11 | Checagem de saúde | D+3 após o início | entrega, destino, erros, atendimento ok | "Monitorar agora" |
| 12 | Avaliação | prazo escolhido + volume mínimo | classificação ≠ inconclusivo | monitoramento |
| 13 | Decisão | classificação + qualidade + capacidade | decisão com justificativa | "Decisão" |
| 14 | Próximo teste | aprendizado | nova variação ou ajuste | criativo |
| 15 | Escala | evidência suficiente | aumento gradual confirmado | `validacao-e-escala.md` |

## Indicador principal por objetivo
- WhatsApp: custo por conversa **e** taxa conversa → agendamento (as duas juntas).
- Seguidores: custo por seguidor atribuído (quando disponível) e visitas ao perfil.
- Reconhecimento: alcance, frequência e CPM na área atendida.

## Prazos
- O questionário de campanha pergunta por quantos dias deixar rodar antes de avaliar (5, 7, 10 ou 14). Esse é o prazo de **decisão**.
- O primeiro monitoramento é marcado para D+3 às 10h (fuso da conta) — é **checagem de saúde**, não decisão. Exceção: gasto ≥ 3× o custo-alvo sem nenhum resultado já pode indicar pausa após conferir destino e entrega.
- Fase de aprendizado da Meta: resultados iniciais oscilam; evitar alterações significativas nos primeiros dias, porque reiniciam o aprendizado.

## Orçamento
- Nunca exceder o limite mensal: o plano bloqueia se `orçamento diário × 30,4 > limite mensal`.
- Com orçamento pequeno, preferir uma campanha bem configurada a várias campanhas com pouco volume cada.
- Mudança de orçamento é alteração relevante: exige confirmação e registro.

## Erros a evitar
- Avaliar no primeiro dia; pausar tudo de uma vez; duplicar campanha que falhou sem ler o erro; trocar criativo, público e orçamento ao mesmo tempo (impede saber o que funcionou).

## Registro obrigatório ao final de cada ciclo
Resumo de sessão com: o que foi feito, o que os dados mostram, o que não se sabe, gargalo, próxima ação, responsável, data de revisão.
