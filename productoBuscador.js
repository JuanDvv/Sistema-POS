// Buscador desplegable de productos: input de texto libre + lista de sugerencias filtrada sin
// tildes y sin importar el orden de las palabras (mismo criterio que el buscador de productos de
// Ventas/Inventario, ver normalizeStr en ventas.js/pedidos.js/dashboard.js/transferencias.js).
// Reemplaza los <input list="...datalist">: el <datalist> nativo filtra por substring literal, con
// tildes y en el orden exacto en que se escribio, asi que "cocowey" (sin tilde) o "leches veneciana"
// (palabras invertidas) no encontraban productos que si existian. Compartido por gastos.js,
// pedidos.js y reportes.js.
//
// crearBuscadorProducto({ input, obtenerProductos, onSeleccionar, etiqueta, detalle }) -> { destruir }
//   input            -> el <input type="text"> ya existente en el DOM (ya no hace falta list=)
//   obtenerProductos -> () => array de productos vigente (se llama en cada tecla, para reflejar
//                        recargas del catalogo sin tener que reconstruir el buscador)
//   onSeleccionar    -> callback(producto) al elegir una opcion (el input ya queda con la etiqueta)
//   etiqueta         -> opcional, (producto) => string que queda escrito en el input al elegir
//                        (por defecto producto.nombre)
//   detalle          -> opcional, (producto) => string secundario de cada opcion (por defecto
//                        "stock: N")
function crearBuscadorProducto({ input, obtenerProductos, onSeleccionar, etiqueta, detalle }) {
    const obtenerEtiqueta = etiqueta || ((p) => p.nombre || 'Producto');
    const obtenerDetalle = detalle || ((p) => `stock: ${p.stock ?? 0}`);
    const LIMITE = 200;

    const dropdown = document.createElement('div');
    dropdown.className = 'producto-buscador-dropdown';
    dropdown.style.display = 'none';
    document.body.appendChild(dropdown);

    let coincidencias = [];
    let indiceActivo = -1;

    function normalizar(value) {
        if (value == null) return '';
        return String(value).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    }

    function cerrar() {
        dropdown.style.display = 'none';
        indiceActivo = -1;
    }

    // position: fixed + top/left calculados aqui, mismo motivo que .cat-multiselect-panel (ver
    // categoriaFiltro.js): evita que el overflow:hidden de un ancestro (o el propio modal) recorte
    // el panel.
    function posicionar() {
        const margen = 4;
        const rect = input.getBoundingClientRect();
        const espacioAbajo = window.innerHeight - rect.bottom - margen;
        const espacioArriba = rect.top - margen;
        const abrirArriba = espacioAbajo < 150 && espacioArriba > espacioAbajo;

        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.maxHeight = `${Math.max(120, Math.min(320, (abrirArriba ? espacioArriba : espacioAbajo) - 10))}px`;

        if (abrirArriba) {
            dropdown.style.top = 'auto';
            dropdown.style.bottom = `${window.innerHeight - rect.top + margen}px`;
        } else {
            dropdown.style.bottom = 'auto';
            dropdown.style.top = `${rect.bottom + margen}px`;
        }
    }

    function marcarActivo() {
        [...dropdown.children].forEach((el, i) => el.classList.toggle('activo', i === indiceActivo));
        const activo = dropdown.children[indiceActivo];
        if (activo) activo.scrollIntoView({ block: 'nearest' });
    }

    function seleccionar(producto) {
        input.value = obtenerEtiqueta(producto);
        cerrar();
        if (onSeleccionar) onSeleccionar(producto);
    }

    function renderizar() {
        const query = normalizar(input.value);
        const terms = query.split(/\s+/).filter(Boolean);
        const productos = obtenerProductos() || [];

        coincidencias = (terms.length === 0
            ? productos
            : productos.filter((p) => {
                const nombre = normalizar(p.nombre);
                const desc = normalizar(p.descripcion || '');
                return terms.every((term) => nombre.includes(term) || desc.includes(term));
            })
        ).slice(0, LIMITE);

        if (coincidencias.length === 0) {
            cerrar();
            return;
        }

        dropdown.innerHTML = '';
        coincidencias.forEach((producto) => {
            const fila = document.createElement('div');
            fila.className = 'producto-buscador-item';
            fila.innerHTML = `<span>${obtenerEtiqueta(producto)}</span><span class="producto-buscador-detalle">${obtenerDetalle(producto)}</span>`;
            // mousedown (no click): dispara antes que el blur del input, asi la seleccion no se
            // pierde cuando el usuario suelta el clic sobre el item.
            fila.addEventListener('mousedown', (e) => {
                e.preventDefault();
                seleccionar(producto);
            });
            dropdown.appendChild(fila);
        });
        indiceActivo = -1;
        posicionar();
        dropdown.style.display = 'block';
    }

    function onKeydown(e) {
        if (dropdown.style.display === 'none') return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            indiceActivo = Math.min(indiceActivo + 1, coincidencias.length - 1);
            marcarActivo();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            indiceActivo = Math.max(indiceActivo - 1, 0);
            marcarActivo();
        } else if (e.key === 'Enter') {
            const objetivo = indiceActivo >= 0 ? coincidencias[indiceActivo] : (coincidencias.length === 1 ? coincidencias[0] : null);
            if (objetivo) {
                e.preventDefault();
                seleccionar(objetivo);
            }
        } else if (e.key === 'Escape') {
            cerrar();
        }
    }

    function onDocClick(e) {
        if (e.target !== input && !dropdown.contains(e.target)) cerrar();
    }

    function onReposicionar() {
        if (dropdown.style.display !== 'none') posicionar();
    }

    input.addEventListener('input', renderizar);
    input.addEventListener('focus', renderizar);
    input.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onDocClick);
    window.addEventListener('scroll', onReposicionar, true);
    window.addEventListener('resize', onReposicionar);

    return {
        // Se llama al quitar del DOM el elemento dueno del input (ej. una fila de "producto
        // vencido" en gastos.js), para no dejar el dropdown ni los listeners de document/window
        // colgando en memoria.
        destruir() {
            input.removeEventListener('input', renderizar);
            input.removeEventListener('focus', renderizar);
            input.removeEventListener('keydown', onKeydown);
            document.removeEventListener('click', onDocClick);
            window.removeEventListener('scroll', onReposicionar, true);
            window.removeEventListener('resize', onReposicionar);
            dropdown.remove();
        }
    };
}
