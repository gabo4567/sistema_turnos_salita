# sistema_turnos_salita — Backend

API REST de la Salita Municipal (bootcamp). Node.js + Express + TypeScript + MongoDB (Mongoose) + Zod.

## Reglas del proyecto (seguir siempre, sin excepción)

- **Un módulo = una carpeta en `src/modules/<entidad>/`**, con esta estructura fija: `Modelo.model.ts`, `<entidad>.controller.ts`, `<entidad>.routes.ts`, `dtos/<entidad>.schema.ts` (Zod), `types/` (Interface + Enums). No crear controllers/models sueltos fuera de ese patrón.
- **Nunca saltear la validación de Zod.** Toda ruta POST/PUT que reciba body debe pasar por `validarSchema(<Schema>)` antes del controller. No validar "a mano" dentro del controller.
- **Todas las respuestas van por `respuestaEstandar(res, status, success, message, data)`**, nunca `res.json()` directo — la única excepción es `POST /api/auth/login`, porque el contrato `{ ok, token }` lo pidió así el profe explícitamente.
- **Baja lógica siempre, nunca borrado real.** Todo DELETE marca `activo: false` (y lo que corresponda, ej. `estado: 'cancelado'` en Turno). Nunca usar `findByIdAndDelete`. Todo GET de listado filtra por `activo: true`.
- **Tipar `Request`/`Response`/`NextFunction` explícitamente** en cada controller, con los genéricos de `Request<Params, unknown, Body, Query>` que correspondan. Nada de `(req, res)` sin tipar.
- **Rutas protegidas usan el middleware `verificarToken`** (JWT real, header `Authorization: Bearer <token>`), no checks de token ad-hoc dentro del controller.
- **Nada de CommonJS.** El proyecto es `"type": "module"` — siempre `import`/`export`, nunca `require()`.
- **Secretos solo por variables de entorno** (`.env`, nunca versionado). Nunca hardcodear tokens, claves de API ni credenciales en el código.
- **Antes de dar algo por terminado**: correr `npx tsc --noEmit` (o `npm run build`) y probar el endpoint real contra el servidor (curl o Postman), no alcanza con que "compile".

## Stack

Node.js, Express 5, TypeScript, Mongoose, Zod, bcrypt, jsonwebtoken, dotenv, cors, nodemon/tsx.

## Cómo correr

```
npm install
npm run dev     # tsx + nodemon, http://localhost:3000
npm run build   # tsc -> dist/
```

## Proyecto hermano

El frontend vive en un repo aparte: `sistema_turnos_salita_frontend`. No tocar ese código desde acá.
