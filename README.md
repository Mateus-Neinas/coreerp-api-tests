# CoreERP API Tests

Testes de contrato e fluxo para a API do CoreERP. O repositório mantém os cenários de qualidade separados da implementação principal.

## O que valida

- Health check da API.
- Cadastro e consulta de clientes e produtos.
- Criação de pedido com cliente existente.
- Códigos HTTP e campos essenciais do JSON.
- Reutilização de IDs entre passos da coleção.

## Executar

Requer Node.js 20 ou superior. Suba primeiro a API CoreERP.

```bash
npm test
npm run smoke
```

Para apontar para outro ambiente:

```bash
COREERP_API_URL=https://api.exemplo.com npm run smoke
```

## Como funciona o runner

`collections/coreerp-smoke.json` descreve requests e verificações. `src/runCollection.js` substitui variáveis, envia os requests e guarda valores de resposta para os próximos passos. A mesma estrutura pode ser adaptada para outras APIs HTTP.
