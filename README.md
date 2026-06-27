# Crypto Portfolio API

Pequeña API y frontend para visualizar portfolios locales de criptomonedas.

## Requisitos

- Node.js >= 18
- npm

## Instalación

```bash
npm install
```

## Scripts

- `npm start` — inicia el servidor con Node
- `npm run dev` — inicia con `nodemon` para desarrollo
- `npm test` — ejecuta tests (placeholder)

## Ejecución

```bash
npm start
# luego abrir http://localhost:3000
```

## Endpoints

- `GET /api/portfolio/recarga` — recarga precios desde CoinGecko y actualiza la caché en memoria, el retorno es un 204 de estado exitoso.
- `GET /api/portfolio/:id` — utiliza la cache de la recarga para devolver en JSON las monedas del portfolio seleccionado.
- `GET /api/portfolios` — carga los portfolios disponibles del usuario para el selector.
- `GET /api/trending` — utiliza la API de coingecko para devolver las tendencias del mercado.

## Notas importantes

- El proyecto guarda la caché en memoria (`cachePortfolios`); al reiniciar el servidor la caché se pierde.
- El código usa `fetch` global: requiere Node >= 18