# Sistema de Turnos - Salita Municipal (Backend)

API REST para la gestión de turnos y pacientes de una salita municipal. Proyecto personal desarrollado siguiendo las clases del bootcamp, como ejercicio de práctica con Node.js, Express y MongoDB.

## Stack

- Node.js + Express 5
- MongoDB + Mongoose
- dotenv, ESLint, nodemon

## Estructura

```
src/
  models/       # Schemas de Mongoose (Paciente, Turno)
  controllers/  # Lógica de cada recurso
  routes/       # Definición de endpoints
  middlewares/  # Auditoría, manejo de errores
  utils/        # Helpers (respuesta estándar de la API)
```

## Cómo correrlo

1. Instalar dependencias:
   ```
   npm install
   ```
2. Crear un archivo `.env` en la raíz con:
   ```
   DATABASE_URL=<tu connection string de MongoDB>
   PORT=3000
   ENTORNO=Local
   ```
3. Levantar el servidor en modo desarrollo:
   ```
   npm run dev
   ```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/v1/turnos | Lista los turnos |
| POST | /api/v1/turnos | Crea un turno |
| DELETE | /api/v1/turnos/:id | Elimina (soft delete) un turno |
| GET | /api/v1/pacientes | Lista los pacientes |
| POST | /api/v1/pacientes | Crea un paciente |
| PUT | /api/v1/pacientes/:id | Actualiza un paciente |
| DELETE | /api/v1/pacientes/:id | Elimina un paciente |
