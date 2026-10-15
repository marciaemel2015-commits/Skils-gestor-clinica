# Modelo — Fluxo automático de WhatsApp (entrada, qualificação e passagem para agendamento)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Material de uso autorizado pela titular.

**Quando usar:** ao configurar o CRM/automação de WhatsApp da clínica (construtor de fluxo nativo, sem IA) para receber os contatos que chegam pelos anúncios de WhatsApp. Responsável: Atendimento. Complementa `core/templates/script-whatsapp.md` (atendimento humano) e `core/protocols/whatsapp-conversao.md`.

## Princípios de conversão deste fluxo
1. **Nome do primeiro atendimento: decidir com a Doutora e usar sempre o mesmo.** Duas escolas:
   - **"Consulta"** — posiciona como atendimento completo, com tempo dedicado e plano individual; tende a valorizar mais, principalmente quando é **paga** e conduzida pela profissional habilitada.
   - **"Avaliação personalizada"** — funciona quando a clínica quer reduzir barreira de entrada; o risco é soar como "orçamento rápido e de graça".
   O que mais pesa não é a palavra, é o que vem junto: duração real ("a Doutora dedica [__] minutos só para você"), o que a pessoa leva (plano de cuidado individual) e se é paga. A escolha fica em `atendimento.nome_atendimento` e muda os botões do anúncio. Neste modelo, onde está escrito "avaliação", trocar pela palavra escolhida.
2. **Quem conduz é a clínica.** O robô não pergunta "quando você pode?" de forma aberta. Ele diz que a equipe vai **verificar a agenda da Doutora**. A secretária oferece **duas opções concretas** de horário — ou, no máximo, uma escolha entre duas alternativas ("prefere manhã ou tarde?", "durante a semana ou no sábado?"), que também mantém a condução com a clínica.
3. **Poucas perguntas.** No máximo 3 antes de passar para a equipe. Cada pergunta a mais perde gente.
4. **A pessoa fala, a clínica escuta.** Pergunta aberta sobre o que ela deseja, sem nunca apontar defeito ou dar diagnóstico.
5. **Verdade sempre.** "Gratuita" só se for gratuita; "vagas limitadas" só se for real; nada de prometer resultado ou dizer que "não dói".
6. **Humano no momento certo.** O fluxo qualifica; o agendamento é fechado pela secretária, que vê a agenda real.

## Antes de montar — preencher com a clínica
| Campo | Valor |
|---|---|
| Nome da clínica | [CLÍNICA] |
| Nome da Doutora | [DRA.] (ex.: Dra. Márcia) |
| Procedimentos (até 4 no menu) | [PROC 1], [PROC 2], [PROC 3], [PROC 4] |
| Avaliação | gratuita / paga (R$ ___) / abatida no procedimento |
| Duração da avaliação | ___ minutos |
| Horário de atendimento humano | ___ |
| Endereço/bairro | ___ |

## Estrutura do funil (Kanban) — etapas do método
Novo contato → Em atendimento → Qualificado → Agendado → Compareceu → Venda concluída · Sem resposta · Sem interesse · Não compareceu · Venda perdida.
Etiquetas sugeridas: `Lead anúncio`, `[PROC]` (uma por procedimento), `Já é paciente`, `Fora da área`, `Pediu valor`.

## Fluxo bloco a bloco

> Em conexões por QR code, prefira o bloco **Menu** (opções numeradas em texto). Botões e listas podem não aparecer no celular da cliente — só use se testar e funcionar.

