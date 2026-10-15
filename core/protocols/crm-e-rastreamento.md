# Protocolo — CRM e rastreamento

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Quando consultar:** ao registrar contatos, ligar contatos a campanhas, calcular resultados comerciais ou configurar rastreamento. Responsáveis: Atendimento (registro), Analista (uso dos dados), Suporte (integridade e LGPD).

## O que registrar por contato
Origem conhecida · campanha/conjunto/anúncio quando identificáveis · data de entrada · procedimento de interesse · etapa · histórico de etapas (automático) · agendamento · valor vendido · motivo de perda · próxima ação e data · consentimento e preferência de contato. Nada de dados de saúde.

## Etapas
Novo contato → Em atendimento → Qualificado → Agendado → Compareceu → Venda concluída.
Alternativas: Sem resposta, Sem interesse, Não compareceu, Venda perdida.
Regras do sistema: venda exige valor; etapa inexistente é recusada; perdas sem motivo ficam como "não informado".

## Origem e atribuição
| Evidência | Registro |
|---|---|
| Pessoa chegou pelo botão do anúncio (mensagem de origem do anúncio no WhatsApp) | origem `anuncio` + campanha |
| Pessoa disse que viu o anúncio | origem `anuncio` + campanha (anotar "declarado") |
| Veio pelo perfil sem anúncio | `instagram_organico` |
| Indicação / retorno | `indicacao` / `retorno` |
| Sem informação | `desconhecida` |
Não atribuir venda a anúncio sem evidência suficiente. UTMs são usadas quando houver link de site; no funil WhatsApp, a referência é a mensagem/origem do anúncio.

## Pixel e API de Conversões
Não exigir Pixel quando o funil não usa site. Envio de eventos offline/conversões à Meta (ex.: agendamento, venda) **não está implementado**; avaliar no futuro via API de Conversões com base legal e minimização de dados.

## Uso dos dados
Funil por campanha (`funilCrm`) alimenta o monitoramento e o relatório semanal, sempre com origem "Clínica".

## Retenção e exclusão
Ver `.agents/rules/seguranca.md` (minimização, revisão semestral, exclusão a pedido com confirmação).

## Erros a evitar
Planilhas paralelas sem atualizar o sistema; contato sem etapa; venda sem valor; registrar diagnóstico ou queixa de saúde.
