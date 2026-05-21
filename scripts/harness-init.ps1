param(
    [Parameter(Mandatory=$true)][string]$TaskName,
    [Parameter(Mandatory=$true)][string]$TaskRoot,
    [string]$HarnessRoot = "",
    [string]$ProjectProfile = "<PROJECT_PROFILE>",
    [string]$Prefix = "TASK"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($HarnessRoot)) {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $HarnessRoot = Split-Path -Parent $scriptRoot
}

function Convert-TaskNameToFolder([string]$name) {
    $safe = $name.Trim().ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    $safe = $safe.Trim('-')
    if ([string]::IsNullOrWhiteSpace($safe)) { throw "TaskName must contain at least one letter or number" }
    return $safe
}

$folderName = Convert-TaskNameToFolder $TaskName
$target = Join-Path $TaskRoot $folderName
New-Item -ItemType Directory -Force -Path $target | Out-Null

$handoffTemplate = Join-Path $HarnessRoot "templates\handoff.md"
$queueTemplate = Join-Path $HarnessRoot "templates\session-queue.md"

if (!(Test-Path -LiteralPath $handoffTemplate)) { throw "Missing template: $handoffTemplate" }
if (!(Test-Path -LiteralPath $queueTemplate)) { throw "Missing template: $queueTemplate" }

$handoff = Get-Content -LiteralPath $handoffTemplate -Raw -Encoding UTF8
$queue = Get-Content -LiteralPath $queueTemplate -Raw -Encoding UTF8

$taskRootToken = "<TASK_ROOT>/$folderName"
$handoff = $handoff.Replace("<Task Name>", $TaskName).Replace("<task-name>", $folderName).Replace("<PROJECT_PROFILE>", $ProjectProfile).Replace("<TASK_ROOT>/<task-name>", $taskRootToken)
$queue = $queue.Replace("<Task Name>", $TaskName).Replace("<task-name>", $folderName).Replace("<PROJECT_PROFILE>", $ProjectProfile).Replace("<TASK_ROOT>/<task-name>", $taskRootToken).Replace("TASK-", "$Prefix-")

Set-Content -LiteralPath (Join-Path $target "handoff.md") -Value $handoff -Encoding UTF8
Set-Content -LiteralPath (Join-Path $target "session-queue.md") -Value $queue -Encoding UTF8

Write-Host "Created harness task: $target"
Write-Host "Handoff:      $(Join-Path $target 'handoff.md')"
Write-Host "Queue:        $(Join-Path $target 'session-queue.md')"

