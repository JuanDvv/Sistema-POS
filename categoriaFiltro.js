// Selector múltiple de categorías con casillas, compartido por ventas.js, ventas-anteriores.js y
// dashboard.js. Reemplaza el <select> nativo: un <select multiple> no deja ver de un vistazo qué
// quedó marcado ni combinar varias opciones a la vez (ej. "Con Unidades Disponibles" + una
// categoría puntual, para ver qué hay disponible solo de esa categoría).
//
// Uso: el HTML deja un <div id="filter-categoria"></div> vacío (ya no un <select>). Este módulo lo
// llena con un botón "trigger" + un panel desplegable de casillas, y expone getSeleccion()/
// actualizarNegativos() para que cada página arme su propio filtrado.
//
// crearFiltroCategorias({ contenedor, categorias, tieneNegativos, onChange }) -> { getSeleccion, actualizarNegativos }
function crearFiltroCategorias({ contenedor, categorias, tieneNegativos, onChange }) {
    const seleccion = new Set();
    let mostrarNegativos = !!tieneNegativos;

    contenedor.innerHTML = '';
    contenedor.classList.add('cat-multiselect');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cat-multiselect-trigger';
    contenedor.appendChild(trigger);

    const panel = document.createElement('div');
    panel.className = 'cat-multiselect-panel';
    panel.style.display = 'none';
    contenedor.appendChild(panel);

    function etiquetaOpcion(id) {
        if (id === 'disponibles') return '🟢 Con Unidades Disponibles';
        if (id === 'negativos') return '🔴 Con Unidades Negativas';
        const cat = categorias.find(c => c.id === id);
        return cat ? cat.nombre : id;
    }

    function actualizarTrigger() {
        if (seleccion.size === 0) {
            trigger.innerText = '-- Todas las Categorías -- ▾';
        } else if (seleccion.size === 1) {
            const [unico] = seleccion;
            trigger.innerText = `${etiquetaOpcion(unico)} ▾`;
        } else {
            trigger.innerText = `${seleccion.size} filtros seleccionados ▾`;
        }
    }

    function crearItem(id, label, esSub) {
        const fila = document.createElement('label');
        fila.className = 'cat-multiselect-item' + (esSub ? ' cat-multiselect-item-sub' : '');
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = seleccion.has(id);
        chk.addEventListener('change', () => {
            if (chk.checked) seleccion.add(id); else seleccion.delete(id);
            actualizarTrigger();
            onChange(seleccion);
        });
        fila.appendChild(chk);
        const span = document.createElement('span');
        span.innerText = (esSub ? '↳ ' : '') + label;
        fila.appendChild(span);
        return fila;
    }

    function renderPanel() {
        panel.innerHTML = '';

        const limpiar = document.createElement('div');
        limpiar.className = 'cat-multiselect-clear';
        limpiar.innerText = 'Limpiar selección';
        limpiar.addEventListener('click', () => {
            seleccion.clear();
            actualizarTrigger();
            renderPanel();
            onChange(seleccion);
        });
        panel.appendChild(limpiar);

        panel.appendChild(crearItem('disponibles', '🟢 Con Unidades Disponibles'));
        if (mostrarNegativos) {
            panel.appendChild(crearItem('negativos', '🔴 Con Unidades Negativas'));
        }

        // Árbol de categorías (mismo agrupado que antes armaba rellenarSelectorAgrupado con <optgroup>)
        const parentMap = {};
        const conPadre = [];
        categorias.forEach(cat => {
            if (!cat.categoria_padre_id) {
                parentMap[cat.id] = { id: cat.id, nombre: cat.nombre, subcategorias: [] };
            } else {
                conPadre.push(cat);
            }
        });
        conPadre.forEach(cat => {
            const pid = cat.categoria_padre_id;
            if (parentMap[pid]) {
                parentMap[pid].subcategorias.push(cat);
            } else {
                parentMap[cat.id] = { id: cat.id, nombre: cat.nombre, subcategorias: [] };
            }
        });

        Object.values(parentMap).forEach(parent => {
            panel.appendChild(crearItem(parent.id, parent.nombre, false));
            parent.subcategorias.forEach(sub => {
                panel.appendChild(crearItem(sub.id, sub.nombre, true));
            });
        });
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
        if (!contenedor.contains(e.target)) panel.style.display = 'none';
    });

    actualizarTrigger();
    renderPanel();

    return {
        getSeleccion: () => seleccion,
        // Se llama cada vez que se recarga el catálogo: la opción "Con Unidades Negativas" solo debe
        // ofrecerse mientras exista al menos un producto con stock negativo en la sucursal.
        actualizarNegativos: (valor) => {
            const nuevoValor = !!valor;
            if (nuevoValor === mostrarNegativos) return;
            mostrarNegativos = nuevoValor;
            if (!mostrarNegativos && seleccion.delete('negativos')) {
                actualizarTrigger();
                onChange(seleccion);
            }
            renderPanel();
        }
    };
}
