param(
    [string]$TaskRoot = ".",
    [string]$QueueFile = "session-queue.md",
    [switch]$Strict
)

$ErrorActionPreference = "Stop"

$validRoles = @("main", "analysis", "worker", "verify", "docs")
$validStatuses = @("todo", "in-progress", "done", "blocked", "skipped")
$errors = New-Object System.Collections.Generic.List[string]

$queuePath = Join-Path $TaskRoot $QueueFile
$handoffPath = Join-Path $TaskRoot "handoff.md"

if (!(Test-Path -LiteralPath $queuePath)) { $errors.Add("Missing queue file: $queuePath") }
if (!(Test-Path -LiteralPath $handoffPath)) { $errors.Add("Missing handoff file: $handoffPath") }

if (Test-Path -LiteralPath $queuePath) {
    $lines = Get-Content -LiteralPath $queuePath -Encoding UTF8
    $queueLines = $lines | Where-Object { $_ -match '^\|\s*([A-Z][A-Z0-9]*-(PM|AN|WK|VF|DC)-[0-9]{3})\s*\|' }
    if ($queueLines.Count -eq 0) { $errors.Add("No queue item rows found") }

    foreach ($line in $queueLines) {
        $cols = $line.Trim() -split '\|' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
        if ($cols.Count -lt 6) {
            $errors.Add("Queue row has fewer than 6 columns: $line")
            continue
        }
        $id = $cols[0]
        $role = $cols[1]
        $status = $cols[2]
        if ($validRoles -notcontains $role) { $errors.Add("Invalid role '$role' in $id") }
        if ($validStatuses -notcontains $status) { $errors.Add("Invalid status '$status' in $id") }
        if ($status -eq "blocked" -and $line -notmatch '(?i)block|reason|because|needs|decision') {
            $errors.Add("Blocked item should include a blocker reason: $id")
        }
    }
}

if ($errors.Count -gt 0) {
    Write-Host "Harness validation failed:"
    foreach ($e in $errors) { Write-Host "- $e" }
    if ($Strict) { exit 1 }
    exit 0
}

Write-Host "Harness validation passed"
