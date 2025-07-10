-- Script manual para agregar campos username y username_modificado
-- Ejecutar este script directamente en la base de datos ecoalerta

-- Verificar si las columnas ya existen antes de agregarlas
DO $$
BEGIN
    -- Agregar columna username si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'username') THEN
        ALTER TABLE usuarios ADD COLUMN username VARCHAR(50);
        RAISE NOTICE 'Columna username agregada';
    ELSE
        RAISE NOTICE 'Columna username ya existe';
    END IF;
    
    -- Agregar columna username_modificado si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'username_modificado') THEN
        ALTER TABLE usuarios ADD COLUMN username_modificado BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Columna username_modificado agregada';
    ELSE
        RAISE NOTICE 'Columna username_modificado ya existe';
    END IF;
END $$;

-- Generar usernames únicos para usuarios existentes que no tengan username
UPDATE usuarios 
SET username = CONCAT('Usuario', id_usuario) 
WHERE username IS NULL OR username = '';

-- Hacer la columna username NOT NULL si no lo es ya
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'usuarios' AND column_name = 'username' AND is_nullable = 'YES') THEN
        ALTER TABLE usuarios ALTER COLUMN username SET NOT NULL;
        RAISE NOTICE 'Columna username configurada como NOT NULL';
    END IF;
END $$;

-- Agregar constraint de unicidad si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'usuarios' AND constraint_name = 'uk_usuarios_username') THEN
        ALTER TABLE usuarios ADD CONSTRAINT uk_usuarios_username UNIQUE (username);
        RAISE NOTICE 'Constraint de unicidad para username agregado';
    ELSE
        RAISE NOTICE 'Constraint de unicidad para username ya existe';
    END IF;
END $$;

-- Agregar comentarios
COMMENT ON COLUMN usuarios.username IS 'Nombre de usuario único, modificable una sola vez';
COMMENT ON COLUMN usuarios.username_modificado IS 'Indica si el usuario ya modificó su username';

SELECT 'Migración completada exitosamente' as resultado;