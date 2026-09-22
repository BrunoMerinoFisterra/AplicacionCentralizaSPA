-- Filtros opcionales de productos por cuenta.
-- Una cuenta sin filas asignadas en una dimensión conserva acceso a todos sus valores.

IF OBJECT_ID('centraliza_user_rubros', 'U') IS NULL
BEGIN
  CREATE TABLE centraliza_user_rubros (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES centraliza_users(id) ON DELETE CASCADE,
    rubro_name  NVARCHAR(200) NOT NULL,
    CONSTRAINT UQ_centraliza_user_rubro UNIQUE (user_id, rubro_name)
  );
END;

IF OBJECT_ID('centraliza_user_familias', 'U') IS NULL
BEGIN
  CREATE TABLE centraliza_user_familias (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT NOT NULL REFERENCES centraliza_users(id) ON DELETE CASCADE,
    familia_name  NVARCHAR(200) NOT NULL,
    CONSTRAINT UQ_centraliza_user_familia UNIQUE (user_id, familia_name)
  );
END;
