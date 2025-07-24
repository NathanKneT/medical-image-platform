param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$ComposeFile = "-f ./backend/docker-compose.dev.yml"

function Show-Help {
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  build          Build the Docker images for dev" -ForegroundColor Cyan
    Write-Host "  up             Start the development environment" -ForegroundColor Cyan
    Write-Host "  down           Stop the development environment" -ForegroundColor Cyan
    Write-Host "  logs           View logs" -ForegroundColor Cyan
    Write-Host "  shell          Access the app container shell" -ForegroundColor Cyan
    Write-Host "  clean          Clean up Docker resources for dev" -ForegroundColor Cyan
    Write-Host "  start          Build and start everything for dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 <command>" -ForegroundColor Yellow
    Write-Host "Example: .\dev.ps1 start" -ForegroundColor Yellow
}

function Test-Docker {
    try {
        docker version 2>$null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

if (-not (Test-Docker)) {
    Write-Host "Docker is not running or not accessible!" -ForegroundColor Red
    Write-Host "Please make sure Docker Desktop is running and try running PowerShell as Administrator." -ForegroundColor Yellow
    exit 1
}

# All commands are now correctly scoped to the development compose file.
switch ($Command) {
    "help" { Show-Help }
    "build" {
        Write-Host "Building Docker images..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile build"
    }
    "up" {
        Write-Host "Starting development environment..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile up -d"
    }
    "down" {
        Write-Host "Stopping development environment..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile down"
    }
    "logs" {
        Write-Host "Viewing logs..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile logs -f app"
    }
    "shell" {
        Write-Host "Accessing container shell..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile exec app bash"
    }
    "test" {
        Write-Host "Running tests..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile exec app pytest"
    }
    "clean" {
        Write-Host "Cleaning up Docker resources..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile down -v"
        docker system prune -f
    }
    "start" {
        Write-Host "Building and starting development environment..." -ForegroundColor Green
        Invoke-Expression "docker compose $ComposeFile up -d --build"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Development environment started successfully!" -ForegroundColor Green
            Write-Host "API: http://localhost:8000" -ForegroundColor Yellow
            Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Yellow
        } else {
            Write-Host "Failed to start development environment" -ForegroundColor Red
        }
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
    }
}