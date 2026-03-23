$PostgresPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = "postgres"
$setupSql = @"
DROP DATABASE IF EXISTS workforce_intelligence;
CREATE DATABASE workforce_intelligence OWNER workforce;
"@
$setupSql | & $PostgresPath -U postgres -h localhost -w 
Write-Host "Database recreated."
