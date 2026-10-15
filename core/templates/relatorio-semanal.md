# Modelo — Relatório semanal

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Material de uso autorizado pela titular.

**Quando usar:** uma vez por semana (sugestão: segunda-feira) ou quando a gestora pedir. Gerado em "Quero monitorar campanhas › Gerar relatório semanal" (`reports.semanalMarkdown`) e salvo no histórico. Também: `node app/cli.js relatorio <clinica>`.

## Estrutura gerada
1. **Cabeçalho:** clínica, período (últimos 7 dias), data de geração.
2. **Resumo para a gestora:** contatos que chegaram; agendaram/compareceram/compraram; faturamento registrado; conclusão do diagnóstico.
3. **Campanhas:** para cada campanha publicada — estado, último monitoramento da semana (mídia com origem, custo por seguidor quando houver), classificação dos criativos, recomendação registrada.
4. **Diagnóstico do funil:** achados e dados ausentes.
5. **Decisões e alterações da semana:** do histórico de auditoria.
6. **Legenda de origem** e o aviso: completar 7 dias não torna uma campanha vencedora.
7. **Aviso de direitos.**

## Como ler e decidir
- Considerar volume, ciclo de compra (procedimentos de valor mais alto demoram mais para fechar), custo e maturidade dos resultados.
- Comparar com semanas anteriores da própria clínica, não com números de outras clínicas.
- Sair da leitura com: uma decisão por campanha, um ponto de atendimento para treinar e a data do próximo monitoramento.

## Registro
O relatório é salvo; as decisões tomadas a partir dele precisam ser registradas em cada campanha (botões de decisão com justificativa) e no resumo de sessão.
