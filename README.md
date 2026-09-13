# PlatoYa

Sistema de reserva y pedido de platos con frontend Next.js y backend Express + Socket.IO + MongoDB.

## Requisitos iniciales

- Node.js 20+
- MongoDB local o [MongoDB Atlas](https://www.mongodb.com/atlas)

## Arranque

```bash
# 1. Instalar dependencias (desde la raíz)
npm install

# 2. Configurar entorno
cp .env.example server/.env
# Ajusta MONGODB_URI si usas Atlas
# Copia las variables NEXT_PUBLIC_* a web/.env.local (ya hay un ejemplo)

# 3. Sembrar datos demo
npm run seed

# 4. Levantar web (:3000) + API/WS (:4000)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Cuentas demo

| Rol      | Email                 | Contraseña   |
|----------|-----------------------|--------------|
| Cliente  | cliente@platoya.com   | password123  |
| Cocinero | cocinero@platoya.com  | password123  |

## Arquitectura

- `web/` — Next.js App Router (solo UI)
- `server/` — Express REST + Socket.IO + Mongoose
- Auth JWT (`Authorization: Bearer`)
- Kanban cocinero en tiempo real vía WebSocket
- PayPal sandbox opcional; sin credenciales el checkout usa **modo demo**

## Scripts

| Script            | Descripción                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Web + servidor en paralelo           |
| `npm run seed`    | Usuarios y platos de demostración    |
| `npm run build`   | Build de server y web                |

## API principal

- `POST /api/auth/register|login` · `GET /api/auth/me`
- `GET/POST /api/dishes` · `PATCH/DELETE /api/dishes/:id`
- `GET /api/orders` · `PATCH /api/orders/:id`
- `POST /api/payments/paypal/create|capture`

Socket.IO (mismo puerto 4000): eventos `order:created` y `order:updated` (room `cocinero`).
