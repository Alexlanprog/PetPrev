-- ==============================================================================
-- PETPREV — SCRIPT DE INICIALIZAÇÃO DE EXTENSÕES POSTGRESQL 16
-- Executado no bootstrap do container PostgreSQL (/docker-entrypoint-initdb.d/)
-- ==============================================================================

-- 1. Extensão para geração de identificadores universais únicos (UUID v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Extensão para funções criptográficas e hashing seguro
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. Extensão PostGIS para suporte geoespacial (pontos, polígonos, índices GIST)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 4. Extensão para operações de topologia PostGIS (opcional/suporte)
CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- Log de confirmação
DO $$
BEGIN
    RAISE NOTICE 'PetPrev: Extensões PostgreSQL inicializadas com sucesso (uuid-ossp, pgcrypto, postgis, postgis_topology).';
END $$;
