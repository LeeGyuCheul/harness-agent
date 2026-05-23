param(
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceRoot,

    [Parameter(Mandatory = $true)]
    [string]$HarnessRoot,

    [Parameter(Mandatory = $true)]
    [string]$ProjectProfile,

    [Parameter(Mandatory = $true)]
    [string]$TaskRoot,

    [Parameter(Mandatory = $true)]
    [string]$Role,

    [Parameter(Mandatory = $true)]
    [string]$QueueId,

    [Parameter(Mandatory = $true)]
    [string]$Goal,

    [string]$ClaudePath = "claude",
    [string]$GitCmdPath = "C:\project\Git\cmd",
    [int]$MaxTurns = 8,
    [ValidateSet("acceptEdits", "auto", "bypassPermissions", "default", "dontAsk", "plan")]
    [string]$PermissionMode = "auto",
    [string[]]$AllowedTools = @(),
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

function Resolve-RequiredPath {
    param(
        [string]$PathValue,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $PathValue)) {
        throw "$Label does not exist: $PathValue"
    }

    return (Resolve-Path -LiteralPath $PathValue).Path
}

$workspace = Resolve-RequiredPath $WorkspaceRoot "WorkspaceRoot"
$harness = Resolve-RequiredPath $HarnessRoot "HarnessRoot"
$profile = Resolve-RequiredPath $ProjectProfile "ProjectProfile"
$task = Resolve-RequiredPath $TaskRoot "TaskRoot"

$runtimeAdapter = Join-Path $harness "templates\claude.md"
$handoff = Join-Path $task "handoff.md"
$queue = Join-Path $task "session-queue.md"

if (-not (Test-Path -LiteralPath $queue)) {
    $sampleQueue = Join-Path $task "sample-session-queue.md"
    if (Test-Path -LiteralPath $sampleQueue) {
        $queue = $sampleQueue
    }
}

$runtimeAdapter = Resolve-RequiredPath $runtimeAdapter "RuntimeAdapter"
$handoff = Resolve-RequiredPath $handoff "Handoff"
$queue = Resolve-RequiredPath $queue "SessionQueue"

if (Test-Path -LiteralPath $GitCmdPath) {
    $resolvedGitPath = (Resolve-Path -LiteralPath $GitCmdPath).Path
    if (($env:Path -split ';') -notcontains $resolvedGitPath) {
        $env:Path = "$resolvedGitPath;$env:Path"
    }
}

if (Test-Path -LiteralPath $ClaudePath) {
    $claudeDir = Split-Path -Parent (Resolve-Path -LiteralPath $ClaudePath).Path
    if (($env:Path -split ';') -notcontains $claudeDir) {
        $env:Path = "$claudeDir;$env:Path"
    }
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $safeQueueId = $QueueId -replace '[^A-Za-z0-9_.-]', '-'
    $OutputPath = Join-Path $task "claude-$safeQueueId-result.json"
}

$prompt = @"
You are running as Claude Code for this project.

Workspace path:
$workspace

Common harness root:
$harness

Runtime adapter:
$runtimeAdapter

Project profile:
$profile

Task root:
$task

Handoff:
$handoff

Session queue:
$queue

Read order:
1. Runtime adapter
2. Project profile
3. Handoff
4. Session queue

Assigned role:
$Role

Assigned queue item:
$QueueId

Goal:
$Goal

Rules:
- Perform only the assigned queue item.
- Work only inside the ownership boundary listed in the queue.
- Preserve user changes and changes from other agent runtimes.
- Check local git status before and after work when git is available.
- Update session-queue.md and handoff.md before stopping if this queue item requires state changes.
- Record changed files, commands run, verification result, remaining work, and blockers.
- Do not commit, push, open a PR, deploy, or sync unless the user explicitly asks for publication.
- Do not record secrets, credentials, internal URLs, customer data, raw logs, screenshots, or private project identifiers in the common harness repository.
"@

Push-Location $workspace
try {
    $claudeArgs = @(
        "-p",
        "--output-format", "json",
        "--max-turns", "$MaxTurns",
        "--permission-mode", $PermissionMode
    )

    if ($AllowedTools.Count -gt 0) {
        $claudeArgs += "--allowedTools"
        $claudeArgs += ($AllowedTools -join ",")
    }

    $claudeArgs += $prompt

    $result = & $ClaudePath @claudeArgs
    $result | Set-Content -LiteralPath $OutputPath -Encoding UTF8
    Write-Output "Claude result written to $OutputPath"
    Write-Output $result
}
finally {
    Pop-Location
}
