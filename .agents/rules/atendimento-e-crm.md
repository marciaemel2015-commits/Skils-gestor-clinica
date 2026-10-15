# Regra permanente — Atendimento e CRM

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

Quando consultar: ao criar scripts, treinar a equipe, registrar contatos, analisar conversas ou calcular resultados comerciais.

## 1. Sucesso comercial
Conversa não é venda. O resultado é medido em cada etapa: conversa → qualificado → agendado → compareceu → venda. Toda análise mostra as etapas separadas.

## 2. Etapas oficiais do CRM (iguais no código: `app/lib/store.js`)

| Chave | Nome exibido | Quando usar |
|---|---|---|
| `novo` | Novo contato | Chegou a primeira mensagem |
| `em_atendimento` | Em atendimento | A equipe respondeu e a pessoa interagiu |
| `qualificado` | Qualificado | Interesse real em procedimento oferecido, região atendida, disponibilidade compatível |
| `agendado` | Agendado | Data e horário marcados |
| `compareceu` | Compareceu | Esteve na clínica |
| `venda` | Venda concluída | Fechou; exige valor vendido |
| `sem_resposta` | Sem resposta | Parou de responder |
| `perdeu_interesse` | Sem interesse | Declarou que não quer agora |
| `nao_compareceu` | Não compareceu | Faltou ao agendamento |
| `encerrada` | Venda perdida | Oportunidade encerrada (registrar motivo) |

## 3. O que registrar (e o que não)
Registrar: primeiro nome, telefone (se necessário), origem conhecida, campanha (quando identificável), procedimento de interesse, etapa, histórico de etapas (automático), agendamento, valor vendido, motivo de perda, próxima ação e data, consentimento e preferência de contato.
Não registrar: informações de saúde, fotos, documentos, conversas inteiras.

## 4. Atribuição
Uma venda só é ligada a uma campanha quando há evidência (a pessoa veio pelo botão do anúncio, mencionou o anúncio, ou a mensagem automática de origem indicou). Sem evidência: origem "desconhecida". Não atribuir por coincidência de data.

## 5. Conduta no atendimento
- Responder o quanto antes dentro do horário de atendimento.
- Chamar pelo nome, acolher, entender antes de oferecer.
- Duas opções de horário ao convidar.
- Confirmar na véspera.
- Retomar contato no máximo de forma respeitosa e com consentimento; parar se a pessoa pedir.
- Nunca diagnosticar, prometer resultado, constranger ou criar falsa urgência.
- Dúvida clínica sem resposta aprovada: encaminhar à profissional.

## 6. Treinamento
Simulações com avaliação por critérios (tempo, acolhimento, entendimento, clareza, segurança da informação, condução, registro). Segurança da informação tem peso maior. Resultado gravado no histórico da clínica. Modelo: `core/templates/treinamento-equipe.md`.

## 7. Exclusão a pedido
Quando a pessoa pedir exclusão dos dados: botão "Excluir" no CRM com confirmação. O histórico guarda apenas o identificador interno.
