# Sistema de Cobranza - Panel Administrativo

Panel web administrativo para gestión de cobradores, clientes y usuarios del sistema de cobranza.

## Características

- ✅ **Next.js 14** con App Router y TypeScript
- ✅ **Dashboard minimalista** con estadísticas en tiempo real
- ✅ **Gestión de Cobradores** - CRUD completo
- ✅ **Gestión de Clientes** - Visualización y administración
- ✅ **Gestión de Usuarios** - Control de acceso y permisos
- ✅ **Sincronización bidireccional** con SQL Anywhere
- ✅ **Firebase** para autenticación y base de datos
- ✅ **Diseño responsivo** con Tailwind CSS
- ✅ **Iconos** con Lucide React

## Requisitos Previos

- Node.js 18 o superior
- SQL Anywhere 17
- Cuenta de Firebase configurada
- Driver ODBC para SQL Anywhere instalado

## Instalación

1. **Instalar dependencias:**
```bash
cd sistema-cobranza-admin
npm install
```

2. **Configurar variables de entorno:**

Copia el archivo de ejemplo y configúralo:
```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SQL Anywhere Database
DB_HOST=localhost
DB_PORT=2638
DB_USER=DBA
DB_PASSWORD=tu_password
DB_NAME=cobranza
```

3. **Iniciar en modo desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
sistema-cobranza-admin/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Páginas del dashboard
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── cobradores/         # Gestión de cobradores
│   │   ├── clientes/           # Gestión de clientes
│   │   └── usuarios/           # Gestión de usuarios
│   ├── api/                    # API Routes
│   │   ├── cobradores/
│   │   ├── usuarios/
│   │   └── sync/              # Endpoints de sincronización
│   └── layout.tsx
├── components/                  # Componentes React
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── StatsCard.tsx
│   └── ui/                     # Componentes UI reutilizables
│       ├── Button.tsx
│       └── Input.tsx
├── lib/                        # Utilidades y configuración
│   ├── firebase/
│   │   ├── admin.ts           # Firebase Admin SDK
│   │   └── client.ts          # Firebase Client SDK
│   ├── database/
│   │   └── sqlanywhere.ts     # Conexión SQL Anywhere
│   ├── types.ts               # Tipos TypeScript
│   └── utils.ts               # Funciones utilitarias
└── services/                   # Lógica de negocio
    └── sync/                   # Servicios de sincronización
        ├── CobradorSyncService.ts
        └── UsuarioSyncService.ts
```

## Uso

### Sincronización de Datos

#### Sincronizar Cobradores

**Desde SQL Anywhere a Firebase:**
```bash
POST /api/sync/cobradores
{
  "periodo": "251",
  "direction": "toFirebase"
}
```

**Desde Firebase a SQL Anywhere:**
```bash
POST /api/sync/cobradores
{
  "periodo": "251",
  "direction": "toSQL"
}
```

**Sincronización bidireccional:**
```bash
POST /api/sync/cobradores
{
  "periodo": "251"
}
```

#### Sincronizar Usuarios

```bash
POST /api/sync/usuarios
{
  "periodo": "251",
  "direction": "toFirebase" | "toSQL"
}
```

### API Endpoints

#### Cobradores
- `GET /api/cobradores?periodo=251` - Listar cobradores
- `POST /api/cobradores` - Crear cobrador
- `DELETE /api/cobradores?id=xxx` - Eliminar cobrador

#### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `DELETE /api/usuarios?id=xxx` - Eliminar usuario

## Características de Sincronización

### Mantenimiento de IDs
- Los registros existentes mantienen su ID original
- La sincronización busca por campos únicos (código, usuario, etc.)
- Solo se crean nuevos registros si no existen

### Sincronización Bidireccional
1. **SQL Anywhere → Firebase**: Importa datos desde la base de datos local
2. **Firebase → SQL Anywhere**: Exporta cambios realizados en la web
3. **Automática**: Mantiene ambas bases sincronizadas

## Desarrollo

### Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

### Agregar Nuevas Entidades

1. Define los tipos en `lib/types.ts`
2. Crea el servicio de sincronización en `services/sync/`
3. Crea las API routes en `app/api/`
4. Crea las páginas en `app/dashboard/`

## Tecnologías

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: Firebase Firestore + SQL Anywhere
- **Autenticación**: Firebase Auth
- **Iconos**: Lucide React
- **ODBC**: node-odbc

## Seguridad

- Las variables de entorno nunca se suben al repositorio
- Firebase Admin SDK solo se ejecuta en el servidor
- Todas las operaciones de base de datos están protegidas
- Se recomienda implementar autenticación en todas las rutas

## Próximos Pasos

- [ ] Implementar autenticación con Firebase Auth
- [ ] Agregar sistema de roles y permisos
- [ ] Implementar sincronización automática programada
- [ ] Agregar logs de auditoría
- [ ] Implementar búsqueda y filtros avanzados
- [ ] Agregar paginación en las tablas
- [ ] Implementar exportación a Excel/PDF

## Licencia

Propietario - Todos los derechos reservados
