# Questionário da clínica (D1 — Direção)

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.

**Quando usar:** No primeiro uso e sempre que um objetivo precisar de um dado ainda não cadastrado. Responsável: Entrada.

## Como conduzir
- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.
- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).
- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".
- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).
- Resposta que pareça token ou senha é recusada.

## Perguntas

| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |
|---|---|---|---|---|---|---|
| `nome_comercial` | Qual é o nome da sua clínica, do jeito que as clientes conhecem? | texto | — | sim | whatsapp, seguidores, reconhecimento, criativo, modelar, monitorar, otimizar, treinar, metodo, crm |  |
| `unidade` | Tem mais de uma unidade? Se sim, qual é esta? | texto | — | não | — | Se for só uma, deixe em branco. |
| `cidade_uf` | Em qual cidade e estado fica a clínica? | texto | — | sim | whatsapp, seguidores, reconhecimento | Ex.: Campinas/SP |
| `endereco` | Qual é o endereço da clínica (rua e bairro)? | texto | — | sim | — | Usado só para definir a área do anúncio. Não aparece no anúncio. |
| `mapa_link` | Cole o link do Google Maps da sua clínica. | mapa | — | sim | whatsapp, seguidores, reconhecimento | Abra o Google Maps, procure a clínica, toque em Compartilhar e cole o link aqui. Usamos para marcar o ponto central do anúncio. |
| `instagram` | Qual é o @ do Instagram da clínica? | texto | — | sim | seguidores, reconhecimento |  |
| `whatsapp` | Qual é o WhatsApp comercial que vai receber as clientes? | telefone | — | sim | whatsapp | Com DDD. Ex.: (19) 99999-0000 |
| `site` | Tem site? Cole o endereço. | texto | — | não | — |  |
| `crm` | Onde vocês anotam os contatos e agendamentos hoje? | opcao | Caderno ou agenda de papel · Planilha · Sistema de agenda da clínica · Só no WhatsApp · Vou usar o CRM deste sistema | sim | — |  |
| `pasta_criativos` | Tem uma pasta com fotos e vídeos da clínica? Cole o link. | texto | — | não | — |  |
| `cidades_atendidas` | Quais cidades suas clientes costumam vir? | lista | — | sim | — | Separe por vírgula. |
| `bairros_atendidos` | Algum bairro em especial que vocês querem atingir? | lista | — | não | — |  |
| `raio_km` | Até quantos quilômetros da clínica uma cliente costuma vir? | opcao | 3 · 5 · 8 · 10 · 15 · 20 · 30 | sim | whatsapp, seguidores, reconhecimento | Em capital, raios menores costumam funcionar. No interior, inclua cidades vizinhas. Você pode mudar depois. |
| `local_atendimento` | Vocês atendem só na clínica? | opcao | Só na clínica · Na clínica e em domicílio · Em mais de um endereço | sim | — |  |
| `regioes_excluir` | Tem alguma região que NÃO deve receber o anúncio? | lista | — | não | — |  |
| `procedimentos` | Quais procedimentos vocês oferecem? | lista | — | sim | — |  |
| `procedimentos_prioritarios` | Quais procedimentos você quer vender mais agora? | lista | — | sim | whatsapp, seguidores, criativo, modelar, treinar, metodo |  |
| `precos` | Qual é o preço real de cada procedimento prioritário? | texto | — | sim | whatsapp | Ex.: Botox R$ 1.200; Limpeza de pele R$ 180. Use o preço que vocês cobram de verdade. |
| `condicoes_comerciais` | Existe alguma condição comercial real hoje (parcelamento, pacote, avaliação)? | texto | — | não | — |  |
| `diferenciais` | O que a sua clínica faz de diferente, de verdade, nesses procedimentos? | texto | — | sim | whatsapp, seguidores, reconhecimento, criativo, modelar, treinar, metodo | Algo que vocês realmente fazem: uma etapa de avaliação, um cuidado no pós, o tempo dedicado. Não precisa ser exclusivo. |
| `capacidade_semana` | Quantas clientes novas vocês conseguem atender por semana? | numero | — | sim | whatsapp, otimizar |  |
| `profissionais` | Quem realiza os procedimentos? (nome e formação) | texto | — | sim | reconhecimento |  |
| `informacoes_validadas` | A profissional responsável já validou as informações sobre dor, recuperação, duração e riscos que podemos usar? | opcao | Sim, já validou · Ainda não | sim | whatsapp, criativo, treinar, metodo | Sem essa validação, o sistema não usa nenhuma afirmação clínica nos anúncios nem no atendimento. |
| `orcamento_diario` | Quanto você quer investir por dia em anúncios? (R$) | moeda | — | sim | whatsapp, seguidores, reconhecimento, otimizar |  |
| `limite_mensal` | Qual é o limite máximo por mês? (R$) | moeda | — | sim | whatsapp, seguidores, reconhecimento, otimizar |  |
| `horario_funcionamento` | Qual é o horário de atendimento? | texto | — | sim | treinar | Ex.: seg a sex 9h–19h, sáb 9h–13h |
| `quem_responde` | Quem responde o WhatsApp? | opcao | Eu mesma · Secretária/recepção · Mais de uma pessoa · Atendimento automático + pessoa | sim | whatsapp, treinar |  |
| `tempo_resposta` | Em quanto tempo vocês costumam responder uma mensagem nova? | opcao | Até 5 minutos · Até 30 minutos · Até 2 horas · No mesmo dia · Não sei | não | — |  |
| `vendas_periodo` | Quantos procedimentos vocês vendem por mês, mais ou menos? | texto | — | não | — | Se não souber, deixe em branco. Não vamos inventar. |

## Como interpretar as respostas
- Preços, condições e diferenciais são usados literalmente nos textos: nunca completar com suposições.
- Sem `informacoes_validadas = "Sim, já validou"`, nenhuma afirmação clínica é usada em anúncio ou atendimento.
- `capacidade_semana` limita a escala: sem agenda, não se recomenda aumentar procura.
- `orcamento_diario` × 30,4 não pode passar de `limite_mensal` (o plano de campanha bloqueia).
- `mapa_link` é convertido em coordenadas para o raio do anúncio; se não houver coordenadas, a tela pede o link completo.

## Registro e próximo passo
- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> clinica <campo> "<valor>"`.
- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.
- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.
