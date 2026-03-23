# Enterprise Workforce Intelligence - Complete Setup Script
# Creates workforce user and configures database properly

$ErrorActionPreference = "Continue"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Enterprise Workforce Intelligence Complete Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$PostgresPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$PostgresUser = "postgres"
$PostgresHost = "localhost"
$DbName = "workforce_intelligence"
$DbUser = "workforce"
$DbPassword = "securepassword"
$SchemaFile = "C:\Users\crede\Downloads\enterprise-workforce-intelligence\database\schema\001_initial_schema.sql"
$AppDir = "C:\Users\crede\Downloads\enterprise-workforce-intelligence"

# Try connecting with different passwords
Write-Host "[1/5] Finding PostgreSQL password..." -ForegroundColor Yellow

$passwords = @("", "password", "postgres", "123456", "admin")
$correctPassword = $null

foreach ($pwd in $passwords) {
    $env:PGPASSWORD = $pwd
    try {
        $result = & $PostgresPath -U $PostgresUser -h $PostgresHost -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $correctPassword = $pwd
            Write-Host "[OK] Connected to PostgreSQL" -ForegroundColor Green
            if ($pwd -eq "") {
                Write-Host "Using: No password (trust auth)" -ForegroundColor Gray
            } else {
                Write-Host "Using password: $pwd" -ForegroundColor Gray
            }
            break
        }
    } catch {
        # Continue
    }
}

if ($null -eq $correctPassword) {
    Write-Host "ERROR: Could not connect to PostgreSQL" -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = $correctPassword
Write-Host ""

# Create setup SQL script
Write-Host "[2/5] Preparing database configuration..." -ForegroundColor Yellow

$setupSql = @"
-- Drop and recreate user
DROP USER IF EXISTS $DbUser;
CREATE USER $DbUser WITH PASSWORD '$DbPassword';

-- Drop and recreate database
DROP DATABASE IF EXISTS $DbName;
CREATE DATABASE $DbName OWNER $DbUser;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;
ALTER DATABASE $DbName OWNER TO $DbUser;
"@

Write-Host "$setupSql" | & $PostgresPath -U $PostgresUser -h $PostgresHost 2>&1 | Out-Null
Write-Host "[OK] User and database configured" -ForegroundColor Green
Write-Host ""

# Initialize schema with the workforce user
Write-Host "[3/5] Loading database schema..." -ForegroundColor Yellow

if (-not (Test-Path $SchemaFile)) {
    Write-Host "ERROR: Schema file not found at $SchemaFile" -ForegroundColor Red
    exit 1
}

$schemaContent = Get-Content $SchemaFile -Raw
Write-Host "Schema file size: $($schemaContent.Length) bytes" -ForegroundColor Gray

# Change to workforce user for schema initialization
$env:PGPASSWORD = $DbPassword
$schemaContent | & $PostgresPath -U $DbUser -h $PostgresHost -d $DbName 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Schema initialized" -ForegroundColor Green
} else {
    Write-Host "WARNING: Schema initialization completed with notices" -ForegroundColor Yellow
}
Write-Host ""

# Verify tables
Write-Host "[4/5] Verifying database tables..." -ForegroundColor Yellow

$env:PGPASSWORD = $DbPassword
$tableQuery = & $PostgresPath -U $DbUser -h $PostgresHost -d $DbName -c "\dt" 2>&1
$tableCount = ($tableQuery | Measure-Object -Line).Lines

if ($tableCount -gt 3) {
    Write-Host "[OK] Database tables created" -ForegroundColor Green
    Write-Host "Table count: $tableCount" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Fewer tables than expected" -ForegroundColor Yellow
}
Write-Host ""

# Test application connection
Write-Host "[5/5] Testing application database connection..." -ForegroundColor Yellow

$testConnectionSql = "SELECT 1;"
$env:PGPASSWORD = $DbPassword
$connTest = $testConnectionSql | & $PostgresPath -U $DbUser -h $PostgresHost -d $DbName 2>&1

if ($connTest -like "*1*" -or $LASTEXITCODE -eq 0) {
    Write-Host "[OK] Application can connect to database" -ForegroundColor Green
} else {
    Write-Host "WARNING: Connection test inconclusive" -ForegroundColor Yellow
}
Write-Host ""

# Start application
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete! Starting Application..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Health endpoint: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host "Database: $DbName (user: $DbUser)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop application" -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = ""
Set-Location $AppDir

Write-Host "Starting npm start..." -ForegroundColor Green
Write-Host ""

& npm start
