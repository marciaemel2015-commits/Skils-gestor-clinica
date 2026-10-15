# Testes e limitações

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

## Como executar
```
npm test
```
Usa o executor nativo do Node (`node --test`). Cada arquivo roda em pastas temporárias isoladas (nunca toca em `data/` real). Mocks existem **apenas nos testes** e estão identificados como **SIMULAÇÃO**; o código de produção não simula nada.

## Cobertura (por arquivo)
| Arquivo | O que comprova |
|---|---|
| `store.test.js` | cadastro; validação e normalização das respostas; histórico antes→depois; não repetir perguntas; contexto recuperado após "reinício"; isolamento entre clínicas (inclusive arquivo copiado e ids maliciosos); falha de gravação informada; bloqueio de segredos nos dados; resumo de sessão e retomada; monitoramento vencido; CRM (venda exige valor, exclusão sem dados pessoais no histórico); histórico de entidades |
| `compliance-metrics.test.js` | triagem (bloqueios, escassez sem validade, oferta vencida, menor de idade, imagem sem autorização, texto seguro); custo por seguidor (faixas configuráveis, não atribuível); origem dos dados; diagnóstico das 5 etapas; classificação (pouco volume, clique barato, escala, sem agenda, pausa); funil do CRM; meia-noite no fuso da conta (4 fusos, horário de verão); extração de coordenadas |
| `meta-flow.test.js` | pendências reais; parâmetros da campanha (região, idade, centavos, start_time, WhatsApp); orçamento acima do limite; copy proibida bloqueia; seguidores e reconhecimento; confirmação obrigatória (zero chamadas sem ela); sequência validar→pausada→ativar; estado programada/em revisão; falha no meio deixa pausada; falta de permissão e conta inativa; erros traduzidos; OAuth; appsecret_proof; logs sem token |
| `secrets-generators.test.js` | cofre AES e **DPAPI real do Windows**; recusa sem chave; copies, prompts, roteiros, scripts (clínico só aprovado), 10+ nomes com todos os campos, avaliação de treinamento |
| `server-ui.test.js` | token de sessão e CSP; 401/403 (token, Host, Origin); fluxo de perguntas via HTTP; rascunho com pendências; publicação exige confirmação e Meta; token cifrado e nunca devolvido (varredura de todos os arquivos); monitoramento com origem, decisão exige justificativa, relatório semanal; CRM isolado; **toda chamada da interface tem rota real**; todas as opções exigidas presentes |
| `onboarding.test.js` | ponto de partida (já anuncia → 1 pergunta; senão, só o que falta com link oficial); conferência pela API: conta completa, itens faltando, campos não legíveis viram "conferir" |
| `meta-wizard.test.js` | via HTTP: Caminho 1 (1 pergunta, 409 sem conexão, conferência completa, status/fuso/moeda, pagamento com orientação oficial, registro no histórico); Caminho 2 (uma pergunta por vez sem repetir, passo a passo só do que falta, etapa concluída sai da lista); isolamento entre clínicas; permissão recusada; token expirado e falta de internet; consulta parcial |
| `forms-docs.test.js` | questionários em Markdown idênticos às perguntas da interface; todos os arquivos da arquitetura existem, têm conteúdo e aviso de direitos; nenhum Markdown com token; `.gitignore` protege dados |

Resultado da última execução (14/10/2026, Windows 10, Node 22.21): ver `core/STATUS-SQUAD.md`.

## Verificação manual feita
Interface aberta no navegador: cadastro de clínica, perguntas com progresso e voltar/editar, tela de revisão com pendências e botão de publicar desabilitado sem Meta, CRM, histórico.

## O que NÃO foi testado (e por quê)
| Item | Motivo | Como testar |
|---|---|---|
| Qualquer chamada real à Meta (OAuth, contas, publicação, insights) | não há app/conta da Meta configurados neste ambiente | seguir `docs/CONFIGURACAO-META.md` e fazer a primeira campanha com orçamento mínimo, conferindo no Gerenciador |
| Anúncio de visita ao perfil pela API | disponibilidade limitada pela Meta | a validação na primeira tentativa dirá se a conta tem acesso |
| Expansão de link curto do Google Maps | depende de rede/Google | colar um link `maps.app.goo.gl` na pergunta do mapa |
| Navegadores antigos | interface usa JavaScript moderno | usar Chrome/Edge atualizados |

## Limitações conhecidas
- Vídeo: não há envio direto pela API; usar ID de post do Instagram.
- Públicos de remarketing e exclusões geográficas: criados/conferidos no Gerenciador.
- Um único ponto no mapa por campanha.
- CRM manual (sem integração automática com WhatsApp).
- Sem notificações ativas: lembretes aparecem ao abrir o sistema.
- Triagem de conformidade por regras de texto: não analisa imagens nem detecta todo contexto; revisão humana continua necessária e a decisão final é da Meta.
- Sistema local para um computador por vez; não há sincronização multiusuário.

## Instabilidade conhecida
Em 14/10/2026 o teste 'monitoramento (SIMULAÇÃO Meta + CRM real)' de server-ui.test.js falhou 1 vez em 12 execuções da suíte completa e não reproduziu em 8 execuções isoladas. Causa não identificada (suspeita: concorrência entre processos de teste). Se ocorrer, rodar 'npm test' novamente e registrar a saída completa.