### Bloco 1 — Início (gatilho: frase da mensagem pronta do anúncio)
Cada anúncio de WhatsApp publicado pelo sistema leva uma **mensagem pronta** que já aparece digitada para a cliente ao clicar (padrão: "Olá! Vi o anúncio e quero saber mais sobre a avaliação de [procedimento]."; ela pode ser editada na tela do texto do anúncio e aparece no resumo da campanha).
- No CRM, cadastre essa frase (ou o trecho "quero saber mais sobre a avaliação de [procedimento]") como **gatilho/frase** que inicia este fluxo.
- Uma frase diferente por procedimento = o fluxo já sabe o interesse (dá para pular o Bloco 4) e a etiqueta de origem fica certa.
- A cliente pode apagar ou mudar a frase antes de enviar: mantenha também um fluxo padrão para "primeira mensagem de contato novo".
Ação: etiqueta `Lead anúncio` + etiqueta do procedimento, cartão no Kanban em **Novo contato**.

### Bloco 2 — Boas-vindas (Conteúdo)
> Oi! Que alegria receber sua mensagem 💛
> Aqui é da **[CLÍNICA]**, clínica da **[DRA.]**.
> Vou te fazer só 3 perguntinhas rápidas para a Doutora já chegar na sua avaliação sabendo o que é importante para você, combinado?

### Bloco 3 — Nome (Pergunta → salva em Nome do contato)
> Primeiro, como posso te chamar?

### Bloco 4 — Interesse (Menu → etiqueta do procedimento)
> Prazer, {{nome}}! 😊 Sobre o que você gostaria de saber?
> 1️⃣ [PROC 1]
> 2️⃣ [PROC 2]
> 3️⃣ [PROC 3]
> 4️⃣ Ainda não sei, quero uma orientação da Doutora

Cada opção: etiqueta do procedimento. Opção 4: etiqueta `Orientação`.
Resposta inválida (Condição): "Me responde só com o número da opção, por favor 😊" e repete o menu (no máximo 2 vezes; depois passa para a equipe).

### Bloco 5 — O que ela deseja (Pergunta aberta → salva em campo "Objetivo")
> Que ótimo. Me conta em poucas palavras: o que você gostaria de cuidar ou melhorar? Pode escrever do seu jeito 💬

(Nunca responder com diagnóstico ou promessa. Apenas registrar.)

### Bloco 6 — Primeira vez? (Menu → campo "Já fez antes")
> E você já fez algum procedimento estético antes?
> 1️⃣ Sim
> 2️⃣ Não, seria a primeira vez

### Bloco 7 — Valor da avaliação e passagem para a agenda (Conteúdo) → Kanban **Qualificado**
Versão avaliação **gratuita**:
> Perfeito, {{nome}}! Aqui na [CLÍNICA] nenhum procedimento é indicado sem antes a **[DRA.] avaliar você pessoalmente**. Cada pessoa é única, e é nessa **avaliação personalizada** que ela te orienta sobre o que realmente faz sentido para você.
> A avaliação é **sem custo** e dura cerca de [__] minutos.
> Vou verificar agora a **agenda da Doutora** e já te trago os horários disponíveis para reservarmos a sua avaliação. Só um instante 🗓️

Versão avaliação **paga/abatida**:
> Perfeito, {{nome}}! Aqui na [CLÍNICA] nenhum procedimento é indicado sem antes a **[DRA.] avaliar você pessoalmente**. É nessa **avaliação personalizada** que ela analisa o seu caso e te orienta sobre o melhor caminho para você.
> O valor da avaliação é R$ [__] [e é abatido se você fizer o procedimento].
> Vou verificar agora a **agenda da Doutora** e já te trago os horários disponíveis para reservarmos a sua avaliação. Só um instante 🗓️

Ação: **Passar para atendente** (fila Agendamento/Vendas). Cartão no Kanban em **Qualificado**.

### Bloco 8 — Fora do horário (Condição por horário, antes do Bloco 7)
> Recebi tudo, {{nome}}! Nossa equipe está fora do horário agora, mas amanhã cedo eu verifico a agenda da Doutora e te trago os horários disponíveis para a sua avaliação. Pode deixar que eu te chamo aqui 💛

### Bloco 9 — Opção "Já sou paciente" (se a clínica quiser no menu)
Etiqueta `Já é paciente` → passar direto para atendente:
> Que bom te ver por aqui de novo! Já chamei a nossa equipe para te atender 💛

