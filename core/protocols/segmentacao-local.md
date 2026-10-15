# Protocolo — Segmentação local

© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.

**Quando consultar:** antes de montar qualquer público. Responsável: Mídia. Toda campanha da clínica é geolocalizada.

## Perguntas (form `clinica` e `publico`)
1. Endereço e link do Google Maps (ponto central).
2. Cidades de onde as clientes vêm; bairros de interesse.
3. Raio máximo de deslocamento (3, 5, 8, 10, 15, 20, 30 km).
4. Atende só na clínica, em domicílio ou em mais de um endereço?
5. Regiões a excluir.
6. Gênero atendido; idade mínima e máxima.

## Interpretação e decisões
| Situação | Decisão |
|---|---|
| Link do Maps com coordenadas | `custom_locations` com lat/long + raio em km |
| Link curto (maps.app.goo.gl) | O sistema expande o link; se falhar, pedir o link completo da barra de endereço |
| Sem coordenadas | Buscar cidades pela Meta (`/search?type=adgeolocation`) e usar cidades com raio |
| Mais de um endereço | Uma localização por endereço (configurar no Gerenciador; o sistema atual usa um ponto) |
| Atende em domicílio | Raio = área de deslocamento real informada |
| Regiões a excluir | Aparecem no resumo para conferência manual no Gerenciador (exclusão geográfica automática não implementada) |
| Capital / alta densidade | Raios menores costumam bastar; validar com a origem real das clientes |
| Interior | Incluir cidades vizinhas que de fato frequentam a clínica |
| Idade | Sempre ≥ 18. Faixa vem da clínica (quem realmente agenda e comparece), nunca suposta |
| Advantage+ audience | Desligado (`advantage_audience: 0`) para respeitar idade e região como limites reais |

`location_types: ["home","recent"]` — pessoas que moram ou estiveram recentemente na área.

## Verificações antes de publicar
- Ponto no mapa corresponde ao endereço (conferir no resumo).
- Raio coerente com o deslocamento declarado.
- Idade mínima ≥ 18 (a triagem bloqueia abaixo disso).
- Não usar interesses ou segmentações ligados a condições de saúde.

## Revisão periódica
A cada monitoramento: os contatos que agendaram vieram de onde? Se muitos vierem de fora do raio ou se uma região não gera contatos, propor ajuste — **com confirmação** e registro (`respostas_atualizadas` guarda antes/depois).

## Erros a evitar
Estado ou país inteiro; raio "chutado"; ampliar a área sem confirmar que a clínica atende; segmentação por atributos sensíveis.
