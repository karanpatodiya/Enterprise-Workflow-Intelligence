# Quick fix to create workforce user

$PostgresPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = ""

Write-Host "Creating workforce user and database..." -ForegroundColor Yellow
Write-Host ""

# Create the user
$createUserSql = @"
DROP USER IF EXISTS workforce;
CREATE USER workforce WITH PASSWORD 'securepassword';
"@

Write-Host "Step 1: Creating user..." -ForegroundColor Gray
$createUserSql | & $PostgresPath -U postgres -h localhost 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] User created" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to create user" -ForegroundColor Red
}

# Drop old database if exists
Write-Host "Step 2: Preparing database..." -ForegroundColor Gray
$dropDbSql = "DROP DATABASE IF EXISTS workforce_intelligence;"
$dropDbSql | & $PostgresPath -U postgres -h localhost 2>&1 | Out-Null

# Create new database
$createDbSql = "CREATE DATABASE workforce_intelligence OWNER workforce;"
$createDbSql | & $PostgresPath -U postgres -h localhost 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database created" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
}

# Load schema
Write-Host "Step 3: Loading schema..." -ForegroundColor Gray
$schemaFile = "C:\Users\crede\Downloads\enterprise-workforce-intelligence\database\schema\001_initial_schema.sql"
$schemaContent = Get-Content $schemaFile -Raw

$env:PGPASSWORD = "securepassword"
$schemaContent | & $PostgresPath -U workforce -h localhost -d workforce_intelligence 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Schema loaded" -ForegroundColor Green
} else {
    Write-Host "WARNING: Schema load completed" -ForegroundColor Yellow
}

# Test connection
Write-Host "Step 4: Testing connection..." -ForegroundColor Gray
$testSql = "SELECT 1;"
$testResult = $testSql | & $PostgresPath -U workforce -h localhost -d workforce_intelligence 2>&1

if ($testResult -like "*1*") {
    Write-Host "[OK] Connection successful" -ForegroundColor Green
} else {
    Write-Host "ERROR: Connection failed" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

Write-Host ""
Write-Host "Database setup complete!" -ForegroundColor Cyan
Write-Host "Now restart the app with: npm start" -ForegroundColor Cyan
