# ==============================================================================
# NATIVE POWERSHELL STATIC HTTP WEB SERVER (server.ps1)
# ==============================================================================
# Purpose: Serves static files (.html, .css, .js, .png, .wav, etc.) over HTTP at 
#          http://localhost:3000/ with zero external dependencies.
# ==============================================================================

$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:3000/')

try {
    $listener.Start()
} catch {
    $port = 8080
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add('http://localhost:8080/')
    $listener.Start()
}

$url = 'http://localhost:' + $port + '/'
Write-Host '=================================================='
Write-Host '🚀 Forever Incremental Web Server is Live!'
Write-Host '🔗 URL: ' $url
Write-Host '=================================================='

# Open local web browser automatically
Start-Process $url

# HTTP Request Listener Loop
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq '/') { $path = '/index.html' }

        $localPath = Join-Path $PSScriptRoot $path.TrimStart('/').Replace('/', '\')

        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            switch ($ext) {
                '.html' { $response.ContentType = 'text/html; charset=utf-8' }
                '.css'  { $response.ContentType = 'text/css; charset=utf-8' }
                '.js'   { $response.ContentType = 'text/javascript; charset=utf-8' }
                '.png'  { $response.ContentType = 'image/png' }
                '.jpg'  { $response.ContentType = 'image/jpeg' }
                '.wav'  { $response.ContentType = 'audio/wav' }
                '.json' { $response.ContentType = 'application/json' }
                Default { $response.ContentType = 'application/octet-stream' }
            }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
            $response.ContentLength64 = $msg.Length
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
        $response.Close()
    } catch {
        # Continue on aborted requests
    }
}
