# GESTOR 6D CLINICAR MARCIA — Método Clínica de Estética 6D

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

Sistema local para operar marketing, aquisição e conversão de clínicas de estética: a gestora escolhe um objetivo em botões, responde perguntas simples (uma por vez), revisa e confirma. O sistema prepara criativos e textos, verifica conformidade, configura e publica campanhas na Meta (somente com confirmação), acompanha resultados, organiza o CRM e treina a equipe.

## Para a clínica: dois cliques
Instale o Node.js (https://nodejs.org, versão LTS) uma única vez e dê dois cliques em **`INICIAR.bat`**. O navegador abre sozinho em http://localhost:4766. Para desligar, feche a janela preta.

## Começar em 3 comandos (técnico)
```
node --version   # precisa ser 20 ou superior
npm test         # deve terminar com "fail 0"
npm start        # depois abra http://localhost:4766
```
Sem `npm install`: o projeto usa só recursos nativos do Node.

## O que a gestora encontra
Quero clientes no WhatsApp · Quero seguidores no Instagram · Quero reconhecimento local · Quero criar um criativo · Quero modelar um anúncio · Quero monitorar campanhas · Quero otimizar resultados · Quero treinar minha equipe · Quero consultar o histórico · Retomar contatos (CRM) · Criar nome de método · Configurar a Meta · Editar cadastro.

## Mapa da pasta
| Pasta/arquivo | Conteúdo |
|---|---|
| `AGENTS.md` | Instruções principais para agentes de IA (comece por aqui) |
| `.agents/rules/` | Regras permanentes: método, segurança, Meta, copy, atendimento/CRM |
| `core/agents/` | Os seis agentes (Entrada, Analista, Mídia, Criativo, Atendimento, Suporte) |
| `core/protocols/` | 11 protocolos operacionais |
| `core/forms/` | 5 questionários (gerados a partir do código da interface) |
| `core/templates/` | 8 modelos (criativos, copy, scripts, relatórios, treinamento, checklist) |
| `core/STATUS-SQUAD.md` | Estado real de cada módulo |
| `app/` | Interface, servidor local, integração Meta, CLI |
| `data/` | Dados das clínicas (criado no uso; **fora do Git**) |
| `secrets/` | Credenciais cifradas (**fora do Git**) |
| `docs/` | Instalação/transferência, Meta, operação, testes e limitações |

## Garantias de funcionamento
- Nada é publicado sem a gestora marcar a autorização e digitar PUBLICAR.
- A campanha é criada pausada, validada e só ativada no fim; o estado mostrado é o retornado pela Meta.
- Credenciais só no cofre cifrado; nunca em Markdown, logs, dados ou Git.
- Cada clínica tem dados separados; cada alteração fica no histórico.
- "Salvo" só aparece depois de a gravação ser conferida.

Limitações e o que ainda depende de ação externa: `docs/TESTES-E-LIMITACOES.md` e `core/STATUS-SQUAD.md`.
Uso interno. Não publicar em repositório público sem autorização da titular.
