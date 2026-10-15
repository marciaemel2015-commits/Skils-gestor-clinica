# Status da implementação — Método Clínica de Estética 6D

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

Atualizado em 14/10/2026 · versão 1.2.0 · `npm test`: **73 testes, 73 aprovados** (mocks da Meta identificados como SIMULAÇÃO).

Legenda: **CONCLUÍDO E TESTADO** · **IMPLEMENTADO, MAS NÃO TESTADO** (contra a Meta real) · **BLOQUEADO POR DEPENDÊNCIA** · **PENDENTE** · **NÃO SUPORTADO NO AMBIENTE**

| Módulo | Estado | Evidência / observação |
|---|---|---|
| Documentação do método, agentes, protocolos, questionários, modelos | CONCLUÍDO E TESTADO | `test/forms-docs.test.js`: arquivos existem, têm conteúdo e aviso de direitos; questionários sincronizados com o código |
| Cadastro e questionários (uma pergunta por vez, validação, sem repetir) | CONCLUÍDO E TESTADO | `store.test.js`, `server-ui.test.js` |
| Persistência por clínica, gravação conferida, falha informada | CONCLUÍDO E TESTADO | `store.test.js` (inclui simulação de falha de disco e reinício) |
| Isolamento entre clínicas | CONCLUÍDO E TESTADO | arquivo copiado para outra clínica é recusado; ids maliciosos bloqueados |
| Histórico de auditoria e resumos de sessão; retomada | CONCLUÍDO E TESTADO | `store.test.js` |
| Interface interativa (botões, progresso, voltar/editar, revisão, confirmação) | CONCLUÍDO E TESTADO | toda chamada da interface corresponde a uma rota real (`server-ui.test.js`); verificada no navegador |
| Triagem de conformidade | CONCLUÍDO E TESTADO | `compliance-metrics.test.js` |
| Custo por seguidor, diagnóstico, classificação de criativos | CONCLUÍDO E TESTADO | `compliance-metrics.test.js` |
| Programação 00:00 no fuso da conta | CONCLUÍDO E TESTADO | São Paulo, Lisboa, Manaus, Nova York (horário de verão) |
| CRM (etapas, venda com valor, exclusão LGPD) | CONCLUÍDO E TESTADO | `store.test.js`, `server-ui.test.js` |
| Geradores (copy, prompt, roteiro, scripts, nomes, treinamento) | CONCLUÍDO E TESTADO | `secrets-generators.test.js` |
| Cofre de credenciais (DPAPI Windows / AES) | CONCLUÍDO E TESTADO | DPAPI real testado neste Windows; nenhum arquivo contém o token |
| Logs sem segredos | CONCLUÍDO E TESTADO | `meta-flow.test.js` |
| Proteção do servidor (localhost, Host/Origin, token de sessão, CSP) | CONCLUÍDO E TESTADO | `server-ui.test.js` |
| Assistente da Meta — Caminho 2 (preparar estrutura: perfil/admin, página, Instagram, BM, conta, pagamento, WhatsApp; uma pergunta por vez; "Já fiz esta etapa") | CONCLUÍDO E TESTADO | `onboarding.test.js`, `meta-wizard.test.js` (HTTP); verificado no navegador |
| Assistente da Meta — Caminho 1 (já anuncia: conectar → conferir perfil, permissões, páginas, Instagram, portfólios, contas e status, pagamento, WhatsApp) | IMPLEMENTADO, MAS NÃO TESTADO contra a Meta real | lógica, isolamento, permissão recusada, token expirado, falta de internet e consulta parcial testados com SIMULAÇÃO; itens que a API não deixa ler ficam "conferir"; pagamento sempre com orientação de confirmar na Central de Cobrança |
| "Verificar agora pela API" em cada etapa do Caminho 2 | IMPLEMENTADO, MAS NÃO TESTADO contra a Meta real | aparece só com a Meta conectada (verificado no navegador); usa a mesma conferência do Caminho 1 |
| Cliente Meta: permissões, contas, páginas, status, métricas | IMPLEMENTADO, MAS NÃO TESTADO contra a Meta real | testado só com SIMULAÇÃO; falta app e conta reais |
| Fluxo de publicação (validate_only → pausada → ativação) | IMPLEMENTADO, MAS NÃO TESTADO contra a Meta real | sequência e falhas testadas com SIMULAÇÃO |
| OAuth "Entrar com Facebook" | BLOQUEADO POR DEPENDÊNCIA | precisa de App ID/Secret da Meta e redirect `http://localhost:4766/auth/meta/callback` cadastrado |
| Anúncio de visita ao perfil (seguidores) via API | BLOQUEADO POR DEPENDÊNCIA | disponibilidade limitada pela Meta; alternativa: criar no Gerenciador com o resumo |
| Publicação real | AGUARDANDO AUTORIZAÇÃO | exige Meta conectada + confirmação da gestora |
| Envio de vídeo direto pela API | PENDENTE | usar post do Instagram como criativo |
| Públicos personalizados de remarketing via API | PENDENTE | criar no Gerenciador |
| Exclusão geográfica automática | PENDENTE | conferência manual indicada no resumo |
| Integração automática com WhatsApp (ler conversas, origem do anúncio) | PENDENTE | CRM é preenchido manualmente |
| Envio de conversões offline à Meta | PENDENTE | não exigido pelo funil |
| Notificação ativa de monitoramento (push/e-mail) | NÃO SUPORTADO NO AMBIENTE | o sistema mostra "Onde paramos" ao abrir; agendar lembrete externo se desejado |

## Como atualizar este arquivo
Após qualquer mudança: rodar `npm test`, atualizar a linha do módulo com estado e evidência, registrar no `CHANGELOG.md`.
