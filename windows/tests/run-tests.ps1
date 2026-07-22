[CmdletBinding()]
param([switch]$EngineOnly)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
. (Join-Path $Root 'scripts\common-windows.ps1')
. (Join-Path $Root 'scripts\theme-windows.ps1')

function Assert-TestCondition {
  param([Parameter(Mandatory = $true)][bool]$Condition, [Parameter(Mandatory = $true)][string]$Message)
  if (-not $Condition) { throw $Message }
}

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) "codex-document-tests-$PID-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $temporaryRoot | Out-Null

try {
  # The installed runtime must be an independently runnable, verified copy.
  $runtimeSource = Join-Path $temporaryRoot 'runtime-source'
  $runtimeState = Join-Path $temporaryRoot 'runtime-state'
  New-Item -ItemType Directory -Path $runtimeSource | Out-Null
  foreach ($directoryName in @('assets', 'scripts', 'presets')) {
    Copy-Item -LiteralPath (Join-Path $Root $directoryName) -Destination $runtimeSource -Recurse -Force
  }
  $engine = Install-DreamSkinRuntimeEngine -SkillRoot $runtimeSource -StateRoot $runtimeState
  foreach ($entryPoint in @($engine.Start, $engine.Restore, $engine.Tray)) {
    Assert-TestCondition -Condition (Test-Path -LiteralPath $entryPoint -PathType Leaf) -Message "Runtime entry point is missing: $entryPoint"
  }
  $sourceRenderer = Get-FileHash -LiteralPath (Join-Path $runtimeSource 'assets\renderer-inject.js') -Algorithm SHA256
  $engineRenderer = Get-FileHash -LiteralPath (Join-Path $engine.Root 'assets\renderer-inject.js') -Algorithm SHA256
  Assert-TestCondition -Condition ($sourceRenderer.Hash -ceq $engineRenderer.Hash) -Message 'Installed renderer does not match its verified source.'
  $themeState = Join-Path $temporaryRoot 'theme-migration-state'
  $themePaths = Initialize-DreamSkinThemeStore -SkillRoot $runtimeSource -StateRoot $themeState
  $legacyTheme = Read-DreamSkinTheme -ThemeDirectory (Join-Path $themePaths.Saved 'preset-codex-document')
  $oldSignature = 'Codex' + [string]([char]0x5c0f) + [char]0x52a9 + [char]0x624b
  $newSignature = [string]([char]0x5c71) + [char]0x59c6 + [char]0x00b7 + [char]0x5965 + [char]0x7279 + [char]0x66fc
  $customSignature = [string]([char]0x81ea) + [char]0x5b9a + [char]0x4e49 + [char]0x7f72 + [char]0x540d
  $legacyTheme.Theme.document.signature = $oldSignature
  Write-DreamSkinTheme -ThemeDirectory $legacyTheme.Directory -Theme $legacyTheme.Theme
  Initialize-DreamSkinThemeStore -SkillRoot $runtimeSource -StateRoot $themeState | Out-Null
  $migratedTheme = Read-DreamSkinTheme -ThemeDirectory (Join-Path $themePaths.Saved 'preset-codex-document')
  Assert-TestCondition -Condition ($migratedTheme.Theme.document.signature -ceq $newSignature) -Message 'Historical document signature was not migrated.'
  $migratedTheme.Theme.document.signature = $customSignature
  Write-DreamSkinTheme -ThemeDirectory $migratedTheme.Directory -Theme $migratedTheme.Theme
  Initialize-DreamSkinThemeStore -SkillRoot $runtimeSource -StateRoot $themeState | Out-Null
  $preservedTheme = Read-DreamSkinTheme -ThemeDirectory (Join-Path $themePaths.Saved 'preset-codex-document')
  Assert-TestCondition -Condition ($preservedTheme.Theme.document.signature -ceq $customSignature) -Message 'Theme migration overwrote a custom signature.'
  Remove-Item -LiteralPath $runtimeSource -Recurse -Force
  Assert-TestCondition -Condition (Test-Path -LiteralPath $engine.Start -PathType Leaf) -Message 'Installed runtime depends on the source checkout.'

  if ($EngineOnly) {
    Write-Host 'PASS: managed runtime is verified and source-independent.'
    return
  }

  # Installation and selective restore may not damage unrelated Codex settings.
  $configPath = Join-Path $temporaryRoot 'config.toml'
  $backupPath = Join-Path $temporaryRoot 'config.before-codex-document.toml'
  $original = "model = `"gpt-5`"`n`n[projects.'C:\测试项目']`ntrust_level = `"trusted`"`n`n[desktop]`nappearanceTheme = `"system`"`n"
  [System.IO.File]::WriteAllText($configPath, $original, [System.Text.UTF8Encoding]::new($false, $true))
  Install-DreamSkinBaseTheme -ConfigPath $configPath -BackupPath $backupPath
  $installed = Read-DreamSkinUtf8File -Path $configPath
  Assert-TestCondition -Condition ($installed.Contains('测试项目')) -Message 'Install changed a non-ASCII project path.'
  Assert-TestCondition -Condition (Test-Path -LiteralPath $backupPath -PathType Leaf) -Message 'Install did not create a recoverable config backup.'
  Write-DreamSkinUtf8FileAtomically -Path $configPath -Content ($installed -replace 'appearanceTheme = "system"', 'appearanceTheme = "dark"')
  Restore-DreamSkinBaseTheme -ConfigPath $configPath -BackupPath $backupPath
  $restored = Read-DreamSkinUtf8File -Path $configPath
  Assert-TestCondition -Condition ($restored.Contains('测试项目') -and $restored.Contains('appearanceTheme = "dark"')) -Message 'Selective restore overwrote unrelated or post-install settings.'

  $node = Get-DreamSkinNodeRuntime
  foreach ($arguments in @(
    @((Join-Path $Root 'scripts\injector.mjs'), '--self-test'),
    @((Join-Path $Root 'scripts\injector.mjs'), '--check-payload')
  )) {
    $result = Invoke-DreamSkinNative -FilePath $node.Path -ArgumentList $arguments
    Assert-TestCondition -Condition ($result.ExitCode -eq 0) -Message "Injector check failed: $($arguments -join ' ')"
  }

  foreach ($testFile in @(
    'document-mode.test.mjs',
    'feedback-board.test.mjs',
    'injector-bootstrap.test.mjs',
    'injector-one-shot.test.mjs'
  )) {
    $result = Invoke-DreamSkinNative -FilePath $node.Path -ArgumentList @((Join-Path $PSScriptRoot $testFile))
    Assert-TestCondition -Condition ($result.ExitCode -eq 0) -Message "Regression test failed: $testFile"
  }

  Write-Host 'PASS: runtime installation, config recovery, injector safety, and document-mode regressions.'
} finally {
  Remove-Item -LiteralPath $temporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
}
