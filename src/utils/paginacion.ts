import { z } from 'zod';

// Compartido por los listados que admiten paginación (pacientes, medicos,
// usuarios, turnos). Si el cliente no manda `pagina`, no se pagina: se
// devuelve todo lo que matchea el filtro, igual que el comportamiento de
// siempre (lo necesitan las pantallas que piden el listado completo para
// armar un <select>, no solo las 4 pantallas con paginación nueva).
export const paginacionQuerySchema = {
    pagina: z.string().regex(/^[1-9]\d*$/, 'La página debe ser un número entero positivo').optional(),
    limite: z.string().regex(/^[1-9]\d*$/, 'El límite debe ser un número entero positivo').optional(),
};

const LIMITE_POR_DEFECTO = 10;

export interface ResultadoPaginacion {
    skip: number;
    limit?: number;
    pagina: number;
}

export const resolverPaginacion = (query: { pagina?: string; limite?: string }): ResultadoPaginacion => {
    if (!query.pagina) {
        return { skip: 0, pagina: 1 };
    }

    const pagina = Math.max(1, parseInt(query.pagina, 10));
    const limite = query.limite ? Math.max(1, parseInt(query.limite, 10)) : LIMITE_POR_DEFECTO;

    return { skip: (pagina - 1) * limite, limit: limite, pagina };
};

// Metadata que se agrega a la respuesta (fuera de `data`) solo cuando hubo
// paginación — si `limit` es undefined (no se pidió `pagina`), no se agrega
// nada y la respuesta queda igual que siempre.
export const metaPaginacion = (
    paginacion: ResultadoPaginacion,
    totalRegistros: number
): Record<string, unknown> | undefined => {
    if (paginacion.limit === undefined) return undefined;

    return {
        pagina: paginacion.pagina,
        limite: paginacion.limit,
        totalRegistros,
        totalPaginas: Math.max(1, Math.ceil(totalRegistros / paginacion.limit)),
    };
};

// Collation para que el orden alfabético respete tildes y la ñ (y no
// distinga mayúsculas de minúsculas al ordenar).
export const COLLATION_ES = { locale: 'es', strength: 2 } as const;
