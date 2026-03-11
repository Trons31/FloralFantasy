# 🌸 Fantasía Floral — MVP

## Stack
Next.js 14 · TypeScript · TailwindCSS · Prisma · PostgreSQL  
Zustand · React Hook Form · Framer Motion · React Icons  
Cloudinary · Wompi · NextAuth · Web Push · Nodemailer

---

## 🚀 Instalación

```bash
npm install --legacy-peer-deps
cp .env.example .env        # Configurar variables
npm run db:push             # Crear tablas
npm run db:generate         # Generar cliente Prisma
node seed-admin.js          # Crear admin inicial
npm run dev
```

## 🔑 Credenciales admin por defecto
- Email: admin@fantasiafloral.com
- Password: Admin123!
- Login: http://localhost:3000/auth/login

## 📱 Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Home cliente |
| `/flores` | Catálogo con filtros |
| `/flores/[id]` | Detalle + addons |
| `/checkout` | Pago con Wompi |
| `/seguimiento` | Timeline del pedido |
| `/auth/login` | Login admin |
| `/dashboard` | Panel admin |
| `/dashboard/flores` | Gestión de flores |
| `/dashboard/productos` | Gestión de productos |
| `/dashboard/pedidos` | Kanban de pedidos |
| `/dashboard/addons` | Adicionales |
| `/dashboard/contabilidad` | Ingresos/egresos |
| `/dashboard/reportes` | Reportes por período |

## 🌸 Cloudinary
Todas las imágenes se guardan en la carpeta `fantasiaFloral`.  
Configurar en `.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## ⏱ Tiempo de preparación
Los productos tienen tiempo parametrizable: minutos, horas o días.  
El carrito calcula automáticamente el máximo y lo muestra al cliente.

## 💳 Wompi
Webhook: `POST /api/webhooks/wompi`  
Configurar la URL del webhook en el panel de Wompi.

## 🔔 Web Push
```bash
npx web-push generate-vapid-keys
# Copiar las claves al .env
```

## 🛡 Seguridad
- Middleware protege todas las rutas `/dashboard/*`
- Login en `/auth/login`
- Doble verificación: middleware + layout server-side
