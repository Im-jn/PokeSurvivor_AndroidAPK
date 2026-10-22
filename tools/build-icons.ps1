$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$artDir = Join-Path $root 'artwork'
$original = Join-Path $artDir 'launcher-original.png'
if (-not (Test-Path -LiteralPath $original)) {
    throw 'Missing artwork/launcher-original.png'
}
$image = [Drawing.Image]::FromFile($original)
try {
    $sizes = @{ 'mdpi'=48; 'hdpi'=72; 'xhdpi'=96; 'xxhdpi'=144; 'xxxhdpi'=192 }
    foreach ($density in $sizes.Keys) {
        $dir = Join-Path $root ('android/icon-res/res/mipmap-' + $density + '-v4')
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        $size = $sizes[$density]
        $bitmap = New-Object Drawing.Bitmap($size, $size)
        $graphics = [Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.DrawImage($image, 0, 0, $size, $size)
            foreach ($name in @('ic_launcher.png','ic_launcher_round.png')) {
                $bitmap.Save((Join-Path $dir $name), [Drawing.Imaging.ImageFormat]::Png)
            }
        } finally { $graphics.Dispose(); $bitmap.Dispose() }
    }
} finally { $image.Dispose() }
Write-Output 'Prepared supplied launcher artwork at all five Android densities'
