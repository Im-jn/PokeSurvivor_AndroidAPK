$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
node tools/patch-cutout.cjs
if ($LASTEXITCODE -ne 0) { throw 'Native patch failed' }
node tools/patch-online-native.cjs
if ($LASTEXITCODE -ne 0) { throw 'Online native patch failed' }
node tools/patch-startup-native.cjs
if ($LASTEXITCODE -ne 0) { throw 'Startup recovery patch failed' }
node tools/build-local-resources.cjs
if ($LASTEXITCODE -ne 0) { throw 'Local static resources build failed' }
$runtime = Get-ChildItem -LiteralPath tools/jre -Directory | Select-Object -First 1
$java = Join-Path $runtime.FullName 'bin/java.exe'
& $java -jar tools/apktool.jar b android --no-apk
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath android/build/apk/classes.dex)) { throw 'Native DEX build failed' }
