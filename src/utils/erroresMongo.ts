// Type guards para narrowear errores de Mongoose/MongoDB desde `unknown`
// sin recurrir a `any` en los catch de los controllers.

interface ErrorDeValidacionMongoose {
    name: 'ValidationError';
    errors: Record<string, { message: string }>;
}

interface ErrorDeDuplicadoMongo {
    code: 11000;
    keyValue?: Record<string, unknown>;
}

export function esErrorDeValidacion(error: unknown): error is ErrorDeValidacionMongoose {
    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: unknown }).name === 'ValidationError' &&
        'errors' in error
    );
}

export function esErrorDeDuplicado(error: unknown): error is ErrorDeDuplicadoMongo {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: unknown }).code === 11000
    );
}

// Mongoose intercepta antes de llegar a Mongo cuando `unique` va con mensaje
// propio (unique: [true, 'mensaje']): tira un MongooseError sin .code, con
// el mensaje ya armado en el schema.
export function esErrorDeUnicoConMensaje(error: unknown): error is Error {
    return error instanceof Error && error.name === 'MongooseError' && error.message.includes('único');
}

export function mensajesDeValidacion(error: ErrorDeValidacionMongoose): string[] {
    return Object.values(error.errors).map((err) => err.message);
}

export function campoDuplicado(error: ErrorDeDuplicadoMongo): string {
    return Object.keys(error.keyValue ?? {})[0] ?? 'dato';
}

export function obtenerMensajeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
