# Generate secure NEXTAUTH_SECRET
# Run: .\generate-secret.ps1

$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)

Write-Host ""
Write-Host "🔐 Generated NEXTAUTH_SECRET:" -ForegroundColor Green
Write-Host ""
Write-Host $secret -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Add this to your .env file or Render environment variables" -ForegroundColor Cyan
Write-Host ""
