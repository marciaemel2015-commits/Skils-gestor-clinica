# Histórico de versões — Método Clínica de Estética 6D

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

## 1.4.0 — 15/10/2026
- Anúncios de WhatsApp com 3 botões fixos (ice breakers) como gatilhos do CRM: "Quero agendar minha [consulta/avaliação]", "Como funciona a [consulta/avaliação]?", "Quero saber mais sobre o procedimento" — editáveis, validados e com triagem. Mensagem já digitada continua como alternativa.
- Nova pergunta `atendimento.nome_atendimento` (Consulta ou Avaliação), usada nos botões.
- Atraso no modo "você não pede, você informa" (políticas); regra dos 3 elogios genuínos (treinamento); decisão consulta × avaliação documentada no fluxo.
- Novo `core/forms/briefing-para-clinica.md`: 43 perguntas para a clínica preencher antes da configuração.

## 1.3.0 — 14/10/2026
- Mensagem pronta nos anúncios de WhatsApp (`page_welcome_message` / `autofill_message`): frase padrão por procedimento, editável na tela do texto, exibida no resumo e usada como gatilho do fluxo no CRM. Passa pela triagem de conformidade. 74 testes.

## 1.2.2 — 14/10/2026
- Novo `core/templates/politicas-agendamento.md`: tolerância de atraso, remarcação acima da tolerância, confirmação, falta, segunda falta, cancelamento — firme na regra, gentil no tom.
- Novo `core/templates/agente-ia-atendimento.md`: agente de IA pronto para colar (instruções, ferramentas a ligar, documentos da base de conhecimento, testes). Chave da OpenAI é da clínica e colada por ela no painel.

## 1.2.1 — 14/10/2026
- Novo modelo `core/templates/fluxo-whatsapp-automatico.md`: fluxo nativo (sem IA) de entrada e qualificação para CRM com construtor de fluxo — avaliação personalizada (não consulta), a clínica conduz a agenda, 3 perguntas, passagem para a secretária com duas opções de horário, desvios (preço, dúvidas clínicas), reativação e confirmação.

## 1.2.0 — 14/10/2026
- Assistente da Meta completo em dois caminhos. Caminho 2 começa verificando perfil pessoal e acesso de administradora; cada etapa tem "Já fiz esta etapa" e, com a Meta conectada, "Verificar agora pela API".
- Caminho 1 lista páginas, Instagram vinculado, portfólios, contas com status traduzido (fuso e moeda), pagamento (sempre com orientação de confirmar na Central de Cobrança) e WhatsApp da página; consultas que falham individualmente ficam "conferir" sem derrubar as demais.
- Erros da Meta sempre devolvidos como falha externa (502), sem confundir com a sessão do sistema.
- Atalho `INICIAR.bat` (dois cliques). 73 testes.

## 1.1.0 — 14/10/2026
- Ponto de partida da Meta: pergunta se a clínica já anuncia; se não, passo a passo (com links oficiais) só do que falta — página, Instagram profissional, portfólio empresarial/BM, conta de anúncios, pagamento, WhatsApp.
- Botão "Conferir tudo": verificação real pela API desses ativos (itens não legíveis aparecem como "conferir").
- Novo questionário `core/forms/questionario-meta.md`. 66 testes.

## 1.0.0 — 14/10/2026
- Primeira versão do sistema autossuficiente: método documentado (D1–D6), seis agentes, 11 protocolos, 5 questionários, 8 modelos.
- Interface local interativa (objetivos em botões, uma pergunta por vez, progresso, voltar/editar, revisão, confirmação explícita com a palavra PUBLICAR).
- Persistência por clínica com gravação conferida e histórico de auditoria.
- Cofre de credenciais (Windows DPAPI / AES-256-GCM).
- Integração com a Marketing API v26.0: OAuth, permissões, seleção de conta/página, criação validada (validate_only) e pausada, ativação após confirmação, status real, métricas.
- Programação para 00:00 do dia seguinte no fuso da conta de anúncios.
- Triagem automática de conformidade, diagnóstico de funil, classificação de criativos, custo por seguidor com metas configuráveis.
- CRM com etapas, motivos de perda, consentimento e exclusão a pedido (LGPD).
- 57 testes automatizados (mocks identificados como SIMULAÇÃO).

Como registrar mudanças futuras: nova seção com versão (semver), data, o que mudou e quem aprovou. Alterações de método exigem aprovação da titular.
