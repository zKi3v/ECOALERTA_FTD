# Script de PowerShell para configurar PostgreSQL con PostGIS para EcoAlerta
# Ejecutar como administrador

Write-Host "=== Configuración de Base de Datos PostgreSQL para EcoAlerta ===" -ForegroundColor Green

# Verificar si PostgreSQL está instalado
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgPath) {
    Write-Host "ERROR: PostgreSQL no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "PostgreSQL encontrado en: $($pgPath.Source)" -ForegroundColor Green

# Configuración de la base de datos
$dbName = "ecoalerta"
$username = "pgadmin"
$password = "pgadmin123"

Write-Host "Configurando base de datos '$dbName' con usuario '$username'..." -ForegroundColor Yellow

# Crear la base de datos (conectándose como postgres)
Write-Host "Creando base de datos..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres"  # Asume que la contraseña de postgres es 'postgres'
try {
    psql -U postgres -c "CREATE DATABASE $dbName;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Base de datos '$dbName' creada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "La base de datos '$dbName' ya existe o hubo un error" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error al crear la base de datos: $_" -ForegroundColor Red
}

# Crear usuario si no existe
Write-Host "Creando usuario '$username'..." -ForegroundColor Yellow
try {
    psql -U postgres -c "CREATE USER $username WITH PASSWORD '$password';" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Usuario '$username' creado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "El usuario '$username' ya existe o hubo un error" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error al crear el usuario: $_" -ForegroundColor Red
}

# Otorgar permisos al usuario
Write-Host "Otorgando permisos..." -ForegroundColor Yellow
try {
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $username;" 2>$null
    psql -U postgres -c "ALTER USER $username CREATEDB;" 2>$null
    Write-Host "Permisos otorgados exitosamente" -ForegroundColor Green
} catch {
    Write-Host "Error al otorgar permisos: $_" -ForegroundColor Red
}

# Habilitar PostGIS en la base de datos
Write-Host "Habilitando PostGIS..." -ForegroundColor Yellow
$env:PGPASSWORD = $password
try {
    psql -U $username -d $dbName -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>$null
    psql -U $username -d $dbName -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;" 2>$null
    
    # Verificar PostGIS
    $postgisVersion = psql -U $username -d $dbName -t -c "SELECT PostGIS_Version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostGIS habilitado exitosamente. Versión: $($postgisVersion.Trim())" -ForegroundColor Green
    } else {
        Write-Host "Error al habilitar PostGIS" -ForegroundColor Red
    }
} catch {
    Write-Host "Error al configurar PostGIS: $_" -ForegroundColor Red
}

# Ejecutar script de inicialización si existe
$initScript = "./ecoalerta-backend/src/main/resources/init-database.sql"
if (Test-Path $initScript) {
    Write-Host "Ejecutando script de inicialización..." -ForegroundColor Yellow
    try {
        psql -U $username -d $dbName -f $initScript
        Write-Host "Script de inicialización ejecutado exitosamente" -ForegroundColor Green
    } catch {
        Write-Host "Error al ejecutar script de inicialización: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Script de inicialización no encontrado en: $initScript" -ForegroundColor Yellow
}

Write-Host "\n=== Configuración Completada ===" -ForegroundColor Green
Write-Host "Base de datos: $dbName" -ForegroundColor Cyan
Write-Host "Usuario: $username" -ForegroundColor Cyan
Write-Host "Contraseña: $password" -ForegroundColor Cyan
Write-Host "\nPuedes conectarte usando:" -ForegroundColor Yellow
Write-Host "psql -U $username -d $dbName" -ForegroundColor White

Write-Host "\nAhora puedes iniciar el backend de Spring Boot" -ForegroundColor Green

# Limpiar variable de entorno
$env:PGPASSWORD = $null