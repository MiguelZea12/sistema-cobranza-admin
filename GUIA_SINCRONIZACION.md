# Guía de Sincronización

## 📊 Resumen

El sistema tiene dos componentes de sincronización:

### 1. Backend Automático (sistema-cobranza-backend)
**QUÉ SINCRONIZA:**
- ✅ Clientes (automático cada X minutos)
- ✅ Cobros (automático)
- ✅ Contratos y deudas

**CÓMO FUNCIONA:**
- Servicio Windows que corre en segundo plano
- Sincronización automática programada
- SQL Anywhere ↔ Firebase bidireccional

**ESTADO:**
- Ya está implementado y funcionando
- NO necesitas modificarlo

### 2. Panel Web (sistema-cobranza-admin)
**QUÉ SINCRONIZA:**
- ✅ Cobradores
- ✅ Usuarios y permisos

**CÓMO FUNCIONA:**
- Botón manual en el Dashboard
- API endpoints `/api/sync/*`
- SQL Anywhere → Firebase

**ESTADO:**
- ✅ Completamente funcional
- Listo para usar desde el panel web

---

## 🚀 Cómo Sincronizar

### Opción 1: Desde el Dashboard (Recomendado)

1. Abre el panel web: http://localhost:3000/dashboard
2. Haz clic en "Sincronizar SQL → Firebase"
3. Espera a que complete (muestra resultado)

**Esto sincroniza:**
- Todos los cobradores del periodo actual
- Todos los usuarios y sus permisos

### Opción 2: API Directa

**Sincronizar Cobradores:**
```bash
curl -X POST http://localhost:3000/api/sync/cobradores \
  -H "Content-Type: application/json" \
  -d '{"periodo":"251"}'
```

**Sincronizar Usuarios:**
```bash
curl -X POST http://localhost:3000/api/sync/usuarios \
  -H "Content-Type: application/json" \
  -d '{"periodo":"251"}'
```

### Opción 3: PowerShell

```powershell
# Sincronizar Cobradores
$body = @{ periodo = "251" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/cobradores" -Method POST -Body $body -ContentType "application/json"

# Sincronizar Usuarios
$body = @{ periodo = "251" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/sync/usuarios" -Method POST -Body $body -ContentType "application/json"
```

---

## ⚙️ ¿Necesitas el Backend?

### SÍ, necesitas el backend para:
- ✅ Sincronización automática de clientes
- ✅ Sincronización de cobros
- ✅ Actualización de saldos en tiempo real

### NO necesitas el backend para:
- ❌ Sincronizar cobradores (usa el panel web)
- ❌ Sincronizar usuarios (usa el panel web)

---

## 🔄 Flujo Completo de Sincronización

```
1. INICIO DEL DÍA
   └─> Panel Web: Sincronizar cobradores y usuarios

2. DURANTE EL DÍA
   └─> Backend automático sincroniza clientes cada X minutos

3. FIN DEL DÍA
   └─> Panel Web: Revisar dashboard con datos actualizados
```

---

## 📝 Configuración del Backend (Si no lo tienes corriendo)

Si necesitas iniciar el backend para sincronizar clientes:

```powershell
cd sistema-cobranza-backend
npm install
npm run build
npm start
```

O instalarlo como servicio Windows:
```powershell
npm run install-service
```

---

## 🆕 Sincronización Inicial (Primera vez)

### Paso 1: Sincronizar Cobradores
```bash
POST /api/sync/cobradores
{
  "periodo": "251",
  "direction": "toFirebase"
}
```

### Paso 2: Sincronizar Usuarios
```bash
POST /api/sync/usuarios
{
  "periodo": "251",
  "direction": "toFirebase"
}
```

### Paso 3: Verificar
- Abre el panel web
- Ve a "Cobradores" - deberías ver todos los cobradores
- Ve a "Usuarios" - deberías ver todos los usuarios

---

## 🔍 Mantenimiento de IDs

### ✅ Los IDs se mantienen automáticamente

Cuando sincronizas:
1. El sistema busca registros existentes por código/usuario
2. Si existe: actualiza los datos sin cambiar el ID
3. Si no existe: crea nuevo con ID de Firebase

**Ejemplo:**
```
SQL Anywhere: car_cobradores
  codigo: "0001"
  cobrador: "Juan Pérez"

Firebase: cobradores/abc123
  codigo: "0001"
  cobrador: "Juan Pérez"
  
Sincronización → Mantiene abc123 como ID
```

---

## 🐛 Problemas Comunes

### "Error al sincronizar"
✓ Verifica que SQL Anywhere esté corriendo
✓ Revisa las credenciales en `.env.local`
✓ Verifica que el driver ODBC esté instalado

### "No aparecen los datos"
✓ Ejecuta sincronización desde el dashboard
✓ Verifica el periodo correcto (año + trimestre)
✓ Revisa la consola del navegador para errores

### "Backend no sincroniza clientes"
✓ El backend debe estar corriendo
✓ Revisa `sistema-cobranza-backend/.env`
✓ Verifica logs en `sistema-cobranza-backend/logs/`

---

## 📅 Recomendación de Uso

### Diario:
- Backend automático manejando clientes (siempre corriendo)

### Semanal:
- Panel web: Sincronizar cobradores (si hay cambios)
- Panel web: Sincronizar usuarios (si hay cambios)

### Mensual:
- Sincronización completa desde panel web
- Verificar integridad de datos

---

## 🎯 Resumen Ejecutivo

**Para usar el sistema completo:**

1. ✅ **Panel Web** (sistema-cobranza-admin)
   - Instalar: `npm install`
   - Configurar: `.env.local`
   - Iniciar: `npm run dev`
   - Usar: Sincronizar cobradores/usuarios desde dashboard

2. ✅ **Backend** (sistema-cobranza-backend) - OPCIONAL
   - Solo si necesitas sincronización automática de clientes
   - Ya lo tienes funcionando
   - No requiere cambios

3. ✅ **App Móvil** (sistema-cobranza)
   - Para cobradores en campo
   - Lee datos de Firebase
   - Ya está funcionando

**¡Listo para usar!**
