# PowerShell script to start both Python service and Next.js app
Write-Host "🚀 Starting X-ceed Application Stack..." -ForegroundColor Green
Write-Host ""

# Function to cleanup processes on exit
function Cleanup {
    Write-Host ""
    Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
    
    # Stop Python processes
    Get-Process python -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "python"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    # Stop Node processes (be careful not to kill other node processes)
    Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*next*" -or $_.CommandLine -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
    exit
}

# Register cleanup function for Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    # Start Python RAG service
    Write-Host "🐍 Starting Python RAG Analysis Service..." -ForegroundColor Cyan
    $pythonJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        python simplified_rag_service.py
    }
    
    # Wait a bit for Python service to start
    Start-Sleep -Seconds 3
    
    # Check if Python service is running
    $pythonRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Python service started and responding" -ForegroundColor Green
            $pythonRunning = $true
        }
    } catch {
        Write-Host "⚠️  Python service may still be starting..." -ForegroundColor Yellow
    }
    
    # Start Next.js development server
    Write-Host "🌐 Starting Next.js Development Server..." -ForegroundColor Cyan
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
    Write-Host "🎉 Services Status:" -ForegroundColor Green
    Write-Host "🌐 Website: http://localhost:3002" -ForegroundColor White
    Write-Host "🐍 Python API: http://localhost:8000" -ForegroundColor White
    Write-Host "📚 Python API Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Both services are running in the background"
    Write-Host "📊 You can now use the resume analysis feature"
    Write-Host "🔄 The website will automatically connect to the Python service"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    
    # Keep the script running and monitor jobs
    while ($pythonJob.State -eq "Running" -or $nextjsJob.State -eq "Running") {
        Start-Sleep -Seconds 5
        
        # Check job states
        if ($pythonJob.State -ne "Running") {
            Write-Host "⚠️  Python service stopped unexpectedly" -ForegroundColor Red
            Receive-Job $pythonJob
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
    if ($pythonJob) { Remove-Job $pythonJob -Force -ErrorAction SilentlyContinue }
    if ($nextjsJob) { Remove-Job $nextjsJob -Force -ErrorAction SilentlyContinue }
    Cleanup
}
