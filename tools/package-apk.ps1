$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path $PSScriptRoot -Parent)
node tools/build-local.cjs
if ($LASTEXITCODE -ne 0) { throw 'Web build failed' }
node tools/build-online.cjs
if ($LASTEXITCODE -ne 0) { throw 'Online enhancement build failed' }
node tools/build-current-offline.cjs
if ($LASTEXITCODE -ne 0) { throw 'Current offline client build failed' }
node tools/patch-manifest.cjs
if ($LASTEXITCODE -ne 0) { throw 'Manifest patch failed' }
& (Join-Path $PSScriptRoot 'build-native.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Native build failed' }
$original = (Get-ChildItem -LiteralPath apk -File | Select-Object -First 1).FullName
& (Join-Path $PSScriptRoot 'build-icons.ps1')
node tools/repack-apk.cjs
if ($LASTEXITCODE -ne 0) { throw 'APK repacking failed' }
$unsigned = Join-Path $PWD 'verification/PokeSurvivor-ChineseMap-fixed-unsigned.apk'
$javaRoot = Get-ChildItem -LiteralPath tools/jre -Directory | Select-Object -First 1
$java = Join-Path $javaRoot.FullName 'bin/java.exe'
$keytool = Join-Path $javaRoot.FullName 'bin/keytool.exe'
if (-not (Test-Path -LiteralPath signing/widemap.p12)) {
    New-Item -ItemType Directory -Path signing -Force | Out-Null
    & $keytool -genkeypair -keystore signing/widemap.p12 -storetype PKCS12 -alias widemap -storepass android -keypass android -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=PokeSurvivor ChineseWideMap Local Build,OU=Personal Mod,O=Local'
    if ($LASTEXITCODE -ne 0) { throw 'Key generation failed' }
}
& $java -jar tools/uber-apk-signer.jar -a $unsigned --ks signing/widemap.p12 --ksAlias widemap --ksPass android --ksKeyPass android --overwrite
if ($LASTEXITCODE -ne 0) { throw 'APK signing failed' }
node tools/apk-compat.cjs $unsigned $original
if ($LASTEXITCODE -ne 0) { throw 'Android packaging compatibility check failed' }
Move-Item -LiteralPath $unsigned -Destination (Join-Path $PWD 'dist/PokeSurvivor-1.5.5.apk') -Force
$apk = Join-Path $PWD 'dist/PokeSurvivor-1.5.5.apk'
& $java -jar tools/uber-apk-signer.jar -a $apk -y
if ($LASTEXITCODE -ne 0) { throw 'APK verification failed' }
$hash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLower()
[IO.File]::WriteAllText((Join-Path $PWD 'dist/SHA256.txt'),($hash+'  PokeSurvivor-1.5.5.apk'+[Environment]::NewLine))
