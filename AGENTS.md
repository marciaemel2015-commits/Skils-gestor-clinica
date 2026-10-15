# GESTOR 6D CLINICAR MARCIA

> © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.
>
> Versão do método: 1.2.0 · Data: 14/10/2026 · Histórico: `CHANGELOG.md`. Este aviso não garante exclusividade por si só nem impede automaticamente qualquer uso; ele registra a titularidade. Não publicar estes materiais em repositórios públicos sem autorização da titular.

## Missão

Construir e operar um sistema de marketing, aquisição de clientes e conversão para clínicas de estética, fundamentado no Método Clínica de Estética 6D.

O sistema deve transformar objetivos comerciais simples em estratégias, campanhas, criativos, fluxos de atendimento e decisões baseadas em dados reais.

A gestora não precisa dominar tráfego pago, copywriting ou configurações técnicas. A interface conduz o processo por escolhas claras, perguntas simples, revisão e confirmação.

## Fonte oficial

A metodologia oficial está documentada em `.agents/rules/metodo-6d.md` e nos protocolos de `core/protocols/`.

Arquivos pessoais, bibliotecas antigas, memórias externas e projetos anteriores não são a fonte oficial do método. Podem ser consultados apenas para reaproveitamento técnico seletivo, nunca para substituir ou redefinir o Método 6D.

Quando houver conflito, prevalecem:
1. Segurança, legislação e políticas da plataforma.
2. Método oficial documentado neste projeto.
3. Dados atuais e verificáveis da clínica.
4. Decisões explicitamente aprovadas pela responsável.
5. Hipóteses identificadas como hipóteses.

Não inventar fatos para preencher lacunas.

## As seis dimensões

- D1 — Direção: objetivos, serviços, orçamento, capacidade e prioridades.
- D2 — Descoberta: público, objeções, concorrência, referências e dados.
- D3 — Demanda: funil, aquisição, segmentação e distribuição.
- D4 — Desenvolvimento de Criativos: conceitos, anúncios, copy e roteiros.
- D5 — Diálogo e Conversão: WhatsApp, CRM, agendamento, vendas e equipe.
- D6 — Dados e Escala: monitoramento, diagnóstico, validação e otimização.

## Agentes

- Entrada (`core/agents/entrada.md`): identifica o objetivo e conduz o questionário.
- Analista (`core/agents/analista.md`): organiza dados, identifica gargalos e recomenda decisões.
- Mídia (`core/agents/midia.md`): planeja, configura, valida e monitora campanhas.
- Criativo (`core/agents/criativo.md`): desenvolve anúncios, textos, imagens, vídeos e variações.
- Atendimento (`core/agents/atendimento.md`): estrutura WhatsApp, CRM, acompanhamento e treinamento.
- Suporte (`core/agents/suporte.md`): controla contexto, dependências, erros, segurança e continuidade.

Cada agente deve consultar seu arquivo de responsabilidade antes de executar uma tarefa.

## Regras operacionais

1. Faça uma pergunta por vez quando a gestora estiver respondendo a um questionário.
2. Não repita perguntas já respondidas e persistidas, salvo necessidade de confirmação.
3. Permita revisar e corrigir respostas.
4. Diferencie dado confirmado, dado informado pela clínica, cálculo, hipótese e informação ausente.
5. Não declare uma campanha publicada sem confirmação da API ou evidência equivalente.
6. Não prometa resultados comerciais ou clínicos garantidos.
7. Não publique nem ative campanhas sem validação e confirmação explícita.
8. Nunca exponha credenciais em conversas, documentação, logs ou repositórios.
9. Registre decisões, alterações, erros e próximas ações.
10. Não declare que uma funcionalidade está pronta antes de testá-la.

Regras permanentes complementares (sempre carregadas):
- `.agents/rules/metodo-6d.md` — o método.
- `.agents/rules/seguranca.md` — LGPD, credenciais, dados de pacientes.
- `.agents/rules/meta-ads.md` — integração e políticas da Meta.
- `.agents/rules/copy-e-criativos.md` — o que pode e o que não pode ser dito.
- `.agents/rules/atendimento-e-crm.md` — atendimento, CRM e consentimento.

## Como o sistema funciona (o que existe de verdade nesta pasta)

