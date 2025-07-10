# EcoAlerta - Configuración PostgreSQL con PostGIS

## 🚀 Configuración Rápida

### Prerrequisitos
- PostgreSQL 12+ con PostGIS instalado
- Java 21+
- Node.js 18+
- Angular CLI

### 1. Instalar PostgreSQL con PostGIS

**Windows:**
1. Descargar PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Durante la instalación, incluir "Stack Builder" para PostGIS
3. Ejecutar Stack Builder y seleccionar PostGIS en "Spatial Extensions"

**Verificar instalación:**
```bash
psql --version
```

### 2. Configurar Base de Datos

**Opción A: Automática (si PostgreSQL está en PATH)**
```bash
powershell -ExecutionPolicy Bypass -File .\setup-database.ps1
```

**Opción B: Manual**
```sql
-- Conectar como postgres
psql -U postgres

-- Crear base de datos y usuario
CREATE DATABASE ecoalerta;
CREATE USER pgadmin WITH PASSWORD 'pgadmin123';
GRANT ALL PRIVILEGES ON DATABASE ecoalerta TO pgadmin;
ALTER USER pgadmin CREATEDB;
\q

-- Conectar a la nueva base de datos
psql -U pgadmin -d ecoalerta

-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
SELECT PostGIS_Version();

-- Ejecutar script de inicialización
\i ecoalerta-backend/src/main/resources/init-database.sql
```

### 3. Iniciar Backend

```bash
cd ecoalerta-backend
./mvnw clean install
./mvnw spring-boot:run
```

### 4. Iniciar Frontend

```bash
npm install
npm start
```

## 🔧 Configuración Actual

### Base de Datos
- **Host**: localhost:5432
- **Base de datos**: ecoalerta
- **Usuario**: pgadmin
- **Contraseña**: pgadmin123
- **Extensiones**: PostGIS, PostGIS Topology

### Backend (Spring Boot)
- **Puerto**: 5100
- **Perfil**: PostgreSQL con PostGIS
- **DDL**: create-drop (tablas se crean automáticamente)
- **Dialecto**: PostgisDialect

### Frontend (Angular)
- **Puerto**: 4200
- **Proxy**: Configurado para backend en puerto 5100

## 📊 Características Habilitadas

### Campos Espaciales
- ✅ **Reportes**: Campo `ubicacion` (Point)
- ✅ **Posiciones Temporales**: Campo `posicion` (Point)
- ✅ **Rutas**: Campo `recorrido` (LineString)
- ✅ **Geometría Utils**: Utilidades para crear puntos geográficos

### Funcionalidades
- 🗺️ Mapas interactivos con Leaflet
- 📍 Geolocalización de reportes
- 🛣️ Trazado de rutas
- 📊 Consultas espaciales con PostGIS
- 🔍 Búsquedas por proximidad geográfica

## 🛠️ Solución de Problemas

### Error: "PostgreSQL no está instalado"
```bash
# Agregar PostgreSQL al PATH
# Buscar "Variables de entorno" → Editar Path del sistema
# Agregar: C:\Program Files\PostgreSQL\15\bin
```

### Error: "PostGIS no disponible"
```sql
-- Verificar extensiones disponibles
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name LIKE 'postgis%';

-- Si no aparece PostGIS, reinstalar con Stack Builder
```

### Error de conexión del backend
```bash
# Verificar que PostgreSQL esté ejecutándose
# Servicios de Windows → postgresql-x64-15 → Iniciar

# Verificar conexión
psql -U pgadmin -d ecoalerta -h localhost -p 5432
```

### Error: "Tablas no se crean"
- Verificar que `spring.jpa.hibernate.ddl-auto=create-drop` en `application.properties`
- Verificar logs del backend para errores de DDL
- Asegurar que el usuario `pgadmin` tenga permisos de creación

## 📁 Estructura de Archivos Modificados

```
ecoalerta-backend/
├── src/main/resources/
│   ├── application.properties          # ✅ Configurado para PostgreSQL
│   └── init-database.sql              # ✅ Script de inicialización
├── src/main/java/.../modelos/
│   ├── Reporte.java                   # ✅ Campo Point habilitado
│   ├── PosicionTemporal.java          # ✅ Campo Point habilitado
│   └── Ruta.java                      # ✅ Campo LineString habilitado
├── src/main/java/.../utilidades/
│   └── GeometriaUtils.java            # ✅ Utilidades PostGIS habilitadas
└── pom.xml                            # ✅ Dependencias PostgreSQL/PostGIS

setup-database.ps1                     # ✅ Script de configuración automática
INSTRUCCIONES-POSTGRESQL.md           # ✅ Guía detallada de instalación
```

## 🔄 Migración desde H2

Si vienes de H2, los cambios principales son:

1. **Base de datos**: De memoria (H2) → Persistente (PostgreSQL)
2. **Campos espaciales**: De coordenadas separadas → Geometrías nativas
3. **Consultas**: De cálculos manuales → Funciones PostGIS optimizadas
4. **Rendimiento**: Mejor para datos geográficos complejos

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:5100
- **Swagger/OpenAPI**: http://localhost:5100/swagger-ui.html (si está configurado)
- **pgAdmin** (si está instalado): http://localhost:80

## 📝 Notas Importantes

- Las tablas se recrean en cada inicio (`create-drop`)
- Para producción, cambiar a `spring.jpa.hibernate.ddl-auto=update`
- Los datos de prueba se cargan automáticamente desde `init-database.sql`
- PostGIS permite consultas geográficas avanzadas como distancias, intersecciones, etc.

¡La aplicación ahora está completamente configurada para usar PostgreSQL con PostGIS! 🎉