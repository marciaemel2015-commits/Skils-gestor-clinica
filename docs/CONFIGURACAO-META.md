# Configuração da integração com a Meta

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.

Documentação oficial: https://developers.facebook.com/ · Marketing API: https://developers.facebook.com/docs/marketing-api · Versões: https://developers.facebook.com/docs/graph-api/changelog/versions

## 0. Ponto de partida (o sistema conduz)
Ao clicar em "Configurar a Meta", a primeira pergunta é: **"A clínica já anuncia pelo Gerenciador de Anúncios (com conta e pagamento configurados)?"**
- **Sim** → vai direto para conectar (passos 2–4 abaixo) e depois "Conferir tudo".
- **Não / Não sei** → o sistema pergunta item por item (perfil pessoal com acesso de administradora, página, Instagram profissional, portfólio empresarial/BM, conta de anúncios, pagamento, WhatsApp) e mostra o passo a passo, com link oficial, **só do que falta**. Cada etapa concluída é marcada em "Já fiz esta etapa".
- Depois de conectar, **"Conferir tudo"** verifica pela API: permissões, página, Instagram vinculado, BM, conta de anúncios ativa, forma de pagamento e WhatsApp na página. O que a API não deixar ler aparece como "conferir" (nunca como pronto).

O que a API **não faz** (e o sistema não promete): criar página, transformar o Instagram em profissional, cadastrar forma de pagamento, conectar o WhatsApp à página. Essas etapas são da dona das contas, logada no Facebook dela. A criação de conta de anúncios pela API existe só para alguns negócios e com limites; o guia usa o caminho manual, que vale para todos.

**Sobre as permissões ("liberar funções"):** o que a clínica autoriza ao clicar em "Entrar com Facebook" são as 7 permissões da seção 3 — elas permitem ao sistema *ler e gerenciar* anúncios, páginas e Instagram já existentes. Não existe permissão que crie página ou cadastre pagamento.

**Caminho mais rápido para uma única clínica (ex.: a primeira cliente):** no painel do app (developers.facebook.com › seu app › Funções do app), adicione o perfil do Facebook da dona da clínica como **Testador**. Ela aceita o convite e já consegue "Entrar com Facebook" sem App Review. Para atender muitas clínicas, aí sim é preciso App Review e acesso completo.

## 1. Pré-requisitos da clínica (feitos pela pessoa dona das contas)
- Portfólio empresarial (Business Manager) com: página do Facebook, Instagram profissional vinculado, conta de anúncios ativa com forma de pagamento.
- Para campanhas de WhatsApp: número do WhatsApp Business conectado à página.
- A pessoa que vai conectar precisa ter acesso de administrador (ou permissão de anunciante) à conta de anúncios e à página.

## 2. Criar o app (uma vez, por quem administra o sistema)
1. https://developers.facebook.com/apps → Criar app → tipo **Empresa (Business)**.
2. Adicionar os produtos **Login do Facebook para Empresas** (ou Login do Facebook) e **Marketing API**.
3. Em Login › Configurações, cadastrar o URI de redirecionamento OAuth válido: `http://localhost:4766/auth/meta/callback` (ajuste a porta se mudar `M6D_PORT`).
4. Em Configurações › Básico, copiar **ID do app** e **Chave secreta do app**.
5. Enquanto o app estiver em modo de desenvolvimento, só administradores/testadores do app conseguem conectar. Para outras clínicas: passar pelo App Review pedindo as permissões abaixo e obter o nível de acesso da Marketing API adequado (a Meta revisa os níveis de acesso periodicamente — em 2026 o nível foi renomeado para "Marketing API Access Tier").

## 3. Permissões solicitadas
`ads_management` (criar/editar), `ads_read` (métricas), `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads` (anúncio ligado à página), `instagram_basic`. Princípio do menor privilégio: não pedir outras.

## 4. Conectar no sistema
1. "Configurar a Meta" › passo 1: colar ID do app e chave secreta → "Salvar app" (a chave vai cifrada para `secrets/app/`).
2. Passo 2: "Entrar com Facebook" → autorizar **todas** as permissões → o sistema troca o código por um token de longa duração (~60 dias) e guarda cifrado em `secrets/<clinica>/`.
   Alternativa: token de **usuário do sistema** gerado no Business Manager (não expira da mesma forma) colado no campo de senha "Salvar token com segurança".
3. Passo 3: "Escolher conta e página" → o sistema lê nome, fuso horário (`timezone_name`), moeda e o Instagram vinculado.
4. "Verificar permissões" → deve dizer "Todas as permissões concedidas".

## 5. O que o sistema faz na API (e só isso)
Ler: usuário, permissões, contas de anúncios, páginas e Instagram, campanhas, status, insights, busca de cidades.
Escrever (somente após confirmação): criar campanha (pausada), enviar imagem, criar conjunto, criativo e anúncio, ativar/pausar campanha. Antes de criar, valida com `execution_options=["validate_only"]`.
Detalhes de parâmetros e erros: `.agents/rules/meta-ads.md`.

## 6. Verificar antes da primeira campanha
- Conta com status ativo e pagamento ok.
- Fuso horário da conta correto (a programação usa esse fuso).
- Página ligada ao WhatsApp (campanha de WhatsApp) e ao Instagram (seguidores/reconhecimento).
- Objetivo disponível: a primeira publicação faz a validação; se a Meta recusar (ex.: visita ao perfil indisponível), o erro aparece explicado e nada fica ativo.

## 7. Segurança, revogação e renovação
- Tokens nunca aparecem na tela, em arquivos de dados, em logs nem no chat.
- Revogar: "Desconectar" no sistema + Facebook › Configurações e privacidade › Configurações › Integrações comerciais › remover o app. Para a chave do app: Painel do app › Configurações › Básico › redefinir chave secreta.
- Renovar: a tela mostra a validade; reconectar antes de vencer. Token expirado gera a mensagem "O acesso à Meta expirou… Conecte a Meta novamente".
- Se um token for exposto: revogar imediatamente, desconectar, reconectar e registrar o incidente (sem o valor).

## 8. Sem backend seguro?
Este sistema já tem armazenamento seguro local (cofre). Se for executado em servidor compartilhado ou nuvem, **não** usar o cofre DPAPI de um usuário comum: implantar um gerenciador de segredos do provedor e HTTPS antes de solicitar credenciais.
