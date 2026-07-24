-- Centraliza SPA App — tablas propias en la misma Azure SQL que FSTrack.
-- Todas prefijadas centraliza_* : nada se comparte con las tablas de FSTrack.

IF OBJECT_ID('centraliza_users', 'U') IS NULL
BEGIN
  CREATE TABLE centraliza_users (
    id                     INT IDENTITY(1,1) PRIMARY KEY,
    username               NVARCHAR(100) NOT NULL UNIQUE,
    password_hash          NVARCHAR(255) NOT NULL,
    full_name              NVARCHAR(200) NULL,
    role                   NVARCHAR(20)  NOT NULL DEFAULT 'user', -- 'admin' | 'user'
    is_active              BIT           NOT NULL DEFAULT 1,
    workflow_compra_codigo NVARCHAR(100) NULL,
    workflow_compra_nombre NVARCHAR(200) NULL,
    tipodoc_compra_codigo  NVARCHAR(100) NULL,
    tipodoc_compra_nombre  NVARCHAR(200) NULL,
    created_at             DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('centraliza_user_companies', 'U') IS NULL
BEGIN
  CREATE TABLE centraliza_user_companies (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES centraliza_users(id) ON DELETE CASCADE,
    company_code NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_centraliza_user_company UNIQUE (user_id, company_code)
  );
END;

IF OBJECT_ID('centraliza_logs', 'U') IS NULL
BEGIN
  CREATE TABLE centraliza_logs (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT NULL,
    username      NVARCHAR(100) NULL,
    form_type     NVARCHAR(50)  NOT NULL,
    company_label NVARCHAR(200) NULL,
    status        NVARCHAR(20)  NOT NULL, -- 'SUCCESS' | 'ERROR'
    error_detail  NVARCHAR(1000) NULL,
    created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
