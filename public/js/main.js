
//para evitar hacer request con cada cambio de filtro.
let portfolioData = [];
let originalPortfolioData = [];

let configuracionOrden = {
    columna: null,
    direccion: 'desc' 
};
// carga del dom
document.addEventListener('DOMContentLoaded', () => {
    cargarPortfolio();
    configurarEventos();
});

// se le piden los datos a el backend, app.js
async function cargarPortfolio() {
    const tableBody = document.getElementById('portfolio-body');
    tableBody.innerHTML = `<tr><td colspan="6" class="table-loading">Cargando datos del servidor...</td></tr>`;

    try {
        const respuesta = await fetch('/api/portfolio');
        if (!respuesta.ok) throw new Error('Error al consultar el backend');
        
        const datos = await respuesta.json();
        
        portfolioData = datos.assets;
        originalPortfolioData = [...datos.assets]; // respaldo
        
        renderizarResumen(datos.summary);
        renderizarTabla(portfolioData);
        
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
    //evento para la busqueda
    searchInput.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        
        // filtro por simbolo o nombre.
        portfolioData = originalPortfolioData.filter(coin => 
            coin.name.toLowerCase().includes(termino) || 
            coin.symbol.toLowerCase().includes(termino)
        );
        
        // orden a los resultados filtrados
        if (configuracionOrden.columna) {
            ejecutarOrdenamiento();
        } else {
            renderizarTabla(portfolioData);
        }
    });

    // evento click en la flecha de ordenamiento
    cabecerasSortables.forEach(cabecera => {
        cabecera.addEventListener('click', () => {
            const columnaSeleccionada = cabecera.getAttribute('data-sort');
            
            // Si clickea la misma columna que ya estaba activa, invertimos la dirección
            if (configuracionOrden.columna === columnaSeleccionada) {
                configuracionOrden.direccion = configuracionOrden.direccion === 'asc' ? 'desc' : 'asc';
            } else {
                // Si clickea una nueva columna, la guardamos y por defecto ordenamos descendente
                configuracionOrden.columna = columnaSeleccionada;
                configuracionOrden.direccion = 'desc';
            }

            actualizarIconosDeColumnas(cabecera);
            ejecutarOrdenamiento();
        });
    });
    refreshBtn.addEventListener('click', () => {
        searchInput.value = '';
        // reset de las flechas al actualizar
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-active');
            th.querySelector('.sort-arrow').textContent = '↕';
        });
        configuracionOrden = { columna: null, direccion: 'desc' };
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

    portfolioData.sort((a, b) => {
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
    
    renderizarTabla(portfolioData);
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