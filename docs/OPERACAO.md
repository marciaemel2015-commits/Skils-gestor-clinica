# Operação diária

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

## Rotina sugerida
| Quando | O quê | Onde |
|---|---|---|
| Todo dia (5 min) | Registrar/atualizar contatos do dia no CRM (etapa e próxima ação) | Retomar contatos (CRM) |
| Todo dia | Conferir "Onde paramos" e monitoramentos vencidos | Tela inicial |
| Na data marcada (D+3 e depois a cada 3 dias) | Monitorar agora → responder perguntas → registrar decisão | Quero monitorar campanhas |
| Semanal (segunda) | Gerar relatório semanal; ler 5 conversas; uma decisão por campanha | Monitorar › Gerar relatório semanal |
| Semanal | Trazer uma referência nova da Biblioteca de Anúncios ou um vídeo orgânico que foi bem | Quero modelar um anúncio |
| Quinzenal | Simulação de atendimento com a equipe | Quero treinar minha equipe |
| Mensal | Rever orçamento e limite mensal; rever metas de custo por seguidor | Editar cadastro |
| Semestral | Revisar retenção do CRM (excluir o desnecessário) | CRM |

## Primeira campanha — passo a passo
1. "Quero clientes no WhatsApp" (ou outro objetivo).
2. Responder as perguntas (uma por vez; "Voltar e editar" corrige).
3. Escolher ou adicionar o criativo (imagem ou ID de post).
4. Escolher uma das 4 copies, editar, "Verificar conformidade".
5. "Revisar campanha" → ler o resumo; resolver as pendências listadas.
6. Conferir `core/templates/checklist-publicacao.md`.
7. Marcar "Revisei e autorizo", digitar PUBLICAR, "Publicar campanha".
8. Ler o resultado real (programada / em revisão / erro) e a data do próximo monitoramento.
9. Avisar a equipe e começar a registrar os contatos no CRM com a campanha.

## Monitoramento
Ver `core/protocols/monitoramento.md`. Sem a Meta conectada, o monitoramento usa só o CRM e avisa.

## CRM
Cada conversa nova vira contato (primeiro nome, procedimento, origem, campanha se souber). Atualizar a etapa a cada avanço. Venda exige valor. Perda: registrar motivo.

## Criativos
"Quero criar um criativo": prompt de imagem, roteiro de vídeo, análise de peça, salvar na biblioteca. "Criar nome de método": 10+ nomes com copy, roteiro e ressalvas.

## Registro de sessão
Ao terminar o dia de trabalho: "Registrar resumo desta sessão" (o que foi pedido, decisões, ações, pendências, próximo passo).

## Backup
- Semanal: copiar a pasta `data/` para um local protegido (pasta com senha/BitLocker, ou nuvem com acesso restrito), nomeando com a data (ex.: `backup-data-2026-10-20`).
- Guardar no máximo as últimas 8 cópias; apagar as antigas com segurança.
- Restaurar: fechar o sistema, substituir `data/` pela cópia, iniciar, reconectar a Meta se for outro computador.

## Uso com assistente de IA (conversa)
O assistente segue `AGENTS.md`: começa com `node app/cli.js retomada <clinica>`, pergunta só o que falta, grava pela CLI e encerra com o resumo de sessão. Publicar e conectar a Meta são sempre pela interface.