| Camada | Onde | O que faz |
|---|---|---|
| Interface da gestora | `app/public/` servida por `app/server.js` em `http://localhost:4766` | Botões de objetivo, uma pergunta por vez, progresso, voltar/editar, revisão e confirmação |
| Memória por clínica | `app/lib/store.js` → pasta `data/` | Cadastro, campanhas, criativos, monitoramento, CRM, sessões e histórico de auditoria |
| Perguntas | `app/lib/questions.js` (espelha `core/forms/`) | Define o que perguntar por objetivo e detecta o que já foi respondido |
| Conformidade | `app/lib/compliance.js` (espelha `core/protocols/meta-ads-compliance.md`) | Triagem automática antes de qualquer publicação |
| Meta | `app/lib/meta.js`, `app/lib/campaign-flow.js` | OAuth, permissões, contas, criação validada, status, métricas |
| Cálculos | `app/lib/metrics.js`, `app/lib/reports.js` | Custo por seguidor, diagnóstico de funil, classificação de criativos, relatórios |
| Geradores | `app/lib/generators.js` (espelha `core/templates/`) | Copies, prompts, roteiros, scripts, nomes de método, treinamento |
| Cofre | `app/lib/secrets.js` → pasta `secrets/` | Credenciais cifradas (Windows DPAPI) — nunca em texto puro |
| Linha de comando | `app/cli.js` | Mesma memória da interface, para uso dos agentes em conversa |

### Uso obrigatório da memória pelos agentes

Quando um agente atuar por conversa (Claude Code, Antigravity ou similar), ele usa a CLI para ler e gravar — nunca grava dados de clínica em Markdown:

```bash
node app/cli.js clinicas                          # listar clínicas
node app/cli.js retomada <clinica>                # onde parou e próxima ação (rodar SEMPRE ao iniciar)
node app/cli.js faltam <clinica> <objetivo>       # perguntas que faltam, na ordem
node app/cli.js responder <clinica> <form> <campo> "<valor>"
node app/cli.js compliance "<texto do anúncio>"
node app/cli.js sessao <clinica> '{"solicitacao":"...","objetivo":"...","decisoes":"...","acoesExecutadas":"...","resultadosConfirmados":"...","pendencias":"...","proximoPasso":"...","proximoMonitoramento":"..."}'
```

A gravação só pode ser anunciada como feita quando o comando retornar sucesso (a gravação é conferida por releitura). Se retornar `ERRO:`, informar a falha.

Publicação, conexão com a Meta e exclusões são feitas **somente pela interface**, onde existe revisão, campo seguro e confirmação explícita. A CLI não aceita tokens.

### Ao iniciar qualquer sessão

1. `node app/cli.js clinicas` e confirmar com a gestora qual clínica (nunca misturar clínicas).
2. `node app/cli.js retomada <clinica>` → informar em uma ou duas frases onde parou e o próximo passo.
3. Continuar sem repetir perguntas respondidas.
4. Ao terminar, gravar o resumo com `sessao` e conferir o retorno.

## Independência do ambiente

Toda regra essencial deve existir nos arquivos do projeto. Não dependa de memória de conversas, arquivos pessoais ou diretórios do computador de origem.

O projeto deve possuir instruções de instalação, dependências documentadas, configuração segura, testes e procedimentos de recuperação: `docs/INSTALACAO.md` (inclui transferência para outro computador), `docs/CONFIGURACAO-META.md`, `docs/OPERACAO.md`, `docs/TESTES-E-LIMITACOES.md`.

## Critério de conclusão

Uma tarefa só pode ser classificada como concluída quando:
- os arquivos ou componentes necessários foram implementados;
- as integrações relacionadas foram verificadas;
- os testes aplicáveis foram executados (`npm test`);
- os erros conhecidos foram registrados;
- a documentação foi atualizada (inclusive `core/STATUS-SQUAD.md`).

Classifique o estado como:
- CONCLUÍDO E TESTADO;
- IMPLEMENTADO, MAS NÃO TESTADO;
- BLOQUEADO POR DEPENDÊNCIA;
- PENDENTE.

## O que não pode ser alterado sem autorização da titular

- O aviso de propriedade intelectual em qualquer arquivo.
- As seis dimensões e os seis agentes.
- A exigência de confirmação explícita antes de publicar/ativar.
- A proibição de gravar credenciais fora do cofre.
- A separação de dados por clínica.
