[CmdletBinding()]
param(
  [int]$Port = 9335,
  [ValidateSet('install', 'start', 'verify')][string]$For = 'install',
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common-windows.ps1')
. (Join-Path $PSScriptRoot 'theme-windows.ps1')

try {
  $portExplicit = $PSBoundParameters.ContainsKey('Port')
  $report = Get-DreamSkinPreflightReport -For $For -Port $Port -PortExplicit:$portExplicit
  if ($Json) {
    $report | ConvertTo-Json -Depth 5
  } else {
    Format-DreamSkinPreflightReport -Report $report
  }
  if ($report.Ready) { exit 0 }
  if (@($report.Checks | Where-Object { $_.Status -eq 'unsupported' }).Count -gt 0) { exit 3 }
  exit 2
} catch {
  if ($Json) {
    [pscustomobject]@{
      schemaVersion = 1
      target = $For
      ready = $false
      checks = @([pscustomobject]@{ id = 'doctor'; status = 'unsupported'; message = $_.Exception.Message })
    } | ConvertTo-Json -Depth 5
  } else {
    Write-Host "[UNSUPPORTED] 无法完成本机预检：$($_.Exception.Message)"
  }
  exit 1
}
