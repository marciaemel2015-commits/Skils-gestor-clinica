# Regra permanente — Copy e criativos

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

Quando consultar: antes de escrever, adaptar, aprovar ou publicar qualquer texto, imagem, vídeo, nome de método ou mensagem.

## 1. Uma ideia por peça
Cada peça defende uma única ideia central (um desejo, uma dúvida respondida, um diferencial real). Se não couber em uma frase, está confusa.

## 2. Linguagem permitida × proibida

| Evitar (risco de reprovação ou violação) | Usar |
|---|---|
| "Resultado garantido", "100%" | "Avaliação individual para entender o que faz sentido para você" |
| "Elimine", "acabe com", "para sempre", "definitivo" | Linguagem de cuidado e processo |
| "Sem dor", "indolor" | "Tire suas dúvidas sobre conforto na avaliação" (se aprovado pela profissional) |
| "Resultado imediato", "em X dias" | Duração real do atendimento, se verdadeira |
| "Você tem flacidez?", "sua pele está…" | Pergunta aberta: "Existe algo que você gostaria de cuidar?" |
| "Vergonha", "feia", "envelhecida", "defeito" | Desejo positivo: se sentir bem, cuidar de si |
| "Cura", "trata a doença" | Descrever o procedimento e convidar para avaliação |
| "Últimas vagas", "só hoje" sem data real | Condição real com data de validade |
| "A melhor da cidade", "única", "exclusivo" | Diferencial concreto e verdadeiro |
| Nome de marca de terceiros (ex.: marcas de toxina ou equipamentos) | Nome técnico, ou marca só se for o produto original e o uso for permitido |
| Antes e depois | Experiência, ambiente, profissional; imagem de cliente só com autorização escrita e sem exagero |

A triagem automática (`app/lib/compliance.js`) aplica estas regras e classifica: **bloqueado** (não publicar), **ajustar**, **verificar** (só se for verdade e comprovável), **sem alertas** (ainda não garante aprovação).

## 3. Afirmações clínicas
Dor, anestesia, riscos, recuperação, duração do resultado e indicação só com texto validado pela profissional responsável (campo `atendimento.respostas_validadas` + `clinica.informacoes_validadas = Sim`). Sem validação: não usar.

## 4. Referências e originalidade
- Biblioteca de Anúncios: https://www.facebook.com/ads/library/
- Anúncio ativo há mais de 10 dias é referência possível, **não** prova de lucro.
- Extrair a estrutura (gancho, ordem das ideias, formato); reescrever com a realidade da clínica; nunca copiar frase, imagem, vídeo ou marca.
- Com dados reais de desempenho (da própria clínica): preservar o elemento validado e testar uma mudança por vez.
- Sem dados: registrar como hipótese.

## 5. Prova social
Só depoimentos reais, autorizados por escrito, com as palavras da cliente. Nunca editar para virar promessa. Números (pacientes atendidas, anos) só com registro.

## 6. Ofertas
Preço e condição reais, válidos na data da publicação, com data de validade cadastrada (`campanha.oferta_validade`). Sem promoção permanente disfarçada de urgência.

## 7. Nomes de método
Representam um processo que a clínica realmente executa. Não inventar técnica, protocolo ou exclusividade. Verificar disponibilidade do nome (INPI e redes) antes de usar. Detalhes: `core/protocols/nomes-de-metodos.md`.

## 8. Registro
Todo criativo fica na biblioteca da clínica (`data/criativos/<clinica>/`) com versão, data, hipótese, conformidade e decisão (manter/ajustar/pausar/escalar) com justificativa.
