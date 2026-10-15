# Briefing para a clínica preencher (enviar por WhatsApp ou e-mail)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Quando usar:** antes de configurar o fluxo de WhatsApp, o CRM, o agente de IA e as campanhas de uma clínica nova. As respostas são cadastradas no sistema (questionários `clinica`, `publico`, `campanha`, `atendimento`, `meta`) e usadas nos textos — nada é inventado. O que a clínica não souber fica em branco e vira pendência.

**Como enviar:** copie o texto abaixo (a partir de "Oi, Doutora") e mande para a clínica. Pode ser respondido por áudio; quem configura transcreve e cadastra.

---

Oi, Doutora! Para eu deixar o seu atendimento e os seus anúncios do jeitinho da sua clínica, preciso que você (ou a sua secretária) me responda estas perguntas. Pode responder por áudio, do seu jeito. O que não souber, deixe em branco. 💛

**1. A clínica**
1. Nome da clínica, como as pacientes conhecem.
2. Endereço completo e link do Google Maps.
3. Até que distância (ou de quais bairros e cidades) suas pacientes costumam vir?
4. Dias e horários de atendimento.
5. Quem responde o WhatsApp hoje? Em quanto tempo, mais ou menos, a primeira mensagem é respondida?

**2. A Doutora**
6. Sua formação e registro profissional (médica, biomédica, dentista, outra).
7. Há quanto tempo você trabalha com estética?
8. O que você faz de diferente das outras clínicas, de verdade? (Ex.: tempo dedicado, cuidado no pós, técnica de aplicação, acompanhamento.)

**3. Procedimentos**
9. Quais procedimentos você oferece?
10. Quais você quer vender mais agora? (Ex.: toxina botulínica, tratamentos da região dos olhos — diga exatamente quais.)
11. Valor real de cada um desses e se tem parcelamento ou pacote.
12. Quanto tempo dura cada atendimento e quantas sessões costuma precisar?

**4. O primeiro atendimento**
13. Vocês chamam de "consulta" ou "avaliação"?
14. É pago? Quanto? O valor é abatido se a paciente fizer o procedimento?
15. Quanto tempo dura e o que acontece nele? (Conversa, análise, plano de tratamento, fotos…)

**5. Agenda**
16. Quais dias e horários ficam livres para primeiros atendimentos?
17. Quantas pacientes novas você consegue atender por semana?
18. A agenda fica em algum sistema (Google Agenda, sistema da clínica, caderno)?

**6. Regras da agenda**
19. Quantos minutos de tolerância para atraso?
20. Com quanta antecedência a paciente precisa avisar para remarcar?
21. Vocês confirmam na véspera? Até que horas?
22. Cobram sinal para agendar ou depois de uma falta?

**7. Como vocês atendem hoje** (essa parte é a mais importante)
23. Cole aqui, ou mande print, de como vocês respondem a primeira mensagem de uma pessoa nova.
24. Quando perguntam "quanto custa?", o que vocês respondem?
25. Quais são as 5 perguntas que mais chegam no WhatsApp?
26. Quais dúvidas ou medos aparecem antes de agendar? (Dor, ficar artificial, preço, opinião do marido…)
27. Por que algumas pessoas desistem?
28. Existe alguma frase ou jeito de explicar que costuma fazer a paciente agendar?
29. De cada 10 pessoas que chamam no WhatsApp, mais ou menos quantas agendam? Quantas comparecem? Quantas fecham?

**8. Suas pacientes**
30. Faixa de idade de quem mais faz os procedimentos.
31. O que elas dizem que querem? (Use as palavras delas.)
32. O que elas mais valorizam? (Naturalidade, segurança, rapidez, preço, atendimento…)

**9. Respostas que só a Doutora pode aprovar** (para o atendimento e a IA usarem sem errar)
33. Como responder sobre dor e anestesia.
34. Tempo de recuperação e cuidados antes e depois.
35. Quanto tempo o resultado costuma durar.
36. Quem não pode fazer (contraindicações gerais).

**10. Imagens e redes**
37. Tem fotos e vídeos seus e da clínica para os anúncios? Mande ou indique uma pasta.
38. Tem fotos de pacientes **com autorização por escrito** para uso em divulgação?
39. Algum post ou vídeo do Instagram que foi muito bem? Mande o link.

**11. Facebook e Instagram**
40. A clínica tem página no Facebook? O Instagram é profissional e está ligado à página?
41. Já tem Gerenciador de Anúncios com cartão ou Pix cadastrado?
42. O WhatsApp Business da clínica está conectado à página do Facebook?
43. Quanto você quer investir em anúncios por dia ou por mês?

Obrigada, Doutora! Com isso eu monto tudo e te mostro antes de colocar no ar. 💛

---

## Onde cada resposta entra no sistema
| Perguntas | Cadastro |
|---|---|
| 1–5, 6–12, 16–17 | questionário `clinica` |
| 13–15, 19–24 | questionário `atendimento` (13 → `nome_atendimento`) e `core/templates/politicas-agendamento.md` |
| 25–32 | questionário `publico` (objeções, desejos, linguagem) |
| 33–36 | `atendimento.respostas_validadas` + `clinica.informacoes_validadas` |
| 37–39 | questionário `criativo` |
| 40–43 | questionário `meta` e orçamento em `clinica` |
| 23, 24, 28, 29 | base para ajustar o fluxo automático e o agente de IA (`fluxo-whatsapp-automatico.md`, `agente-ia-atendimento.md`) e para comparar resultados antes × depois |
