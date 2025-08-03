if (Test-Path "test-groq-api.js") {
    (Get-Content "test-groq-api.js") -replace "***REMOVED***", "REMOVED_GROQ_KEY" | Set-Content "test-groq-api.js"
}
