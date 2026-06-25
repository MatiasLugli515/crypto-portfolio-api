
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // para async y await

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

const portfolioPath = path.join(__dirname, '../data/portfolio.json');

app.get('/api/portfolio', async (req, res) => {
    try {
        const rawData = await fs.readFile(portfolioPath, 'utf-8');
        const portfolio = JSON.parse(rawData);

        const cryptoIds = portfolio.map(coin => coin.id).join(',');
        //url de la API con la criptomoneda y la moneda de referencia
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd`;

        const apiResponse = await fetch(url);
        
        if (!apiResponse.ok) {
            throw new Error('Error al consultar la API de CoinGecko');
        }
        else if (apiResponse.status === 400) {
            throw new Error('Solicitud incorrecta a la API de CoinGecko');
            log(apiResponse.status);
        }
        else if (apiResponse.status === 500) {
            throw new Error('Error interno en la API de CoinGecko');
            log(apiResponse.status);
        }
        
        const pricesData = await apiResponse.json();

        let globalTotalValue = 0;
        let globalTotalCost = 0;


        // procesar cada cripto del portfolio
        const processedPortfolio = portfolio.map(coin => {

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
        res.json({
            summary: {
                totalValue: globalTotalValue,
                totalProfitLossAbs: globalProfitLossAbs,
                totalProfitLossPct: globalProfitLossPct
            },
            assets: processedPortfolio
        });

    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: "Hubo un problema al procesar el portfolio" });
    }
});


app.get('/api/trending', async (req, res) => {
    const url = `https://api.coingecko.com/api/v3/search/trending`;
    const apiResponse = await fetch(url);

    if (!apiResponse.ok) {  
        throw new Error('Error al consultar la API de CoinGecko');
    }
    const trending = await apiResponse.json();
    const ids = trending.coins.map(coin => coin.item.id).join(',');
    console.log("IDS cruzadas tendencias:", ids);
    const url1 = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    const apiResponse2 = await fetch(url1);
    if (!apiResponse2.ok) {  
        throw new Error('Error al consultar la API de CoinGecko');
    }

    const detTrend = await apiResponse2.json();
    console.log("detTrend:", detTrend);

    const response = trending.coins.map(coin => ({                
        thumb : coin.item.thumb,
        symbol: coin.item.symbol,
        name: coin.item.name,
        market_cap_rank: coin.item.market_cap_rank,
        price : detTrend[coin.item.id]?.usd || 0
    }));

    res.json(response);

});
    
    

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
