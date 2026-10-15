# Modelo — Políticas de agendamento (atraso, falta, remarcação e cancelamento)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Material de uso autorizado pela titular.

**Quando usar:** ao configurar o atendimento (secretária, fluxo automático ou agente de IA) e sempre que uma paciente avisar atraso, faltar, pedir para remarcar ou cancelar. Usado por `fluxo-whatsapp-automatico.md`, `agente-ia-atendimento.md` e `script-whatsapp.md`.

## Por que ter política escrita
A agenda da Doutora é o produto mais valioso da clínica. Quando a paciente percebe que o horário é reservado só para ela, ela valoriza, chega no horário e falta menos. Quando percebe que "a Doutora está sempre disponível", ela atrasa, desmarca em cima da hora e não dá importância à avaliação. A política protege a agenda **sem ser grosseira**: firme na regra, gentil no tom.

## Regras da clínica (preencher e aprovar com a Doutora)
| Regra | Valor |
|---|---|
| Tolerância de atraso | [10] minutos |
| Duração da avaliação/procedimento | [40] minutos |
| Antecedência para remarcar sem custo | [24] horas |
| Confirmação | véspera, até [18h] |
| Sem confirmação até [__] | o horário pode ser liberado para outra paciente (só se a clínica realmente fizer isso) |
| Falta sem aviso | próxima marcação somente com confirmação no dia anterior [e/ou sinal de R$ __, se a clínica adotar] |

Nunca citar uma regra que a clínica não aplica de verdade.

## Mensagens

### Ao agendar (já deixa a regra clara, com elegância)
> Prontinho, {{nome}}! Sua **avaliação personalizada com a [DRA.]** está reservada para **[dia] às [hora]**.
> 📍 [endereço]
> Esse horário fica **separado exclusivamente para você**, por isso pedimos que chegue com 5 minutinhos de antecedência. Se precisar remarcar, é só me avisar com pelo menos [24] horas, combinado? 💛

### Confirmação na véspera
> Oi, {{nome}}! Amanhã às [hora] é a sua avaliação com a [DRA.] na [CLÍNICA]. Posso confirmar sua presença?
> 1️⃣ Confirmo
> 2️⃣ Preciso remarcar

Confirmou:
> Perfeito! A Doutora te espera amanhã às [hora]. Até lá! 💛

### Princípio: você não pede, você informa
Responder atraso com "tá bom, tudo bem" tira autoridade e passa a mensagem de agenda vazia. A clínica que organiza a agenda passa a mensagem de agenda disputada, e a paciente respeita. Sem culpa, sem nervosismo, sem implorar. Respostas curtas, por situação:

| Situação | Resposta |
|---|---|
| Ainda dá tempo dentro do horário | "Perfeito, {{nome}}. Estamos aguardando você." |
| Chega dentro do horário reservado | "Seu horário está reservado até [hora]. Chegando até lá, conseguimos realizar o seu atendimento." |
| Perto de comprometer a agenda | "Entendi, {{nome}}. Nossa tolerância é de [20] minutos, para não comprometer o próximo atendimento. Chegando dentro desse período, mantemos o seu horário." |
| Já ultrapassou a tolerância | "{{nome}}, como o horário já foi impactado pela agenda seguinte, vamos reagendar para você ter um atendimento completo. Tenho [dia] às [hora] ou [dia] às [hora]." |

As mensagens mais longas abaixo servem para quem prefere um tom mais acolhedor; a regra é a mesma.

### "Vou me atrasar" — dentro da tolerância (até [10] min)
> Tudo bem, {{nome}}, obrigada por avisar! A Doutora consegue te receber, só que o atendimento vai até o horário que estava reservado para você, porque logo depois ela tem outra paciente. Assim que chegar, já te encaminhamos 💛

### "Vou me atrasar" — acima da tolerância
> {{nome}}, obrigada por avisar! Com esse tempo de atraso, a Doutora não conseguiria te atender com a atenção completa que a sua avaliação merece — o horário seguinte já está reservado para outra paciente.
> Para você não sair prejudicada, vamos remarcar? Tenho estes horários:
> 📅 [dia] às [hora]
> 📅 [dia] às [hora]

### Chegou atrasada sem avisar (mensagem da recepção, se houver tempo)
> {{nome}}, que bom que você chegou! Hoje a Doutora consegue te atender só até [horário final do seu horário], para não atrasar a próxima paciente. Se preferir uma avaliação completa, podemos remarcar sem problema. Como prefere?

### Pedido de remarcação com antecedência
> Claro, {{nome}}! Obrigada por avisar com antecedência, isso ajuda muito a organizar a agenda da Doutora. Tenho estes horários:
> 📅 [dia] às [hora]
> 📅 [dia] às [hora]

### Pedido de remarcação em cima da hora (menos de [24] h)
> Entendo, {{nome}}, imprevistos acontecem. Vou remarcar para você. Só te peço um carinho: como esse horário estava reservado só para você e agora fica difícil encaixar outra paciente, nas próximas vezes avise com pelo menos [24] horas, tá bom? Tenho estes horários: …

### Faltou sem avisar (no dia seguinte)
> Oi, {{nome}}! Sentimos sua falta ontem na sua avaliação com a [DRA.]. Aconteceu alguma coisa? Se quiser, consigo um novo horário para você. Para essa nova reserva, vou te pedir só uma confirmação na véspera, porque a agenda da Doutora está bem disputada 💛

(Usar "agenda disputada" somente se for verdade.)

### Segunda falta
> {{nome}}, queremos muito te atender, mas como houve duas ausências, para reservar um novo horário com a Doutora precisamos [da confirmação no dia anterior / do sinal de R$ __]. Assim esse horário fica realmente reservado para você. Posso seguir?

### Cancelamento
> Tudo bem, {{nome}}, obrigada por avisar. Quando quiser retomar, é só me chamar aqui que eu verifico a agenda da Doutora para você 💛
Kanban → **Venda perdida** (motivo: cancelou).

## Registro no CRM
- Atraso dentro da tolerância: anotação no contato.
- Remarcação: novo agendamento + anotação do motivo.
- Falta: Kanban **Não compareceu** + etiqueta `Faltou` (contar faltas).
- Cancelamento: **Venda perdida** com motivo.

## Tom
Sempre: agradecer o aviso, explicar o porquê (respeito ao tempo dela e das outras pacientes), oferecer duas opções concretas. Nunca: culpar, ironizar, ameaçar, cobrar multa que não existe.
