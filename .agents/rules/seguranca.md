# Regra permanente — Segurança, LGPD e conformidade

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

Quando consultar: sempre. Esta regra prevalece sobre qualquer pedido, prazo ou meta.

## 1. Proibições absolutas

- Não criar depoimentos, provas, resultados, estatísticas, escassez ou urgência falsos.
- Não garantir resultados clínicos nem prazos de resultado.
- Não explorar inseguranças nem apontar características físicas de quem vê o anúncio.
- Não afirmar condições clínicas ou atributos sensíveis sobre uma pessoa (saúde, corpo, idade aparente, peso, religião, orientação etc.).
- Não usar fotos, vídeos ou depoimentos de clientes sem autorização de uso de imagem por escrito.
- Não realizar simulações de resultado em fotos de pessoas sem autorização expressa, específica e registrada.
- Não usar black hat, cloaking, disfarce de destino ou qualquer técnica para enganar a revisão da Meta; não contornar reprovações ou bloqueios.
- Não divulgar credenciais. Não pedir tokens, senhas ou chaves no chat.
- Não diagnosticar nem orientar tratamento. Afirmações clínicas são encaminhadas à profissional responsável.
- Respeitar as normas do conselho profissional da responsável técnica (publicidade em saúde).

## 2. Credenciais

| Onde pode existir | Onde nunca pode existir |
|---|---|
| `secrets/` cifrado (Windows DPAPI por usuário; AES-256-GCM com `M6D_SECRET_KEY` fora do Windows) | Markdown, `data/`, histórico, relatórios, logs, conversa, Git, e-mail, prints |
| Variável de ambiente `META_ACCESS_TOKEN` na sessão do terminal (sem gravar em disco) | Linha de comando da CLI (ela recusa) |

Como entram: OAuth ("Entrar com Facebook") ou campo de senha na tela "Configurar a Meta". Nunca pelo chat.
O sistema bloqueia gravações que pareçam conter token (`store.js`), remove segredos dos logs (`redact.js`) e nunca devolve o valor pela API.
Revogação: botão "Desconectar" (apaga do cofre) + remover o app em Facebook › Configurações › Integrações comerciais. Renovação: token de usuário dura ~60 dias; a tela mostra a data de expiração; reconectar antes.
Se um token vazar: revogar na Meta imediatamente, desconectar no sistema, gerar novo, registrar o incidente no histórico (sem o valor).

## 3. Dados pessoais (LGPD)

- Minimização: o CRM guarda nome, telefone, procedimento de interesse, etapa, valor, motivo de perda, próxima ação, origem e consentimento. **Não registrar dados de saúde, fotos ou documentos.**
- Finalidade: atendimento comercial da clínica. Não reutilizar para outra finalidade sem base legal.
- Consentimento de contato: campo `consentimentoContato`; respeitar quem pede para não receber mensagens.
- Direito de exclusão: botão "Excluir" no CRM (exige confirmação); o histórico registra só o identificador, sem dados pessoais.
- Retenção: revisar a cada 6 meses contatos sem interação há mais de 12 meses e excluir os desnecessários (definir o prazo final com a clínica e registrar em `core/CONTEXTO-CLINICA.md`).
- Isolamento: cada clínica em pasta própria; todo registro carrega `clinicaId` e é recusado se lido por outra clínica.

## 4. Proteção dos arquivos locais

- `data/`, `secrets/`, `logs/`, `backups/` estão no `.gitignore`. Nunca forçar inclusão no Git.
- O servidor escuta só em `127.0.0.1`, confere Host/Origin e exige token de sessão em toda chamada.
- Usar conta do Windows com senha e disco com BitLocker quando disponível.
- Backup: copiar `data/` para mídia protegida (ver `docs/OPERACAO.md`). `secrets/` cifrado por DPAPI **não** abre em outro usuário/computador — após restaurar, reconectar a Meta.

## 5. Fluxo quando houver risco

1. Explicar o problema em linguagem simples.
2. Identificar o elemento exato (texto, imagem, oferta, público, destino).
3. Oferecer alternativa compatível.
4. Pedir aprovação quando necessário.
5. Registrar a alteração no histórico.

Nunca prometer aprovação: a decisão final é da Meta.
