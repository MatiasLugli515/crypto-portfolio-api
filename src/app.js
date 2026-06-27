
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // para async y await

let cachePortfolios = {};

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

const assetsPath = path.join(__dirname, '../data/portfolio_assets.json');
const portfoliosPath = path.join(__dirname, '../data/portfolios.json');

app.get('/api/portfolio/recarga', async (req, res) => {
    try {
            
        const rawCoinData = await fs.readFile(assetsPath, 'utf-8');
        const activos = JSON.parse(rawCoinData);

        const rawPortfoliosData = await fs.readFile(portfoliosPath, 'utf-8');
        const portfolios = JSON.parse(rawPortfoliosData);            
        
        const portfolioIds = portfolios.map(portfolio => portfolio.id);

        console.log("ids portofolio existentes:",portfolioIds);

        const cryptoIdsSet = Array.from(new Set(activos.map(coin => coin.id)))

        console.log("cryptoIdsFiltered:", cryptoIdsSet);
        //url de la API con la criptomoneda y la moneda de referencia
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIdsSet}&vs_currencies=usd`;

        const apiResponse = await fetch(url);
        
        if (!apiResponse.ok) {
            console.log("codigo http error API:",apiResponse.status);
            throw new Error('Error al consultar la API de CoinGecko');
    
        }
        
        const pricesData = await apiResponse.json();

        //es necesario un segundo filtro si no las repetidas entre portfolios se filtraran.

        for (const pid of portfolioIds){
            let globalTotalValue = 0;
            let globalTotalCost = 0;
            console.log("id portoflio procesado:",pid);
            const portfolioFiltered = activos.filter(coin => coin.portfolio_id == pid); 

        // procesar cada cripto del portfolio
            const processedPortfolio = portfolioFiltered.map(coin => {

                const currentPrice = pricesData[coin.id]?.usd || 0;
            
            // calculos para las ganancias.
                const totalCost = coin.amount * coin.average_buy_price; 
                const currentValue = coin.amount * currentPrice;
                const profitLossAbs = currentValue - totalCost;         
            
                const profitLossPct = totalCost > 0 ? (profitLossAbs / totalCost) * 100 : 0;

            // totales globales de ganancia para todo elportfolio
                globalTotalValue += currentValue;
                globalTotalCost += totalCost;

            // se retorna el objeto para mostrar en el portfolio con los datos agregados
                return {
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol,
                    amount: coin.amount,
                    averageBuyPrice: coin.average_buy_price,
                    currentPrice: currentPrice,
                    currentValue: currentValue,
                    profitLossAbs: profitLossAbs,
                    profitLossPct: profitLossPct
                };
            });

        // rendimiento global del portfolio
            const globalProfitLossAbs = globalTotalValue - globalTotalCost;
            const globalProfitLossPct = globalTotalCost > 0 ? (globalProfitLossAbs / globalTotalCost) * 100 : 0;

        // respuesta con la informacion del portfolio
            const respuestaFinal = {
                summary: {
                    totalValue: globalTotalValue,
                    totalProfitLossAbs: globalProfitLossAbs,
                    totalProfitLossPct: globalProfitLossPct
                },
                assets: processedPortfolio
            };

            cachePortfolios[pid] = respuestaFinal;

        }

        return res.sendStatus(204);

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: "Hubo un problema al procesar el portfolio" });
    }
});


app.get('/api/trending', async (req, res) => {
    try{
    const url = `https://api.coingecko.com/api/v3/search/trending`;
    const apiResponse = await fetch(url);

    if (!apiResponse.ok) {  
        throw new Error('Error al consultar la API de CoinGecko');
    }
    const trending = await apiResponse.json();
    const ids = trending.coins.map(coin => coin.item.id).join(',');
    //console.log("IDS cruzadas tendencias:", ids);
    const url1 = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    const apiResponse2 = await fetch(url1);
    if (!apiResponse2.ok) {  
        throw new Error('Error al consultar la API de CoinGecko');
    }

    const detTrend = await apiResponse2.json();
    //console.log("detTrend:", detTrend);

    const response = trending.coins.map(coin => ({                
        thumb : coin.item.thumb,
        symbol: coin.item.symbol,
        name: coin.item.name,
        market_cap_rank: coin.item.market_cap_rank,
        price : detTrend[coin.item.id]?.usd || 0
    }));

    res.json(response);

} catch (error){
    console.error("Error en el servidor:", error);
    res.status(500).json({ error: "Hubo un problema al procesar las tendencias" });
}

});

app.get('/api/portfolio/:id', async (req, res) => {
    const portfolioId = req.params.id
    try {  if(cachePortfolios[portfolioId] !== undefined) {
            console.log("Cache hit for portfolio id:", portfolioId);
            return res.json(cachePortfolios[portfolioId]);
        }
        else {
            console.log("no se encontro el portfolio en cache");
            return res.status(404).json({ error: "Portfolio no encontrado" })
        }
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: "Hubo un problema al procesar el portfolio" });
    }

});

app.get('/api/portfolios', async (req, res) => {
    try {
        const rawData = await fs.readFile(portfoliosPath, 'utf-8');
        const portfolios = JSON.parse(rawData);

        //console.log("portfolios leidos:", portfolios);
        
        const response = portfolios.map(portfolio => ({
            id: portfolio.id,
            name: portfolio.name
        }));

        res.json(response);
    } catch (error) {
        console.error("Error al leer portfolios:", error);
        res.status(500).json({ error: "Hubo un problema al leer los portfolios" });
    }
});


    app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
