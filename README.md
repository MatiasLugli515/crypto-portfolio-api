# CryptoVault - Portfolio API & Dashboard

Plataforma full-stack ligera para la visualización y gestión de portfolios locales de criptomonedas. Construida con un backend en Node.js y un frontend dinámico en Vanilla JavaScript.



## 🚀 Características Principales

- **Gestión Multi-Portfolio:** Visualización de múltiples carteras con cálculo de P&L (Profit & Loss).
- **Caché en Memoria:** Sistema de almacenamiento temporal (`In-Memory Cache`) para minimizar la latencia y proteger los límites de consumo de la API externa.
- **Fallback:** Si la API externa falla o congestiona, el sistema intercepta el error, alerta al cliente y sirve la última versión de los datos guardados en caché sin romper la interfaz.

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js (v18+), Express.
- **Frontend:** HTML5 Semántico, Vanilla JavaScript, CSS3.
- **Integraciones:** API REST de CoinGecko (Mercado y Precios).

## Requisitos

- [Node.js](https://nodejs.org/) (Versión 18.0.0 o superior, requerido para el uso de `fetch` nativo).
- npm (Node Package Manager).

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/MatiasLugli515/crypto-portfolio-api.git


2. Instalar dependencias: -npm install

3. Iniciar servidor: npm start

```

4. Abrir en el navegador en http://localhost:3000



## Endpoints

- `GET /api/portfolio/recarga` — recarga precios desde CoinGecko y actualiza la caché en memoria, el retorno es un 204 de estado exitoso.
- `GET /api/portfolio/:id` — utiliza la cache de la recarga para devolver en JSON las monedas del portfolio seleccionado.
- `GET /api/portfolios` — carga los portfolios disponibles del usuario para el selector.
- `GET /api/trending` — utiliza la API de coingecko para devolver las tendencias del mercado.

## Notas importantes

- El proyecto guarda la caché en memoria (`cachePortfolios`); al reiniciar el servidor la caché se pierde.
- El código usa `fetch` global: requiere Node >= 18