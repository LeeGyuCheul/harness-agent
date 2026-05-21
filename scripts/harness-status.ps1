param(
    [string]$TaskRoot = ".",
    [string]$QueueFile = "session-queue.md"
)

$ErrorActionPreference = "Stop"

$queuePath = Join-Path $TaskRoot $QueueFile
$handoffPath = Join-Path $TaskRoot "handoff.md"

Write-Host "== Harness Task Status =="
foreach ($file in @($queuePath, $handoffPath)) {
    if (Test-Path -LiteralPath $file) {
        $item = Get-Item -LiteralPath $file
        Write-Host ("OK  {0}  {1:yyyy-MM-dd HH:mm:ss}" -f $item.FullName, $item.LastWriteTime)
    } else {
        Write-Host ("MISS {0}" -f $file)
    }
}

Write-Host ""
Write-Host "== Queue Lines =="
if (Test-Path -LiteralPath $queuePath) {
    Get-Content -LiteralPath $queuePath -Encoding UTF8 |
        Where-Object { $_ -match '^\| .*-[A-Z]{2}-[0-9]{3} ' -or $_ -match '^\| TASK-' } |
        ForEach-Object { Write-Host $_ }
} else {
    Write-Host "Queue file not found"
}
