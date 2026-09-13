# PRD — PlatoYa

**Producto:** PlatoYa  
**Tipo:** Sistema web automatizado de reserva y pedido de platos de restaurante  
**Versión del documento:** 1.0  
**Estado:** Implementado (MVP)  
**Última actualización:** 2026-09-12  

---

## 1. Resumen ejecutivo

PlatoYa permite a clientes explorar un menú, armar un pedido con dirección de entrega, pagar con PayPal y generar automáticamente una reserva/pedido en cocina. Los cocineros gestionan esos pedidos en un tablero Kanban en tiempo real (WebSocket), moviendo cada pedido entre estados hasta la entrega.

La arquitectura separa **frontend** (Next.js App Router) y **backend** (Express + Socket.IO + MongoDB/Mongoose), con autenticación JWT y roles diferenciados (`cliente` / `cocinero`).

---

## 2. Problema

Los restaurantes pequeños/medianos necesitan:

1. Recibir pedidos online con pago confirmado.
2. Coordinar la cocina sin papel ni llamadas constantes.
3. Dar visibilidad del estado del pedido (pendiente → preparado → listo → entregado).

Sin una herramienta integrada, el flujo se fragmenta entre WhatsApp, caja y cocina, con errores de estado y demoras.

---

## 3. Objetivos

### Objetivos de producto
- Permitir al cliente completar un pedido pagado de extremo a extremo.
- Registrar automáticamente el pedido pagado como reserva en cocina.
- Dar al cocinero un tablero Kanban usable en tiempo real.
- Diferenciar permisos por rol (cliente vs cocinero).

### Objetivos técnicos
- Frontend desacoplado del backend (sin API Routes de Next.js).
- Persistencia en MongoDB vía Mongoose.
- Pagos con PayPal (sandbox/producción configurable).
- Actualizaciones de cocina vía Socket.IO en el mismo proceso del API.

### Métricas de éxito (MVP)
- Cliente puede pagar y ver el pedido en historial.
- Cocinero ve el pedido nuevo en Kanban sin refrescar manualmente.
- Cambio de estado por drag-and-drop se refleja en otros clientes cocinero conectados.
- Rutas y endpoints protegidos según rol.

---

## 4. Usuarios y roles

| Rol | Quién | Capacidades |
|-----|--------|-------------|
| **Cliente** | Comensal / usuario final | Registro, login, menú, carrito, checkout PayPal, historial de pedidos |
| **Cocinero** | Personal de cocina | Login (cuenta sembrada), Kanban, cambio de estado de pedidos, CRUD de platos vía API |
| **Público** | Visitante sin sesión | Landing, ver menú, login/registro |

**Regla de registro:** el registro público **solo** crea usuarios con rol `cliente`. Las cuentas `cocinero` se crean por seed/administración.

---

## 5. Alcance

### En alcance (MVP)
- Autenticación JWT (register / login / me).
- Catálogo de platos (listado público).
- Carrito con dirección de entrega.
- Checkout con PayPal (o modo demo si no hay credenciales).
- Creación de pedido pagado (`status: pendiente`, `paymentStatus: paid`).
- Historial de pedidos del cliente.
- Dashboard Kanban del cocinero con columnas: Pendiente, En preparación, Listo, Entregado.
- Tiempo real Socket.IO (`order:created`, `order:updated`).
- Protección de rutas UI y endpoints por rol.
- UI responsive en español.
- Despliegue en Railway (servicios `web` + `server`).

### Fuera de alcance (MVP)
- Panel admin UI para CRUD de platos (la API sí existe).
- Multi-restaurante / multi-sucursal.
- Notificaciones push / SMS / email transaccional.
- Tracking GPS del repartidor.
- Facturación fiscal / tickets impresos.
- App móvil nativa.
- Redis adapter multi-instancia para Socket.IO.

---

## 6. Historias de usuario

### Cliente
1. Como visitante, quiero ver el menú para decidir qué pedir.
2. Como cliente, quiero registrarme/iniciar sesión para poder pagar.
3. Como cliente, quiero añadir platos al carrito y definir mi dirección.
4. Como cliente, quiero pagar con PayPal y confirmar que el pedido quedó registrado.
5. Como cliente, quiero ver el historial y el estado de mis pedidos.

### Cocinero
1. Como cocinero, quiero ver todos los pedidos pagados en un tablero claro.
2. Como cocinero, quiero arrastrar un pedido entre columnas para actualizar su estado.
3. Como cocinero, quiero que los pedidos nuevos aparezcan en vivo sin recargar.

---

## 7. Requisitos funcionales

### RF-01 Autenticación
- `POST /api/auth/register` → crea `cliente`.
- `POST /api/auth/login` → JWT + datos de usuario.
- `GET /api/auth/me` → perfil autenticado.
- Frontend guarda token (localStorage) y lo envía como `Authorization: Bearer`.

### RF-02 Platos
- `GET /api/dishes` → menú disponible (público).
- `POST/PATCH/DELETE /api/dishes` → solo `cocinero`.

### RF-03 Carrito y checkout (cliente)
- Carrito en cliente (contexto + localStorage).
- Dirección de entrega obligatoria antes de pagar.
- Resumen de ítems y total en checkout.

### RF-04 Pagos PayPal
- `POST /api/payments/paypal/create` → crea orden PayPal (o ID demo).
- `POST /api/payments/paypal/capture` → captura pago, persiste `Order`, emite `order:created`.
- Sin credenciales PayPal: modo demo permitido para desarrollo.

### RF-05 Pedidos
- `GET /api/orders` → cliente: propios; cocinero: todos.
- `GET /api/orders/:id` → dueño o cocinero.
- `PATCH /api/orders/:id` → solo cocinero cambia `status`; emite `order:updated`.

