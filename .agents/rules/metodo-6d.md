# MÉTODO CLÍNICA DE ESTÉTICA 6D

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

Versão 1.0.0 — 14/10/2026. Quando consultar: antes de qualquer recomendação, plano, criativo, campanha ou análise. Este é o manual central; os protocolos de `core/protocols/` detalham cada etapa.

## Princípio central

Marketing não termina no anúncio. O sistema deve acompanhar a jornada desde a escolha do objetivo até o atendimento, o agendamento, o comparecimento e a venda, usando dados disponíveis e respeitando as limitações de atribuição.

## D1 — DIREÇÃO

Objetivo: definir o que a clínica precisa alcançar e o que consegue atender.

Levantar:
- nome e localização da clínica;
- serviços e procedimentos efetivamente oferecidos;
- áreas geográficas atendidas;
- objetivo prioritário;
- orçamento autorizado;
- capacidade de atendimento;
- horários e disponibilidade;
- canais de contato;
- situação atual do marketing;
- restrições operacionais e clínicas.

Entregáveis:
- diagnóstico inicial;
- objetivo prioritário;
- indicadores de sucesso;
- orçamento aprovado;
- informações ausentes;
- plano de ação inicial.

Regra: não recomendar aumento de procura sem verificar se a clínica consegue atender à demanda.

No sistema: `core/forms/questionario-clinica.md` (form `clinica`). O campo `capacidade_semana` é usado na classificação: sem agenda disponível, um criativo não vira "candidato a escala".

## D2 — DESCOBERTA

Objetivo: compreender o público e as evidências disponíveis antes de definir a comunicação.

Investigar:
- perguntas frequentes dos clientes;
- objeções registradas pela equipe;
- dúvidas recorrentes;
- avaliações e comentários acessíveis legitimamente;
- concorrentes e anúncios publicamente observáveis;
- campanhas anteriores;
- criativos disponíveis;
- motivos de agendamento, perda e compra.

Classificar cada conclusão como:
- fato confirmado;
- informação relatada pela clínica;
- evidência observada;
- hipótese a testar.

Não presumir que todas as pessoas têm as mesmas inseguranças ou necessidades. Não inventar dados demográficos, preferências ou resultados de concorrentes.

No sistema: `core/forms/questionario-publico.md` (form `publico`), biblioteca de objeções (`/objecoes`), referências da Biblioteca de Anúncios registradas como hipótese (opção "Quero modelar um anúncio").

## D3 — DEMANDA

Objetivo: transformar o objetivo comercial em uma estratégia de aquisição apropriada.

Definir:
- público elegível conforme políticas aplicáveis;
- localização e área atendida;
- objetivo de campanha disponível na conta;
- canal de conversão;
- orçamento;
- estrutura de testes;
- destino do anúncio;
- indicadores;
- processo de atendimento posterior.

O fluxo padrão, quando adequado, é:
Anúncio → WhatsApp → qualificação → agendamento → comparecimento → venda.

Não exigir site ou Pixel quando o funil não depende de um site. Implementar rastreamento adicional somente quando fizer sentido e estiver disponível.

Não presumir que a Meta oferece o mesmo objetivo em todas as contas, países ou versões da API. Confirmar os recursos disponíveis.

No sistema: `core/protocols/whatsapp-conversao.md`, `seguidores-instagram.md`, `reconhecimento-local.md`, `segmentacao-local.md`, `remarketing.md`. A confirmação de recursos é feita por chamada real com `validate_only` antes de criar qualquer objeto.

## D4 — DESENVOLVIMENTO DE CRIATIVOS

Objetivo: desenvolver peças que chamem atenção, comuniquem uma proposta clara e levem a uma ação legítima.

Cada peça deve conter:
- objetivo;
- público e contexto;
- hipótese criativa;
- gancho;
- benefício real;
- prova permitida, quando existente;
- oferta;
- chamada para ação;
- formato e especificações;
- variações para teste;
- cautelas de conformidade.

Para imagens, definir composição, hierarquia, paleta, contraste, tipografia, texto e direção visual.

Para vídeos, definir os primeiros três segundos, roteiro, cenas, falas, textos na tela, edição e CTA.

Uma referência de concorrente serve como inspiração para análise, não como autorização para copiar integralmente nem como prova de que o anúncio é lucrativo.

No sistema: `core/templates/criativo-estatico.md`, `criativo-video.md`, `copy-anuncio.md`, `core/protocols/nomes-de-metodos.md`.

## D5 — DIÁLOGO E CONVERSÃO

Objetivo: transformar conversas em oportunidades reais de atendimento.

