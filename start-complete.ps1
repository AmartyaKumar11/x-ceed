# Enhanced PowerShell script to start all X-ceed services
Write-Host "🚀 Starting Complete X-ceed Application Stack..." -ForegroundColor Green
Write-Host ""

# Function to cleanup processes on exit
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Shutting down all services..." -ForegroundColor Yellow
    
    # Stop Python processes
    Get-Process python -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Stop Node processes
    Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*next*" -or $_.CommandLine -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
    exit
}

# Register cleanup function for Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Start Python RAG service (Resume Analysis)
    Write-Host "🐍 Starting Python RAG Analysis Service (Port 8000)..." -ForegroundColor Cyan
    $ragJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        python simplified_rag_service.py
    }
    
    # Wait a bit for RAG service to start
    Start-Sleep -Seconds 3
    
    # Start Enhanced Video AI service
    Write-Host "🎬 Starting Enhanced Video AI Service (Port 8005)..." -ForegroundColor Magenta
    $videoAIJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        python video_ai_service_enhanced.py
    }
    
    # Wait a bit for Video AI service to start
    Start-Sleep -Seconds 3
    
    # Check if Python RAG service is running
    $ragRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Python RAG service started and responding" -ForegroundColor Green
            $ragRunning = $true
        }
    } catch {
        Write-Host "⚠️  Python RAG service may still be starting..." -ForegroundColor Yellow
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
    
    # Start Next.js development server
    Write-Host "🌐 Starting Next.js Development Server (Port 3002)..." -ForegroundColor Cyan
    $nextjsJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    
    # Wait a bit for Next.js to start
    Start-Sleep -Seconds 5
    
    # Check if Next.js is running
    $nextjsRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ Next.js server started and responding" -ForegroundColor Green
        $nextjsRunning = $true
    } catch {
        Write-Host "⚠️  Next.js server may still be starting..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 Complete X-ceed Application Stack Status:" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor White
    Write-Host "🌐 Main Website: http://localhost:3002" -ForegroundColor White
    Write-Host "📝 Resume Analysis: http://localhost:3002/resume-analyzer" -ForegroundColor White
    Write-Host "🎬 Video AI Assistant: http://localhost:3002/video-ai-assistant" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 API Services:"
    Write-Host "🐍 Python RAG API: http://localhost:8000" -ForegroundColor White
    Write-Host "📚 RAG API Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "🎬 Video AI API: http://localhost:8005" -ForegroundColor White
    Write-Host "📖 Video AI Health: http://localhost:8005/health" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 All services are running in the background"
    Write-Host "📊 The website will automatically connect to all Python services"
    Write-Host "🎯 Features available:"
    Write-Host "   - Resume analysis with AI-powered insights"
    Write-Host "   - Video AI assistant with transcript-based notes"
    Write-Host "   - Job application tracking and management"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    
    # Keep the script running and monitor jobs
    while ($ragJob.State -eq "Running" -or $videoAIJob.State -eq "Running" -or $nextjsJob.State -eq "Running") {
        Start-Sleep -Seconds 5
        
        # Check job states
        if ($ragJob.State -ne "Running") {
            Write-Host "⚠️  Python RAG service stopped unexpectedly" -ForegroundColor Red
            Receive-Job $ragJob
        }
        
        if ($videoAIJob.State -ne "Running") {
            Write-Host "⚠️  Video AI service stopped unexpectedly" -ForegroundColor Red
            Receive-Job $videoAIJob
        }
        
        if ($nextjsJob.State -ne "Running") {
            Write-Host "⚠️  Next.js service stopped unexpectedly" -ForegroundColor Red
            Receive-Job $nextjsJob
        }
    }
    
} catch {
    Write-Host "❌ Error starting services: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup jobs
    if ($ragJob) { Remove-Job $ragJob -Force -ErrorAction SilentlyContinue }
    if ($videoAIJob) { Remove-Job $videoAIJob -Force -ErrorAction SilentlyContinue }
    if ($nextjsJob) { Remove-Job $nextjsJob -Force -ErrorAction SilentlyContinue }
    Cleanup
}
