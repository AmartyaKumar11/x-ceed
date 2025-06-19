# PowerShell script to start all Python services
Write-Host "🚀 Starting All Python Services for X-ceed..." -ForegroundColor Green
Write-Host ""

# Function to cleanup processes on exit
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Shutting down Python services..." -ForegroundColor Yellow
    
    # Stop Python processes
    Get-Process python -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Python services stopped" -ForegroundColor Green
    exit
}

# Register cleanup function for Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Start Resume Analysis Service (RAG)
    Write-Host "🐍 Starting Resume Analysis Service (Port 8000)..." -ForegroundColor Cyan
    $ragJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        python simplified_rag_service.py
    }
    
    # Wait a moment
    Start-Sleep -Seconds 2
    
    # Start Enhanced Video AI Service
    Write-Host "🎬 Starting Video AI Service with Transcript (Port 8005)..." -ForegroundColor Magenta
    $videoAIJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        python video_ai_service_enhanced.py
    }
    
    # Wait for services to initialize
    Start-Sleep -Seconds 3
    
    # Check if Resume Analysis service is running
    $ragRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Resume Analysis service started and responding" -ForegroundColor Green
            $ragRunning = $true
        }
    } catch {
        Write-Host "⚠️  Resume Analysis service may still be starting..." -ForegroundColor Yellow
    }
    
    # Check if Video AI service is running
    $videoAIRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8005/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Video AI service started and responding" -ForegroundColor Green
            $videoAIRunning = $true
        }
    } catch {
        Write-Host "⚠️  Video AI service may still be starting..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 All Python Services Status:" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor White
    Write-Host "🐍 Resume Analysis API: http://localhost:8000" -ForegroundColor White
    Write-Host "📚 Resume API Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "🎬 Video AI API: http://localhost:8005" -ForegroundColor White
    Write-Host "📖 Video AI Health: http://localhost:8005/health" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Services are running in the background"
    Write-Host "🎯 Features now available:"
    Write-Host "   ✅ Resume analysis with AI-powered insights"
    Write-Host "   ✅ Video AI assistant with transcript-based notes"
    Write-Host ""
    Write-Host "🌐 To start the frontend, run: npm run dev"
    Write-Host "🔄 Or run everything together: npm run dev:full"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all Python services" -ForegroundColor Yellow
    
    # Keep the script running and monitor jobs
    while ($ragJob.State -eq "Running" -or $videoAIJob.State -eq "Running") {
        Start-Sleep -Seconds 5
        
        # Check job states
        if ($ragJob.State -ne "Running") {
            Write-Host "⚠️  Resume Analysis service stopped unexpectedly" -ForegroundColor Red
            Receive-Job $ragJob
        }
        
        if ($videoAIJob.State -ne "Running") {
            Write-Host "⚠️  Video AI service stopped unexpectedly" -ForegroundColor Red
            Receive-Job $videoAIJob
        }
    }
    
} catch {
    Write-Host "❌ Error starting Python services: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup jobs
    if ($ragJob) { Remove-Job $ragJob -Force -ErrorAction SilentlyContinue }
    if ($videoAIJob) { Remove-Job $videoAIJob -Force -ErrorAction SilentlyContinue }
    Cleanup
}