Estruturar:
- primeira resposta;
- identificação da necessidade;
- esclarecimento de dúvidas;
- informações permitidas sobre o serviço;
- convite para avaliação ou agendamento;
- confirmação;
- acompanhamento;
- reativação apropriada;
- registro no CRM;
- treinamento da equipe.

Não diagnosticar, pressionar, constranger ou prometer resultados clínicos. Questões clínicas devem ser validadas pelo profissional responsável.

No sistema: `core/templates/script-whatsapp.md`, `treinamento-equipe.md`, `core/protocols/crm-e-rastreamento.md`, tela "Retomar contatos (CRM)".

## D6 — DADOS E ESCALA

Objetivo: entender o que está funcionando, o que está falhando e o que precisa ser testado.

Analisar:
- investimento;
- impressões;
- alcance;
- CPM;
- frequência;
- CTR;
- CPC;
- visitas ao perfil, quando disponíveis;
- seguidores atribuídos, quando mensuráveis;
- conversas iniciadas;
- custo por conversa;
- leads qualificados;
- agendamentos;
- comparecimentos;
- vendas;
- receita;
- motivos de perda.

Não confundir:
- conversa com lead qualificado;
- agendamento com comparecimento;
- comparecimento com venda;
- crescimento total de seguidores com seguidores atribuídos a um anúncio;
- correlação temporal com causalidade comprovada.

No sistema: `core/protocols/monitoramento.md`, `validacao-e-escala.md`, `core/templates/relatorio-monitoramento.md`, `relatorio-semanal.md`.

## Ciclo operacional obrigatório

1. Diagnosticar.
2. Definir objetivo e indicador.
3. Preparar estratégia.
4. Desenvolver criativos.
5. Revisar conformidade.
6. Configurar campanha.
7. Apresentar revisão.
8. Obter confirmação explícita.
9. Publicar ou ativar apenas quando autorizado e tecnicamente possível.
10. Acompanhar resultados.
11. Verificar qualidade dos contatos e desempenho comercial.
12. Diagnosticar o gargalo.
13. Registrar decisões.
14. Testar a próxima melhoria.
15. Escalar somente quando houver evidência suficiente.

Detalhamento passo a passo: `core/protocols/ciclo-de-campanha.md`.

## Princípio de otimização

Não tomar decisões automáticas de pausa, aumento de orçamento ou escala com base apenas em um prazo fixo, poucos resultados ou um indicador isolado.

Considerar volume de dados, qualidade dos contatos, orçamento, capacidade de atendimento, estabilidade dos resultados e impacto comercial.

## Metas de negócio configuráveis

Para campanhas cujo objetivo seja conquistar seguidores, a clínica pode configurar:
- abaixo de R$ 1 por seguidor: faixa desejada;
- de R$ 1 a R$ 1,99: atenção;
- R$ 2 ou mais: investigar.

Essas faixas são metas operacionais configuráveis, não benchmarks universais nem ordens automáticas de pausa. Se a atribuição não estiver disponível, apresentar separadamente o crescimento geral do perfil e os seguidores efetivamente atribuídos.

No sistema: `clinica.metas.custoSeguidor` (padrão 1,00 / 2,00), editável pela rota `/metas`.

## Quando dois protocolos parecem divergir

| Situação | Regra que vale | Por quê |
|---|---|---|
| Prazo mínimo para avaliar (questionário de campanha pergunta 5/7/10/14 dias) vs. primeiro monitoramento em D+3 | Os dois: D+3 é **checagem de saúde** (entrega, destino, erros, atendimento); a **decisão** de criativo só depois do prazo escolhido e com volume mínimo | Evita pausar cedo e evita deixar erro técnico rodando |
| Classificação diz "candidato a escala" mas a agenda está cheia | Não escalar; registrar como "promissor" | D1: não gerar procura que a clínica não atende |
| Custo por seguidor na faixa crítica com poucos seguidores | Investigar, não pausar automaticamente | Princípio de otimização |
| Referência de concorrente "funciona" | Tratar como hipótese | D2 / D4 |
| Gestora pede para "subir tudo" | Cada campanha passa por revisão e confirmação | Regra 7 do AGENTS.md |

## Resultado esperado

Cada ciclo deve terminar com:
- o que foi feito;
- o que os dados mostram;
- o que ainda não se sabe;
- qual é o gargalo principal;
- qual é a próxima ação;
- quem precisa executá-la;
- quando revisar novamente.

Formato de registro: resumo de sessão (`node app/cli.js sessao ...` ou botão "Registrar resumo desta sessão").
