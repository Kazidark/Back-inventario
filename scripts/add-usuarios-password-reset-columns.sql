-- Ejecutar una vez en Inventario_Sistemas_DR (SQL Server)
IF COL_LENGTH('dbo.usuarios', 'password_reset_code_hash') IS NULL
  ALTER TABLE dbo.usuarios ADD password_reset_code_hash NVARCHAR(255) NULL;

IF COL_LENGTH('dbo.usuarios', 'password_reset_expires_at') IS NULL
  ALTER TABLE dbo.usuarios ADD password_reset_expires_at DATETIME NULL;
