# Firebase Project Switcher Helper (PowerShell)
# Usage: .\scripts\firebase-switch.ps1 [database|hosting]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('database', 'hosting')]
    [string]$Project
)

switch ($Project) {
    'database' {
        Write-Host "🔄 Switching to jbakun-62239 (Database)..." -ForegroundColor Cyan
        firebase use jbakun-62239
        Write-Host "✅ Now using jbakun-62239" -ForegroundColor Green
    }
    'hosting' {
        Write-Host "🔄 Switching to smart-34bcc (Hosting & Auth)..." -ForegroundColor Cyan
        firebase use smart-34bcc
        Write-Host "✅ Now using smart-34bcc" -ForegroundColor Green
    }
}
