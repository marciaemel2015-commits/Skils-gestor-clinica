# Instalação, primeira execução e transferência

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

## 1. Requisitos
- Windows 10/11 (recomendado; o cofre usa a proteção de dados do Windows). Também funciona em macOS/Linux com `M6D_SECRET_KEY`.
- **Node.js 20 ou superior** (testado com 22.21). Baixar em https://nodejs.org (versão LTS).
- Internet para falar com a Meta.
- **Nenhuma dependência externa**: o projeto não usa `npm install` (só módulos nativos do Node).

## 2. Abrir e executar

**Jeito simples (clínica):** dois cliques em `INICIAR.bat` na pasta. Ele confere se o Node está instalado, liga o sistema e abre o navegador. Para desligar, feche a janela.

**Jeito técnico:**
1. Copie a pasta `GESTOR 6D CLINICAR MARCIA` para o computador (ex.: `C:\GESTOR 6D CLINICAR MARCIA`).
2. Abra o terminal (PowerShell) nessa pasta.
3. Confira o Node: `node --version` (deve ser v20+).
4. Rode os testes: `npm test` → deve terminar com `fail 0`.
5. Inicie: `npm start`.
6. Abra no navegador: **http://localhost:4766**. Para desligar, feche o terminal (ou Ctrl+C).

Porta diferente: `$env:M6D_PORT=5000; npm start` (o endereço de retorno do login da Meta muda junto).

## 3. Primeira clínica
Na tela inicial, "Cadastrar nova clínica" → digite o nome → escolha um objetivo. O sistema faz as perguntas uma a uma e guarda tudo em `data/`.

## 4. Integração com a Meta (resumo)
Detalhes em `docs/CONFIGURACAO-META.md`. Em poucas palavras: (a) criar um app na Meta e cadastrar o endereço de retorno; (b) na tela "Configurar a Meta", salvar ID e chave secreta do app; (c) clicar "Entrar com Facebook"; (d) escolher conta de anúncios e página; (e) "Verificar permissões".

## 5. Credenciais com segurança
- Nunca coloque tokens em arquivos, no chat ou em e-mail. Use só a tela "Configurar a Meta".
- No Windows, ficam cifradas para o **usuário do Windows** que as salvou.
- Fora do Windows: gere uma chave e defina antes de iniciar: `export M6D_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")` — guarde-a em um gerenciador de senhas.
- Alternativa sem gravar em disco: `$env:META_ACCESS_TOKEN="..."` no terminal antes de `npm start` (vale só naquela sessão).

## 6. Verificar a conexão
"Configurar a Meta" → "Verificar permissões": mostra o usuário conectado e as permissões que faltam. "Escolher conta e página" lista o que a conta realmente acessa.

## 7. Logs sem expor segredos
Arquivos em `logs/app-AAAA-MM-DD.log` (JSON por linha). Tokens e chaves são removidos antes de gravar (`[TOKEN_REMOVIDO]`). Para ver os erros: `Select-String -Path logs\*.log -Pattern '"level":"error"'`.

## 8. Transferir para outro computador
1. No computador antigo: feche o sistema.
2. Copie a pasta inteira **incluindo `data/`** (é onde estão clínicas, campanhas, CRM e histórico). Use pen drive ou nuvem com acesso restrito — `data/` contém dados pessoais.
3. **Não adianta copiar `secrets/`** entre computadores Windows: a credencial cifrada só abre no mesmo usuário/computador. No novo computador, refaça "Configurar a Meta" (app + Entrar com Facebook).
4. No novo computador: instale o Node, `npm test`, `npm start`, abra http://localhost:4766. As clínicas aparecem com todo o histórico; a tela "Onde paramos" mostra a próxima ação.
5. Apague a cópia temporária usada no transporte.
6. Para usar com outro assistente de IA (Claude Code, Antigravity etc.), abra a pasta como projeto: o assistente lê `AGENTS.md` e as regras em `.agents/rules/`. Nada depende do computador original.

## 9. Recuperação de problemas
| Sintoma | Causa provável | Ação |
|---|---|---|
| "Não foi possível salvar" | disco cheio, pasta somente leitura, antivírus | liberar espaço / permissões; tentar de novo — nada foi alterado |
| "Arquivo corrompido ou ilegível" | arquivo de `data/` editado à mão ou cópia incompleta | restaurar o arquivo do backup |
| "Sessão inválida. Recarregue a página" | o sistema foi reiniciado | recarregar a página (F5) |
| "Não foi possível abrir a credencial" | pasta copiada de outro usuário/computador | reconectar a Meta |
| Porta em uso | outro programa na 4766 | `$env:M6D_PORT=4767; npm start` |
