# Modelo — Relatório de monitoramento

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Material de uso autorizado pela titular.

**Quando usar:** em cada data de monitoramento e após mudanças relevantes. Produzido pela tela "Monitorar agora" e salvo em `data/monitoramento/<clinica>/`.

## Versão simples (para a gestora)
1. **Em uma frase:** como está a campanha (ex.: "Está gerando conversas, mas poucas viram agendamento").
2. **O que os números mostram:** investimento, conversas (ou seguidores/alcance), agendamentos, vendas.
3. **O que ainda não sabemos:** dados ausentes.
4. **Principal ponto a melhorar:** gargalo do diagnóstico.
5. **O que vamos fazer:** decisão (manter, ajustar, testar variação, escalar, pausar) e quem faz.
6. **Quando olhamos de novo:** data do próximo monitoramento.

## Versão técnica (para análise)
| Bloco | Conteúdo | Origem |
|---|---|---|
| Identificação | campanha, ids Meta, estado, dias rodando, período | registro |
| Mídia | investimento, impressões, alcance, CPM, frequência, CTR, CPC, conversas, custo por conversa | Meta / cálculo |
| Seguidores | visitas ao perfil, seguidores atribuídos, custo por seguidor e faixa (ou "não calculável") | Meta / gestora / cálculo |
| Comercial | contatos, em atendimento, qualificados, agendados, compareceram, vendas, faturamento, motivos de perda | Clínica (CRM) |
| Diagnóstico | achados por etapa, dados ausentes | cálculo |
| Criativos | classificação de cada anúncio + justificativa | cálculo |
| Respostas da gestora | custo aceitável, demora, agenda disponível, objeções | clínica |
| Decisão | decisão + justificativa + responsável | gestora |
| Aprendizado | o que foi aprendido nesta rodada | gestora/analista |

Toda célula mostra a origem: **Meta**, **Clínica**, **Cálculo**, **Estimativa** ou **Ausente**. Dado ausente nunca é preenchido com zero.

## Regras
- Não declarar vencedor por tempo ativo ou clique barato.
- Não atribuir vendas sem vínculo registrado no CRM.
- Sem Meta conectada ou sem ids, o relatório usa só o CRM e avisa.
