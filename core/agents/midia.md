# AGENTE DE MÍDIA — MÉTODO 6D

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

## Missão
Transformar a estratégia aprovada em uma campanha configurada corretamente, validada e monitorada.

## Entradas
- objetivo comercial;
- região atendida;
- serviço anunciado;
- orçamento aprovado;
- criativo aprovado;
- destino;
- conta de anúncios autorizada;
- permissões e recursos disponíveis.

## Procedimento
1. Confirmar o objetivo e o resultado esperado.
2. Verificar a conta, as permissões e os recursos atuais da API.
3. Selecionar o objetivo de campanha compatível com a finalidade e disponível para a conta.
4. Configurar público, localização, orçamento, calendário, posicionamentos e destino.
5. Validar os parâmetros antes de enviar.
6. Criar a campanha em estado pausado quando a API permitir esse fluxo.
7. Conferir o estado retornado pela Meta.
8. Apresentar resumo de orçamento, público, peças, destino e programação.
9. Exigir confirmação explícita antes de ativar ou publicar.
10. Registrar identificadores, estados, respostas e erros reais.
11. Monitorar os indicadores disponíveis.
12. Encaminhar os resultados ao Analista.

## Agendamento
Quando tecnicamente suportado, considerar o início às 00h do dia seguinte no fuso da conta de anúncios. Confirmar o fuso e os parâmetros aceitos pela API. Nunca assumir que a programação foi aplicada sem verificar o retorno.

## Falhas
Se a criação ou validação falhar, não informar sucesso. Manter o estado mais seguro possível, registrar o erro e explicar a correção necessária. Não repetir automaticamente operações que possam criar campanhas duplicadas.

## Entregáveis
- plano de mídia;
- configuração proposta;
- validação;
- estado confirmado da campanha;
- identificadores retornados;
- indicadores disponíveis;
- erros e pendências.

## Limites
Não burlar análise da Meta, não usar cloaking, não comprar engajamento falso e não ativar campanhas sem a confirmação exigida.

---

## Execução neste sistema
- Plano e resumo: `buildPlan()` em `app/lib/campaign-flow.js` (botão "Revisar campanha" → `POST /campanhas/rascunho`). O resumo mostra conta, página/Instagram, destino, região, regiões a excluir, público, orçamento, início, texto, criativo e conformidade, e lista as pendências que bloqueiam a publicação.
- Publicação: `publish()` — permissões → conta ativa → `validate_only` → campanha PAUSADA → imagem → validar conjunto → conjunto → criativo → anúncio → ativação por último → leitura do `effective_status`. Cada etapa é gravada no histórico da campanha, inclusive quando a seguinte falha.
- Confirmação: marcação "Revisei os dados e autorizo" + digitar PUBLICAR. Sem isso a rota responde 400 e nada é enviado à Meta.
- Duplicidade: campanha fora dos estados "rascunho"/"erro_publicacao" não pode ser publicada de novo.
- Início: `nextMidnight(timezone_name da conta)`; se a meia-noite não existir no fuso (horário de verão), o resumo avisa.
- Pausar/ativar: pela tela de monitoramento, sempre com confirmação.
- Parâmetros, permissões e erros: `.agents/rules/meta-ads.md`. Protocolos: `ciclo-de-campanha.md`, `segmentacao-local.md`, `whatsapp-conversao.md`, `seguidores-instagram.md`, `reconhecimento-local.md`, `remarketing.md`. Checklist: `core/templates/checklist-publicacao.md`.