## Desvios comuns

**Pessoa pergunta o preço do procedimento (palavras: valor, preço, quanto, custa)** — Condição → etiqueta `Pediu valor`:
> Entendo, {{nome}}! O valor depende do que a Doutora indicar para você na avaliação, porque cada caso é individual — e a gente não quer que você pague por algo que não seja o ideal para você. Na avaliação você já sai sabendo exatamente o que fazer e quanto investir. Posso verificar um horário na agenda da Doutora para você?
(Se a clínica divulga preço real, a secretária pode informar a faixa. Nunca inventar.)

**Pessoa pergunta se dói, quanto tempo dura, se é seguro** — não responder pelo robô:
> Ótima pergunta! Isso a [DRA.] te explica direitinho na avaliação, olhando o seu caso. Quer que eu veja um horário para você?

## Sequência de reativação (sem resposta)
| Quando | Mensagem |
|---|---|
| 2 h sem responder durante o fluxo | "{{nome}}, ficou alguma dúvida? Estou aqui para te ajudar a reservar sua avaliação com a [DRA.] 😊" |
| 24 h depois | "Oi, {{nome}}! Passando para saber se ainda quer conhecer o [PROC] com a [DRA.]. Se quiser, já vejo os horários desta semana para você." |
| Sem resposta após a 2ª | Kanban → **Sem resposta**. Parar de enviar. |

Nunca mais de 2 mensagens de retomada; respeitar quem pedir para não receber.

## Roteiro da secretária ao assumir (depois do Bloco 7)
1. Ler o que a pessoa respondeu (procedimento, objetivo, primeira vez).
2. Abrir a agenda real.
3. Enviar **duas opções**:
> {{nome}}, verifiquei a agenda da Dra. [__] e tenho estes horários para a sua avaliação:
> 📅 [dia] às [hora]
> 📅 [dia] às [hora]
> Qual fica melhor para você?
4. Confirmou → Kanban **Agendado** + criar o agendamento no CRM.
5. Mensagem de confirmação imediata:
> Prontinho, {{nome}}! Sua **avaliação personalizada com a [DRA.]** está reservada para [dia] às [hora]. 📍 [endereço]. Esse horário fica separado só para você — se precisar remarcar, me avise com antecedência, combinado? 💛
6. Véspera (Agendamentos/lembrete):
> Oi, {{nome}}! Amanhã às [hora] é a sua avaliação com a [DRA.] na [CLÍNICA]. Posso confirmar sua presença? Responda 1 para confirmar ou 2 para remarcar.
7. Depois da avaliação: Kanban **Compareceu** → **Venda concluída** (com valor) ou **Venda perdida** (com motivo).
8. Atraso, falta, remarcação e cancelamento: usar as mensagens de `core/templates/politicas-agendamento.md` (tolerância de atraso, remarcação acima da tolerância, confirmação após falta).

## Checklist de publicação do fluxo
- [ ] Textos com os dados reais da clínica (nenhum colchete restante)
- [ ] "Gratuita" usada só se for verdade
- [ ] Testado no simulador do construtor e com um celular de teste
- [ ] Menu funcionando com números; resposta inválida tratada
- [ ] Fora do horário configurado
- [ ] Passagem para a fila certa e notificação para a secretária
- [ ] Etiquetas e etapas do Kanban sendo aplicadas
- [ ] Reativação com no máximo 2 mensagens
- [ ] Conexão do WhatsApp conectada e plano de reconexão combinado (conexão por QR code pode cair; as mensagens continuam chegando no celular)

## Quando ligar IA (futuro)
Agente pronto para colar: `core/templates/agente-ia-atendimento.md`. O mesmo conteúdo vira instrução do agente: princípios acima, regras de `.agents/rules/copy-e-criativos.md` e `atendimento-e-crm.md`, e respostas clínicas somente as aprovadas pela profissional. O custo de uso da IA é da clínica.