### RF-06 Kanban tiempo real
- Columnas: `pendiente` | `en_preparacion` | `listo` | `entregado`.
- Drag-and-drop con actualización optimista + rollback si falla el PATCH.
- Socket.IO en el mismo servidor HTTP del API; room `cocinero` tras validar JWT y rol.

### RF-07 Protección UI
- Rutas cliente: `/cart`, `/checkout`, `/orders`.
- Ruta cocina: `/cocinero`.
- Redirección según rol si el acceso no corresponde.

---

## 8. Requisitos no funcionales

| Área | Requisito |
|------|-----------|
| **UX** | Interfaz en español, limpia, moderna y responsive |
| **Rendimiento** | Menú y Kanban usables en conexiones típicas; WS con reconexión |
| **Seguridad** | Passwords con bcrypt; JWT firmado; endpoints con `authenticate` / `requireRole` |
| **Disponibilidad** | Backend y frontend desplegables de forma independiente |
| **Observabilidad** | Healthcheck API (`/api/health`); logs de build/runtime en Railway |
| **Compatibilidad** | Navegadores modernos (Chromium, Firefox, Safari) |

---

## 9. Arquitectura

```
Browser
  ├─ Next.js (web)  : UI App Router
  └─ Express + Socket.IO (server)
        └─ MongoDB (Mongoose)
```

### Componentes
- **web/** — Next.js (solo UI), Tailwind, PayPal JS SDK, `@dnd-kit`, `socket.io-client`.
- **server/** — Express REST, JWT, Mongoose, PayPal Orders API, Socket.IO.
- **MongoDB** — Atlas u otra instancia compatible.

### Modelo de datos (resumen)

| Entidad | Campos clave |
|---------|----------------|
| **User** | name, email, passwordHash, role (`cliente`\|`cocinero`) |
| **Dish** | name, description, price, imageUrl, category, available |
| **Order** | userId, items[], status, deliveryAddress, total, paypalOrderId, paymentStatus |

**OrderItem (embebido):** dishId, name, price, quantity.

---

## 10. Flujos principales

### Flujo cliente
1. Explora `/menu` → añade al carrito.
2. En `/cart` confirma ítems + dirección.
3. En `/checkout` paga con PayPal.
4. Backend captura pago → crea Order `pendiente` → emite WS.
5. Cliente ve confirmación en `/orders`.

### Flujo cocinero
1. Entra a `/cocinero` con JWT de rol cocinero.
2. Se conecta a Socket.IO (room `cocinero`).
3. Ve pedidos; arrastra entre columnas.
4. `PATCH` actualiza estado y notifica a otros cocineros.

---

## 11. Pantallas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Landing con marca PlatoYa |
| `/menu` | Público | Catálogo de platos |
| `/login` / `/register` | Público | Auth |
| `/cart` | Cliente | Carrito + dirección |
| `/checkout` | Cliente | Resumen + PayPal |
| `/orders` | Cliente | Historial |
| `/cocinero` | Cocinero | Kanban en vivo |

---

## 12. API (contrato MVP)

| Método | Ruta | Rol |
|--------|------|-----|
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Autenticado |
| GET | `/api/dishes` | Público |
| POST | `/api/dishes` | Cocinero |
| PATCH/DELETE | `/api/dishes/:id` | Cocinero |
| GET | `/api/orders` | Cliente / Cocinero |
| GET | `/api/orders/:id` | Dueño / Cocinero |
| PATCH | `/api/orders/:id` | Cocinero |
| POST | `/api/payments/paypal/create` | Cliente |
| POST | `/api/payments/paypal/capture` | Cliente |
| GET | `/api/health` | Público |

**Eventos WS:** `order:created`, `order:updated`.

---

## 13. Configuración y entornos

### Variables backend
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `PORT` (inyectado en Railway)
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_API_BASE`

### Variables frontend
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

### Cuentas seed (desarrollo)
- Cliente: `cliente@platoya.com` / `password123`
- Cocinero: `cocinero@platoya.com` / `password123`

---

## 14. Criterios de aceptación (MVP)

- [x] Registro solo como cliente; login por rol.
- [x] Menú listable sin autenticación.
- [x] Pedido pagado aparece en historial del cliente.
- [x] Pedido pagado aparece en Kanban como Pendiente.
- [x] Drag-and-drop cambia estado y persiste en MongoDB.
- [x] Segundo cocinero conectado recibe updates por WebSocket.
- [x] Cliente no puede acceder a `/cocinero`; cocinero no opera checkout de cliente.
- [x] Despliegue web + API en Railway con dominios públicos.

---

## 15. Riesgos y supuestos

| Riesgo / supuesto | Mitigación |
|-------------------|------------|
| Credenciales PayPal sandbox inválidas | Modo demo + mensajes de error claros |
| Atlas IP allowlist | Permitir acceso desde Railway / `0.0.0.0/0` en MVP |
| Una sola instancia Socket.IO | Aceptable en MVP; Redis adapter en futuro |
| `NEXT_PUBLIC_*` fijadas en build | Redeploy web al cambiar URLs de API |
| Secretos en `.env` | No versionar; configurar en Railway Variables |

---

## 16. Roadmap post-MVP (sugerido)

1. UI de administración de platos para cocinero/admin.
2. Emails de confirmación y “pedido listo”.
3. Roles adicionales (`admin`, `repartidor`).
4. Múltiples restaurantes / menús.
5. Escalado WS con Redis adapter.
6. Pruebas E2E (checkout + Kanban) y CI.

---

## 17. Referencias

- Código: monorepo `web/` + `server/`
- README de arranque local: [`README.md`](./README.md)
- Despliegue actual (Railway):
  - Web: `https://web-production-ba841.up.railway.app`
  - API: `https://server-production-cd59.up.railway.app`
