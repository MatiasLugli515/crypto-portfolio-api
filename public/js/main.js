
//para evitar hacer request con cada cambio de filtro.
let visibleAssets = [];
let allAssets = [];
let selectedPortfolioId = null;

let configuracionOrden = {
    columna: null,
    direccion: 'desc' 
};
// carga del dom
document.addEventListener('DOMContentLoaded', () => {
    cargarPortfolio();
    configurarEventos();
    cargarTendencias();
    cargarSelectorPortfolios()
});

// se le piden los datos a el backend, app.js
async function cargarPortfolio() {
    const tableBody = document.getElementById('portfolio-body');
    tableBody.innerHTML = `<tr><td colspan="6" class="table-loading">Cargando datos del servidor...</td></tr>`;

    try {
        const respuesta = await fetch(`/api/portfolio/${selectedPortfolioId}`);
        if (!respuesta.ok) throw new Error('Error al consultar el backend');
        
        const datos = await respuesta.json();
        
        visibleAssets = datos.assets;
        allAssets = [...datos.assets]; // respaldo
        
        renderizarResumen(datos.summary);
        renderizarTabla(visibleAssets);
        
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="6" class="table-loading" style="color: var(--danger);">Error al cargar el portfolio. Verificá que el servidor esté corriendo.</td></tr>`;
    }
}

// rendimientos globales
function renderizarResumen(summary) {
    const balanceEl = document.getElementById('total-balance');
    const performanceEl = document.getElementById('total-performance');

    balanceEl.innerHTML = `${formatearMoneda(summary.totalValue)} <span class="currency">USD</span>`;
    
    const porcentaje = summary.totalProfitLossPct;
    performanceEl.textContent = `${porcentaje >= 0 ? '+' : ''}${porcentaje.toFixed(2)}%`;
    
    // cambiar el color segun ganancia o perdida
    performanceEl.className = 'performance'; // Reset
    if (porcentaje > 0) performanceEl.classList.add('positive');
    else if (porcentaje < 0) performanceEl.classList.add('negative');
    else performanceEl.classList.add('neutral');
}

function renderizarTabla(activos) {
    const tableBody = document.getElementById('portfolio-body');
    tableBody.innerHTML = ''; 

    if (activos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="table-loading">No se encontraron monedas.</td></tr>`;
        return;
    }

    // creacion de cada fila de la tabla
    activos.forEach(coin => {
        const row = document.createElement('tr');
        
        const pnlClass = coin.profitLossAbs >= 0 ? 'positive' : 'negative';
        const pnlSign = coin.profitLossAbs >= 0 ? '+' : '';

        row.innerHTML = `
            <td><strong>${coin.name}</strong> <span style="color: var(--text-secondary); font-size: 12px;">(${coin.symbol.toUpperCase()})</span></td>
            <td>${coin.amount}</td>
            <td>${formatearMoneda(coin.averageBuyPrice)}</td>
            <td>${formatearMoneda(coin.currentPrice)}</td>
            <td><strong>${formatearMoneda(coin.currentValue)}</strong></td>
            <td class="performance ${pnlClass}">
                ${pnlSign}${formatearMoneda(coin.profitLossAbs)} <br>
                <span style="font-size: 11px;">(${pnlSign}${coin.profitLossPct.toFixed(2)}%)</span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function configurarEventos() {
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');
    const cabecerasSortables = document.querySelectorAll('th.sortable');
    const portfolioSelect = document.getElementById('portfolio-select');
    //evento para la busqueda
    searchInput.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        
        // filtro por simbolo o nombre.
        visibleAssets = allAssets.filter(coin => 
            coin.name.toLowerCase().includes(termino) || 
            coin.symbol.toLowerCase().includes(termino)
        );
        
        // orden a los resultados filtrados
        if (configuracionOrden.columna) {
            ejecutarOrdenamiento();
        } else {
            renderizarTabla(visibleAssets);
        }
    });

    // evento click en la flecha de ordenamiento
    cabecerasSortables.forEach(cabecera => {
        cabecera.addEventListener('click', () => {
            const columnaSeleccionada = cabecera.getAttribute('data-sort');
            
            if (configuracionOrden.columna === columnaSeleccionada) {
                configuracionOrden.direccion = configuracionOrden.direccion === 'asc' ? 'desc' : 'asc';
            } else {
                
                configuracionOrden.columna = columnaSeleccionada;
                configuracionOrden.direccion = 'desc';
            }

            actualizarIconosDeColumnas(cabecera);
            ejecutarOrdenamiento();
        });
    });

    //boton de actualizar precios, simplemente vuelve a cargar el portfolio, implica otra llamada de api.
    refreshBtn.addEventListener('click', () => {
        searchInput.value = '';
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-active');
            th.querySelector('.sort-arrow').textContent = '↕';
        });
        configuracionOrden = { columna: null, direccion: 'desc' };
        cargarPortfolio();
    });

    portfolioSelect.addEventListener('change', (e) => {
        selectedPortfolioId = e.target.value;
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-active');
            th.querySelector('.sort-arrow').textContent = '↕';
        });
        configuracionOrden = { columna: null, direccion: 'desc' };
        console.log("Portfolio seleccionado:", selectedPortfolioId);
        cargarPortfolio();
    });
}

function actualizarIconosDeColumnas(cabeceraActiva) {
    // actualizar visualmente al tocar una flecha para ordenamiento
    document.querySelectorAll('th.sortable').forEach(th => {
        th.classList.remove('sort-active');
        th.querySelector('.sort-arrow').textContent = '↕';
    });

    cabeceraActiva.classList.add('sort-active');
    const flecha = configuracionOrden.direccion === 'asc' ? '↑' : '↓';
    cabeceraActiva.querySelector('.sort-arrow').textContent = flecha;
}

function ejecutarOrdenamiento() {
    const key = configuracionOrden.columna;
    const direccion = configuracionOrden.direccion;

    visibleAssets.sort((a, b) => {
        // valor exacto del a columna a ordenar, ya sea nombre, simbolo, monto, precio, porcentaje.
        let valorA = a[key];
        let valorB = b[key];

        // regla ordenamiento de strings
        if (typeof valorA === 'string') {
            return direccion === 'asc' 
                ? valorA.localeCompare(valorB)
                : valorB.localeCompare(valorA);
        }

        // regla ordenamiento de numeros
        return direccion === 'asc' 
            ? valorA - valorB 
            : valorB - valorA;
    });
    
    renderizarTabla(visibleAssets);
}

//formato de moneda para internacionalizacion.
function formatearMoneda(valor) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4 
    }).format(valor);
}


// mostrar tendencias del meercado en pantalla
async function cargarTendencias() { 
    const marketList = document.getElementById('market-list');

    try { 
        const respuesta = await fetch('/api/trending');
        if (!respuesta.ok) throw new Error('Error al consultar el backend');
        const trends = await respuesta.json();
        console.log("datos de tendencias:", trends);
        marketList.innerHTML = ''; 
        
        trends.forEach(coin => {
            const item = document.createElement('div');
            item.classList.add('market-item');
            item.innerHTML = `
                <div style="display: flex ; align-items: center; gap: 12px ;">
                    <img src="${coin.thumb}" alt="${coin.name}" style="width: 24px; height: 24px;">
                    <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                    <span>${coin.price ? formatearMoneda(coin.price) : 'N/A'}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 12px; color: var(--text-secondary);">Rank Global</div>
                <strong>#${coin.market_cap_rank}</strong>
            </div>
            `;
            marketList.appendChild(item);
        });
    } catch (error) {
        console.error(error);
        marketList.innerHTML = '<div class="market-item-loading" style="color: var(--danger);">Error al cargar tendencias.</div>';
    }
}

async function cargarSelectorPortfolios() {
    const selector = document.getElementById('portfolio-select');

    try {
        const respuesta = await fetch('/api/portfolios');
        if (!respuesta.ok) throw new Error('Error al consultar el backend');
        const portfolios = await respuesta.json();

        selector.innerHTML = '<option value="" disabled selected>Selecciona un Portfolio</option>';
        portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            selector.appendChild(option);
        });
        
    
    } catch (error) {
        console.error("Fallo al cargar opciones:",error);
        selector.innerHTML = '<option value="" disabled selected>Error al cargar portfolios</option>';
    }
}
