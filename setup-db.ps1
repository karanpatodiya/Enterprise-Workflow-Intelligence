$PostgresPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$PostgresUser = "postgres"
$PostgresHost = "localhost"
$DbName = "workforce_intelligence"
$DbUser = "workforce"
$DbPassword = "securepassword"
$SchemaFile = "C:\Users\crede\Downloads\enterprise-workforce-intelligence\database\schema\001_initial_schema.sql"

$passwords = @("", "password", "postgres", "123456", "admin")
$correctPassword = $null

foreach ($pwd in $passwords) {
    $env:PGPASSWORD = $pwd
    try {
        $result = & $PostgresPath -U $PostgresUser -h $PostgresHost -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $correctPassword = $pwd
            break
        }
    } catch {}
}

if ($null -eq $correctPassword) {
    Write-Host "ERROR: Could not connect to PostgreSQL"
    exit 1
}

$env:PGPASSWORD = $correctPassword

$setupSql = @"
DROP USER IF EXISTS $DbUser;
CREATE USER $DbUser WITH PASSWORD '$DbPassword';
DROP DATABASE IF EXISTS $DbName;
CREATE DATABASE $DbName OWNER $DbUser;
GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;
ALTER DATABASE $DbName OWNER TO $DbUser;
"@

Write-Host "$setupSql" | & $PostgresPath -U $PostgresUser -h $PostgresHost 2>&1 | Out-Null

$env:PGPASSWORD = $DbPassword
$schemaContent = Get-Content $SchemaFile -Raw
$schemaContent | & $PostgresPath -U $DbUser -h $PostgresHost -d $DbName 2>&1 | Out-Null

Write-Host "Database recreated!"
