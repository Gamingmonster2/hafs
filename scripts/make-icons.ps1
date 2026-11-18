Add-Type -AssemblyName System.Drawing

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(15, 76, 58))

  $s = $size / 512.0
  $gold = [System.Drawing.Color]::FromArgb(212, 175, 55)
  $cream = [System.Drawing.Color]::FromArgb(248, 241, 220)
  $pattern = [System.Drawing.Color]::FromArgb(28, 96, 74)

  # خلفية هندسية خفيفة: ثمانية أضلاع
  $penPattern = New-Object System.Drawing.Pen($pattern, ([Math]::Max(1, 2 * $s)))
  $cx = 256 * $s; $cy = 256 * $s; $r = 205 * $s
  $pts = @()
  for ($i = 0; $i -lt 8; $i++) {
    $a = [Math]::PI / 4 * $i - [Math]::PI / 8
    $pts += New-Object System.Drawing.PointF(($cx + $r * [Math]::Cos($a)), ($cy + $r * [Math]::Sin($a)))
  }
  $g.DrawPolygon($penPattern, $pts)
  $r2 = 165 * $s
  $pts2 = @()
  for ($i = 0; $i -lt 8; $i++) {
    $a = [Math]::PI / 4 * $i
    $pts2 += New-Object System.Drawing.PointF(($cx + $r2 * [Math]::Cos($a)), ($cy + $r2 * [Math]::Sin($a)))
  }
  $g.DrawPolygon($penPattern, $pts2)

  # المصحف المفتوح
  $penGold = New-Object System.Drawing.Pen($gold, ([Math]::Max(2, 6 * $s)))
  $brushCream = New-Object System.Drawing.SolidBrush($cream)
  $left = @(
    (New-Object System.Drawing.PointF((256 * $s), (150 * $s))),
    (New-Object System.Drawing.PointF((118 * $s), (178 * $s))),
    (New-Object System.Drawing.PointF((118 * $s), (352 * $s))),
    (New-Object System.Drawing.PointF((256 * $s), (326 * $s)))
  )
  $right = @(
    (New-Object System.Drawing.PointF((256 * $s), (150 * $s))),
    (New-Object System.Drawing.PointF((394 * $s), (178 * $s))),
    (New-Object System.Drawing.PointF((394 * $s), (352 * $s))),
    (New-Object System.Drawing.PointF((256 * $s), (326 * $s)))
  )
  foreach ($poly in @($left, $right)) {
    $g.FillPolygon($brushCream, $poly)
    $g.DrawPolygon($penGold, $poly)
  }

  # العمود الفقري وخطوط الصفحات
  $g.DrawLine($penGold, (New-Object System.Drawing.PointF((256 * $s), (152 * $s))), (New-Object System.Drawing.PointF((256 * $s), (324 * $s))))
  $penThin = New-Object System.Drawing.Pen($gold, ([Math]::Max(1, 3 * $s)))
  foreach ($y in @(212, 244, 276)) {
    $g.DrawLine($penThin, (New-Object System.Drawing.PointF((145 * $s), ($y * $s))), (New-Object System.Drawing.PointF((235 * $s), (($y - 8) * $s))))
    $g.DrawLine($penThin, (New-Object System.Drawing.PointF((277 * $s), (($y - 8) * $s))), (New-Object System.Drawing.PointF((367 * $s), ($y * $s))))
  }

  # نجمة صغيرة أعلى المصحف
  $brushStar = New-Object System.Drawing.SolidBrush($gold)
  $star = @()
  for ($i = 0; $i -lt 10; $i++) {
    $a = [Math]::PI / 5 * $i - [Math]::PI / 2
    $rr = if ($i % 2 -eq 0) { 20 * $s } else { 9 * $s }
    $star += New-Object System.Drawing.PointF(($cx + $rr * [Math]::Cos($a)), ((112 * $s) + $rr * [Math]::Sin($a)))
  }
  $g.FillPolygon($brushStar, $star)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "created $path ($size)"
}

$dir = Join-Path $PSScriptRoot '..\public'
New-Icon 512 (Join-Path $dir 'icon-512.png')
New-Icon 192 (Join-Path $dir 'icon-192.png')
New-Icon 180 (Join-Path $dir 'apple-touch-icon.png')
