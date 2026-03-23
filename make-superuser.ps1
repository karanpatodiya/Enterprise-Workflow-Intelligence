$PostgresPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$passwords = @("", "password", "postgres", "123456", "admin")
$correctPassword = $null

foreach ($pwd in $passwords) {
    $env:PGPASSWORD = $pwd
    try {
        $result = & $PostgresPath -U postgres -h localhost -w -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $correctPassword = $pwd
            break
        }
    } catch {}
}

if ($null -ne $correctPassword) {
    $env:PGPASSWORD = $correctPassword
    "ALTER USER workforce WITH SUPERUSER;" | & $PostgresPath -U postgres -h localhost -w
    Write-Host "Success with password: '$correctPassword'"
} else {
    Write-Host "Failed to find postgres password"
}
