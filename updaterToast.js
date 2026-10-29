// Componente UI: Notificador integrado en el Sidebar de Actualizaciones Automáticas On-Premise
(function () {
    function montarNotificadorSidebar() {
        if (!window.api || !window.api.onEstadoActualizacion) return;

        const widgetId = 'sidebar-update-widget';
        if (document.getElementById(widgetId)) return;

        const sidebarFooter = document.querySelector('.sidebar .sidebar-footer');
        const btnSyncNow = document.getElementById('btn-sync-now');
        if (!sidebarFooter) {
            // Reintentar si el DOM del sidebar aún se está construyendo
            setTimeout(montarNotificadorSidebar, 150);
            return;
        }

        const widget = document.createElement('div');
        widget.id = widgetId;
        widget.style.cssText = 'display: none; width: 100%; margin-bottom: 6px; box-sizing: border-box;';

        widget.innerHTML = `
            <button id="btn-sidebar-update" style="
                display: flex;
                align-items: center;
                width: 100%;
                padding: 10px 12px;
                border-radius: 8px;
                font-family: inherit;
                font-size: 0.95rem;
                font-weight: 600;
                gap: 12px;
                box-sizing: border-box;
                overflow: hidden;
                border: 1px solid rgba(56, 189, 248, 0.25);
                background: rgba(56, 189, 248, 0.08);
                color: #38bdf8;
                cursor: pointer;
                transition: all 0.2s ease;
            ">
                <span id="sidebar-update-icon" style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                ">🚀</span>
                <span class="sync-text-col" style="
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    overflow: hidden;
                    min-width: 0;
                ">
                    <span id="sidebar-update-title" class="sync-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Actualizar</span>
                    <span id="sidebar-update-subtitle" class="sync-next-time" style="font-size: 10px; font-weight: 400; line-height: 1.2; white-space: nowrap; color: rgba(56, 189, 248, 0.8);"></span>
                </span>
            </button>
            <div id="sidebar-update-progress-container" style="display: none; width: 100%; height: 3px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; margin-top: 4px;">
                <div id="sidebar-update-progress-bar" style="width: 0%; height: 100%; background: #38bdf8; transition: width 0.2s ease;"></div>
            </div>
        `;

        // Insertar justo antes del botón "Sincronizar Nube"
        if (btnSyncNow) {
            sidebarFooter.insertBefore(widget, btnSyncNow);
        } else {
            sidebarFooter.appendChild(widget);
        }

        const btnUpdate = document.getElementById('btn-sidebar-update');
        const iconEl = document.getElementById('sidebar-update-icon');
        const titleEl = document.getElementById('sidebar-update-title');
        const subtitleEl = document.getElementById('sidebar-update-subtitle');
        const progressContainer = document.getElementById('sidebar-update-progress-container');
        const progressBar = document.getElementById('sidebar-update-progress-bar');

        btnUpdate.addEventListener('mouseenter', () => {
            if (btnUpdate.dataset.ready === 'true') {
                btnUpdate.style.backgroundColor = '#10b981';
                btnUpdate.style.color = '#ffffff';
                btnUpdate.style.borderColor = '#10b981';
            }
        });

        btnUpdate.addEventListener('mouseleave', () => {
            if (btnUpdate.dataset.ready === 'true') {
                btnUpdate.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
                btnUpdate.style.color = '#10b981';
                btnUpdate.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }
        });

        btnUpdate.addEventListener('click', async () => {
            if (btnUpdate.dataset.ready !== 'true') return;

            btnUpdate.disabled = true;
            titleEl.innerText = 'Reiniciando...';
            subtitleEl.innerText = 'Aplicando versión...';
            try {
                await window.api.aplicarActualizacion();
            } catch (err) {
                btnUpdate.disabled = false;
                titleEl.innerText = 'Error al actualizar';
                subtitleEl.innerText = err.message;
            }
        });

        function renderEstado(estado) {
            if (!estado || !estado.disponible) {
                widget.style.display = 'none';
                return;
            }

            widget.style.display = 'block';

            if (!estado.descargada) {
                // Estado: Descargando en segundo plano
                btnUpdate.dataset.ready = 'false';
                btnUpdate.style.cursor = 'default';
                btnUpdate.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
                btnUpdate.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                btnUpdate.style.color = '#38bdf8';
                btnUpdate.title = `Descargando v${estado.version || ''} (${estado.progreso || 0}%). No interrumpe tus ventas.`;

                iconEl.innerText = '⏳';
                titleEl.innerText = `Descargando v${estado.version || ''}`;
                subtitleEl.innerText = `${estado.progreso || 0}% en segundo plano`;
                subtitleEl.style.color = 'rgba(56, 189, 248, 0.8)';

                progressContainer.style.display = 'block';
                progressBar.style.width = `${estado.progreso || 0}%`;
            } else {
                // Estado: Descarga completada, lista para aplicar
                btnUpdate.dataset.ready = 'true';
                btnUpdate.style.cursor = 'pointer';
                btnUpdate.style.backgroundColor = 'rgba(16, 185, 129, 0.12)';
                btnUpdate.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                btnUpdate.style.color = '#10b981';
                btnUpdate.title = `Versión v${estado.version || ''} lista. Clic para aplicar cuando termines de atender.`;

                iconEl.innerText = '🚀';
                titleEl.innerText = `Actualizar v${estado.version || ''}`;
                subtitleEl.innerText = estado.plataforma === 'darwin' ? 'Descargar instalador' : 'Clic para reiniciar';
                subtitleEl.style.color = 'rgba(16, 185, 129, 0.8)';

                progressContainer.style.display = 'none';
            }
        }

        window.api.onEstadoActualizacion(renderEstado);
        window.api.obtenerEstadoActualizacion().then(renderEstado).catch(() => { });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', montarNotificadorSidebar);
    } else {
        montarNotificadorSidebar();
    }
})();
