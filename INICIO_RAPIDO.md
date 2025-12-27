# Instalación Rápida - Sistema Cobranza Admin

Este proyecto es un panel web administrativo construido con Next.js 14, TypeScript y Firebase.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```powershell
cd sistema-cobranza-admin
npm install
```

### 2. Configurar Firebase

**Obtener credenciales de Firebase:**

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a "Configuración del proyecto" > "General"
4. En "Tus aplicaciones", copia las credenciales web
5. Ve a "Configuración del proyecto" > "Cuentas de servicio"
6. Genera una nueva clave privada (JSON)

### 3. Configurar Variables de Entorno

Crea el archivo `.env.local`:
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales.

### 4. Iniciar Servidor de Desarrollo
```powershell
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📋 Funcionalidades Implementadas

### ✅ Dashboard Principal
- Estadísticas en tiempo real
- Resumen de clientes, cobradores y usuarios
- Panel de sincronización

### ✅ Gestión de Cobradores
- Listado completo
- Crear nuevo cobrador
- Editar cobrador existente
- Eliminar cobrador
- Sincronización con SQL Anywhere

### ✅ Gestión de Clientes
- Visualización de clientes
- Información de contratos y deudas
- Sincronización automática

### ✅ Gestión de Usuarios
- Control de acceso
- Gestión de permisos
- Sincronización de usuarios y permisos

### ✅ Sincronización Bidireccional
- SQL Anywhere ↔ Firebase
- Mantiene IDs originales
- Sincronización manual o automática

## 🔧 Configuración de SQL Anywhere

Asegúrate de tener:
1. SQL Anywhere 17 instalado
2. Driver ODBC configurado
3. Base de datos accesible

Credenciales en `.env.local`:
```env
DB_HOST=localhost
DB_PORT=2638
DB_USER=DBA
DB_PASSWORD=tu_password
DB_NAME=cobranza
```

## 🎨 Diseño

- **Minimalista y profesional**
- **Iconos** en lugar de emojis (Lucide React)
- **Responsive design** con Tailwind CSS
- **Tema claro** optimizado para productividad

## 📁 Estructura de Archivos

```
app/
├── dashboard/          # Páginas principales
├── api/               # Endpoints REST
└── layout.tsx         # Layout global

components/
├── dashboard/         # Componentes del dashboard
└── ui/               # Componentes reutilizables

services/
└── sync/             # Servicios de sincronización

lib/
├── firebase/         # Configuración Firebase
├── database/         # Conexión SQL Anywhere
└── types.ts          # Tipos TypeScript
```

## 🔐 Seguridad

- Variables de entorno protegidas
- Firebase Admin SDK solo en servidor
- Validación de datos en API
- Preparado para autenticación

## 🚀 Deployment

### Build para Producción
```bash
npm run build
npm start
```

### Vercel (Recomendado)
1. Push a GitHub
2. Conecta con Vercel
3. Configura variables de entorno
4. Deploy automático

## 📞 Soporte

Para cualquier problema:
1. Revisa los logs de consola
2. Verifica las credenciales en `.env.local`
3. Asegúrate de que SQL Anywhere esté corriendo
4. Verifica la conectividad con Firebase

## 🎯 Próximos Pasos

1. **Autenticación**: Implementar login con Firebase Auth
2. **Roles**: Sistema de permisos por usuario
3. **Reportes**: Generación de reportes PDF/Excel
4. **Notificaciones**: Alertas en tiempo real
5. **Sincronización**: Programación automática

## ⚡ Performance

- Server Components por defecto
- Optimización automática de imágenes
- Code splitting automático
- Caching inteligente

---

**¡Listo para usar!** El panel administrativo está completamente funcional y listo para gestionar tu sistema de cobranza.
