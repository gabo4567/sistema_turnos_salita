// Filtro de "activo" compartido por Pacientes, Médicos y Consultorios: por
// default solo lista los activos (comportamiento de siempre). Solo admin
// puede pedir ver los inactivos ('inactivos') o todos ('todos') vía query
// ?estado=... — cualquier otro rol (o un valor no reconocido) cae siempre al
// comportamiento de siempre, sin importar qué pida.
export const filtroPorActivo = (estado: unknown, rol: string | undefined): Record<string, boolean> => {
    if (rol !== 'admin') {
        return { activo: true };
    }

    if (estado === 'inactivos') {
        return { activo: false };
    }

    if (estado === 'todos') {
        return {};
    }

    return { activo: true };
};
