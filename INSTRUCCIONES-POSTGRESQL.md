# Instrucciones para Configurar PostgreSQL con PostGIS

## 1. Instalar PostgreSQL

### Opción A: Instalador Oficial (Recomendado)
1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecuta el instalador como administrador
3. Durante la instalación:
   - **Puerto**: 5432 (por defecto)
   - **Contraseña del superusuario (postgres)**: Anota esta contraseña
   - **Componentes**: Asegúrate de seleccionar "Stack Builder" para instalar PostGIS

### Opción B: Stack Builder para PostGIS
1. Después de instalar PostgreSQL, ejecuta "Stack Builder"
2. Selecciona tu instalación de PostgreSQL
3. En "Spatial Extensions", selecciona "PostGIS"
4. Completa la instalación

## 2. Configurar la Base de Datos

### Paso 1: Abrir pgAdmin o psql
- **pgAdmin**: Busca "pgAdmin" en el menú inicio
- **psql**: Abre "SQL Shell (psql)" desde el menú inicio

### Paso 2: Crear la base de datos (usando psql)
```sql
-- Conectarse como postgres (usar la contraseña que configuraste)
psql -U postgres

-- Crear la base de datos
CREATE DATABASE ecoalerta;

-- Crear el usuario
CREATE USER pgadmin WITH PASSWORD 'pgadmin123';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE ecoalerta TO pgadmin;
ALTER USER pgadmin CREATEDB;

-- Salir
\q
```

### Paso 3: Configurar PostGIS
```sql
-- Conectarse a la base de datos ecoalerta
psql -U pgadmin -d ecoalerta

-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verificar instalación
SELECT PostGIS_Version();
```

### Paso 4: Ejecutar script de inicialización
```sql
-- Desde psql conectado a ecoalerta
\i 'C:/Users/Kevin/Downloads/ecoalerta-frontend-master/ecoalerta-backend/src/main/resources/init-database.sql'
```

## 3. Verificar la Configuración

### Verificar conexión:
```bash
psql -U pgadmin -d ecoalerta -h localhost -p 5432
```

### Verificar PostGIS:
```sql
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE name LIKE 'postgis%';
```

## 4. Configuración Alternativa con pgAdmin (GUI)

1. **Abrir pgAdmin**
2. **Conectar al servidor PostgreSQL** (usar contraseña de postgres)
3. **Crear base de datos**:
   - Click derecho en "Databases" → "Create" → "Database"
   - Nombre: `ecoalerta`
   - Owner: `postgres`
4. **Crear usuario**:
   - Click derecho en "Login/Group Roles" → "Create" → "Login/Group Role"
   - General → Name: `pgadmin`
   - Definition → Password: `pgadmin123`
   - Privileges → Marcar "Can login?" y "Create databases?"
5. **Habilitar PostGIS**:
   - Click derecho en la base de datos "ecoalerta" → "Query Tool"
   - Ejecutar:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     CREATE EXTENSION IF NOT EXISTS postgis_topology;
     SELECT PostGIS_Version();
     ```

## 5. Solución de Problemas

### Error: "psql no se reconoce como comando"
- Agregar PostgreSQL al PATH:
  - Buscar "Variables de entorno" en Windows
  - Editar "Path" del sistema
  - Agregar: `C:\Program Files\PostgreSQL\15\bin` (ajustar versión)

### Error: "PostGIS no disponible"
- Reinstalar PostgreSQL con Stack Builder
- O instalar PostGIS manualmente desde: https://postgis.net/windows_downloads/

### Error de conexión
- Verificar que PostgreSQL esté ejecutándose:
  - Servicios de Windows → "postgresql-x64-15" debe estar "Ejecutándose"
- Verificar puerto 5432 esté disponible

## 6. Iniciar el Backend

Una vez configurada la base de datos:

```bash
cd ecoalerta-backend
./mvnw spring-boot:run
```

O desde tu IDE, ejecutar la clase principal de Spring Boot.

## Configuración Actual del Backend

- **URL**: `jdbc:postgresql://localhost:5432/ecoalerta`
- **Usuario**: `pgadmin`
- **Contraseña**: `pgadmin123`
- **Dialecto**: `PostgisDialect`
- **DDL**: `create-drop` (las tablas se crean automáticamente)

¡La aplicación creará automáticamente todas las tablas con soporte espacial cuando se inicie!