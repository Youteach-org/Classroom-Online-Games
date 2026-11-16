$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$target = 'com.avstaim.listai.tablet.armando.v4'
$knownPackages = @(
    'com.avstaim.listai.tablet.armando.v4',
    'com.avstaim.listai.tablet.armando.v3',
    'com.avstaim.listai.tablet.armando.smart',
    'com.avstaim.listai.tablet.armando'
)
$apkUrl = 'REEMPLAZAR_URL_V5'
$expectedSha256 = 'REEMPLAZAR_SHA_V5'

$command = Get-Command adb.exe -ErrorAction SilentlyContinue
$adb = if ($command) { $command.Source } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe' }
if (-not (Test-Path $adb)) { throw 'No se encontro ADB en esta computadora.' }

function Invoke-ADB([string]$arguments) {
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo.FileName = $adb
    $p.StartInfo.Arguments = $arguments
    $p.StartInfo.UseShellExecute = $false
    $p.StartInfo.RedirectStandardOutput = $true
    $p.StartInfo.RedirectStandardError = $true
    [void]$p.Start()
    $outTask = $p.StandardOutput.ReadToEndAsync()
    $errTask = $p.StandardError.ReadToEndAsync()
    $p.WaitForExit()
    return [pscustomobject]@{
        Exit = $p.ExitCode
        Output = $outTask.GetAwaiter().GetResult()
        Errors = $errTask.GetAwaiter().GetResult()
    }
}

function Assert-ADB([string]$arguments, [string]$operation) {
    $r = Invoke-ADB $arguments
    if ($r.Exit -ne 0) {
        throw "$operation : $($r.Output) $($r.Errors)"
    }
    return $r
}

function Save-BinaryTar([string]$argsText, [string]$path) {
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo.FileName = $adb
    $p.StartInfo.Arguments = $argsText
    $p.StartInfo.UseShellExecute = $false
    $p.StartInfo.RedirectStandardOutput = $true
    $p.StartInfo.RedirectStandardError = $true
    [void]$p.Start()
    $errorTask = $p.StandardError.ReadToEndAsync()
    $outputFile = [System.IO.File]::Create($path)
    try { $p.StandardOutput.BaseStream.CopyTo($outputFile) }
    finally { $outputFile.Dispose() }
    $p.WaitForExit()
    if ($p.ExitCode -ne 0) {
        throw "No se pudo respaldar la biblioteca: $($errorTask.GetAwaiter().GetResult())"
    }
}

function Sha([string]$path) {
    return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Device-Sha([string]$package, [string]$path) {
    $r = Invoke-ADB "-d shell run-as $package sha256sum $path"
    if ($r.Exit -ne 0) { return $null }
    $m = [regex]::Match($r.Output, '([a-fA-F0-9]{64})')
    if (-not $m.Success) { return $null }
    return $m.Value.ToLowerInvariant()
}

function Installed([string]$package) {
    return ((Invoke-ADB "-d shell pm path $package").Output -match 'package:')
}

function Verify-Sqlite([string]$path) {
    if (!(Test-Path $path) -or (Get-Item $path).Length -lt 4096) { return $false }
    $f = [System.IO.File]::OpenRead($path)
    try {
        $b = New-Object byte[] 16
        if ($f.Read($b, 0, 16) -ne 16) { return $false }
        return ([System.Text.Encoding]::ASCII.GetString($b, 0, 15) -eq 'SQLite format 3')
    } finally { $f.Dispose() }
}

function Verify-Tar([string]$archive) {
    if (-not (Test-Path $archive) -or (Get-Item $archive).Length -lt 512) {
        throw "El respaldo esta vacio: $archive"
    }
    $paths = @(& tar.exe -tf $archive)
    if ($LASTEXITCODE -ne 0 -or $paths.Count -eq 0) {
        throw "El respaldo no se puede abrir: $archive"
    }
    foreach ($path in $paths) {
        $n = $path.Replace('\','/')
        if ($n.StartsWith('/') -or $n -match '(^|/)\.\.(/|$)' -or $n -match '^[A-Za-z]:') {
            throw "Ruta insegura en el respaldo: $n"
        }
    }
}

function Restore-Files([string]$package, [string]$sourceDir) {
    [void](Assert-ADB "-d shell am force-stop $package" 'No se pudo detener el lector')
    [void](Assert-ADB "-d shell run-as $package pwd" 'No se puede restaurar el lector')
    $stage = '/data/local/tmp/ttp_restore_' + [guid]::NewGuid().ToString('N')
    $probe = Join-Path $folder 'PruebaDeAcceso.txt'
    $value = 'ttp_' + [guid]::NewGuid().ToString('N')
    [System.IO.File]::WriteAllText($probe, $value, [System.Text.Encoding]::ASCII)
    $candidates = @(
        "/sdcard/Android/data/$package/files/.ttp_restore_$timestamp",
        $stage
    )
    $selected = $null
    foreach ($candidate in $candidates) {
        $r = Invoke-ADB "-d shell mkdir -p $candidate"
        if ($r.Exit -ne 0) { continue }
        if ($candidate.StartsWith('/data/local/tmp/')) {
            [void](Invoke-ADB "-d shell chmod 755 $candidate")
        }
        $probeRemote = "$candidate/probe.txt"
        $push = Invoke-ADB ('-d push "' + $probe + '" "' + $probeRemote + '"')
        if ($push.Exit -ne 0) { continue }
        if ($candidate.StartsWith('/data/local/tmp/')) {
            [void](Invoke-ADB "-d shell chmod 644 $probeRemote")
        }
        $read = Invoke-ADB "-d shell run-as $package cat $probeRemote"
        if ($read.Exit -eq 0 -and $read.Output.Trim() -eq $value) {
            $selected = $candidate
            break
        }
    }
    if (-not $selected) {
        throw 'Android no permite transferir archivos al almacenamiento privado.'
    }
    try {
        $items = @(Get-ChildItem -LiteralPath $sourceDir -Recurse -Force -File | Sort-Object FullName)
        $i = 0
        foreach ($item in $items) {
            $rel = $item.FullName.Substring($sourceDir.Length + 1).Replace('\','/')
            if ($rel -notmatch '^(files|databases|shared_prefs|no_backup)/[A-Za-z0-9_./+-]+$' -or
                $rel -match '(^|/)\.\.(/|$)') {
                throw "Archivo no compatible: $rel"
            }
            $hash = Sha $item.FullName
            if ((Device-Sha $package $rel) -ne $hash) {
                $dir = $rel.Substring(0, $rel.LastIndexOf('/'))
                [void](Assert-ADB "-d shell run-as $package mkdir -p $dir" "No se pudo preparar $dir")
                $stageFile = "$selected/current.bin"
                [void](Assert-ADB ('-d push "' + $item.FullName + '" "' + $stageFile + '"') "No se pudo transferir $rel")
                if ($selected.StartsWith('/data/local/tmp/')) {
                    [void](Assert-ADB "-d shell chmod 644 $stageFile" "Sin permisos de acceso $rel")
                }
                if ((Device-Sha $package $stageFile) -ne $hash) {
                    throw "El archivo transferido no coincide: $rel"
                }
                [void](Assert-ADB "-d shell run-as $package cp $stageFile $rel" "No se pudo restaurar $rel")
            }
            if ((Device-Sha $package $rel) -ne $hash) {
                throw "Integridad incorrecta: $rel"
            }
            $i++
            if ($i % 20 -eq 0 -or $i -eq $items.Count) {
                Write-Host "Archivos verificados: $i/$($items.Count)"
            }
        }
    } finally {
        [void](Invoke-ADB "-d shell rm -rf $selected")
    }
}

$device = Invoke-ADB '-d get-state'
if ($device.Exit -ne 0 -or $device.Output.Trim() -ne 'device') {
    throw 'ADB no detecta una tablet USB autorizada. No se modifico ninguna aplicacion.'
}
if (-not (Get-Command tar.exe -ErrorAction SilentlyContinue)) {
    throw 'Windows no tiene tar.exe para comprobar los respaldos.'
}

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$folder = Join-Path $env:USERPROFILE ("TurnThePage_Respaldos\Actualizacion_V5_$timestamp")
New-Item -ItemType Directory -Path $folder -Force | Out-Null
Write-Host 'Turn the Page V5: dos paginas juntas, folios visibles, zoom conservado.' -ForegroundColor Cyan

$installedPackages = @($knownPackages | Where-Object { Installed $_ })
if ($installedPackages.Count -eq 0) {
    throw 'No se encontro ninguna instalacion anterior; no se eliminaron datos.'
}

# BACKUP ALL INSTALLED VERSIONS BEFORE ANY INSTALL/UNINSTALL.
$backups = @()
foreach ($package in $installedPackages) {
    [void](Assert-ADB "-d shell run-as $package pwd" "No se puede respaldar $package")
    [void](Assert-ADB "-d shell am force-stop $package" "No se pudo detener $package")
    $dirs = @()
    foreach ($d in @('files','databases','shared_prefs','no_backup')) {
        if ((Invoke-ADB "-d shell run-as $package test -d $d").Exit -eq 0) {
            $dirs += $d
        }
    }
    $local = Join-Path $folder ($package.Replace('.','_'))
    New-Item -ItemType Directory -Path $local -Force | Out-Null
    if ($dirs.Count -gt 0) {
        $archive = Join-Path $folder ($package.Replace('.','_') + '.tar')
        Save-BinaryTar "-d exec-out run-as $package tar -cf - $($dirs -join ' ')" $archive
        Verify-Tar $archive
        & tar.exe -xf $archive -C $local
        if ($LASTEXITCODE -ne 0) { throw "No se pudo extraer el respaldo de $package" }
    }
    $db = Join-Path $local 'databases\library.db'
    $booksDir = Join-Path $local 'files'
    $books = if (Test-Path $booksDir) {
        @(Get-ChildItem -Path $booksDir -Recurse -File -Force -Filter '*.book')
    } else { @() }
    $validDb = Verify-Sqlite $db
    $backups += [pscustomobject]@{
        Package = $package
        Directory = $local
        Database = $db
        Books = $books.Count
        Valid = $validDb
        Preference = [int]($package -eq $target)
    }
    Write-Host "$package : $($books.Count) libros; BD valida: $validDb"
}
$source = $backups | Where-Object { $_.Valid -and $_.Books -gt 0 } |
    Sort-Object -Property @{Expression='Books';Descending=$true}, @{Expression='Preference';Descending=$true} |
    Select-Object -First 1
if (-not $source) {
    throw 'No hay una biblioteca con libros y base SQLite validos. Se conservaron todas las instalaciones.'
}
Write-Host "Biblioteca principal protegida: $($source.Package), $($source.Books) libros." -ForegroundColor Green

# Save the EXACT installed V4 APK so a failed replacement can be rolled back.
$hadV4 = ($target -in $installedPackages)
$originalV4Apk = $null
if ($hadV4) {
    $paths = (Assert-ADB "-d shell pm path $target" 'No se pudo leer la instalacion V4').Output
    $paths = @($paths -split '\r?\n' | Where-Object { $_ -match '^package:' })
    if ($paths.Count -ne 1) {
        throw 'V4 usa varios APK; no es seguro sustituirla automaticamente.'
    }
    $deviceApkPath = $paths[0].Substring(8).Trim()
    $originalV4Apk = Join-Path $folder 'V4_Anterior_Recuperacion.apk'
    [void](Assert-ADB ('-d pull "' + $deviceApkPath + '" "' + $originalV4Apk + '"') 'No se pudo respaldar el APK instalado')
    if ((Get-Item $originalV4Apk).Length -lt 1000000) {
        throw 'El APK anterior no se pudo respaldar correctamente.'
    }
    Write-Host 'APK anterior respaldado para recuperacion.' -ForegroundColor Green
}

$apk = Join-Path $folder 'TurnThePage_V5_PaginasJuntas_ConFolio.apk'
Write-Host 'Obteniendo la compilacion V5 verificada...' -ForegroundColor Cyan
Invoke-WebRequest -Uri $apkUrl -UseBasicParsing -OutFile $apk
if ((Sha $apk) -ne $expectedSha256) {
    throw 'La APK V5 no coincide con su SHA-256. No se altero la tablet.'
}

$uninstalledV4 = $false
$installedNew = $false
$migrationVerified = $false
try {
    $install = Invoke-ADB ('-d install -r "' + $apk + '"')
    if ($install.Exit -ne 0 -or $install.Output -notmatch 'Success') {
        $reason = "$($install.Output) $($install.Errors)"
        if ($hadV4 -and $reason -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE') {
            Write-Host 'Firma diferente: la V4 ya esta respaldada y se sustituira con seguridad.' -ForegroundColor Yellow
            [void](Assert-ADB "-d uninstall $target" 'No se pudo sustituir la V4 anterior')
            $uninstalledV4 = $true
            $install = Invoke-ADB ('-d install "' + $apk + '"')
        }
        if ($install.Exit -ne 0 -or $install.Output -notmatch 'Success') {
            throw "No se pudo instalar V5: $($install.Output) $($install.Errors)"
        }
    }
    $installedNew = $true
    Restore-Files $target $source.Directory
    $dbHash = Sha $source.Database
    if ((Device-Sha $target 'databases/library.db') -ne $dbHash) {
        throw 'La base de datos transferida no coincide.'
    }
    $firstBook = @(Get-ChildItem -Path (Join-Path $source.Directory 'files') -Filter '*.book' -Recurse -File)[0]
    $bookRel = $firstBook.FullName.Substring($source.Directory.Length + 1).Replace('\','/')
    if ((Device-Sha $target $bookRel) -ne (Sha $firstBook.FullName)) {
        throw 'No se pudo verificar el primer libro despues de copiarlo.'
    }
    $launch = Invoke-ADB "-d shell monkey -p $target -c android.intent.category.LAUNCHER 1"
    if ($launch.Exit -ne 0) { throw 'La nueva version no se puede abrir.' }
    Start-Sleep -Seconds 3
    $alive = Invoke-ADB "-d shell pidof $target"
    if ($alive.Exit -ne 0 -or [string]::IsNullOrWhiteSpace($alive.Output)) {
        throw 'La nueva aplicacion se cerro inesperadamente.'
    }
    if ((Invoke-ADB "-d shell run-as $target test -s databases/library.db").Exit -ne 0) {
        throw 'La aplicacion no conserva la base de datos al abrir.'
    }

    $migrationVerified = $true
    # Only after fully successful, verified installation: remove all older versions.
    foreach ($old in $knownPackages) {
        if ($old -eq $target -or $old -notin $installedPackages) { continue }
        [void](Assert-ADB "-d uninstall $old" "No se pudo quitar el icono antiguo: $old")
        Write-Host "Version anterior desinstalada: $old" -ForegroundColor Green
    }
    Write-Host 'INSTALACION V5 COMPLETADA: UNA SOLA APLICACION.' -ForegroundColor Green
    Write-Host "Respaldo completo en: $folder"
} catch {
    $problem = $_.Exception.Message
    Write-Warning "La instalacion se detuvo: $problem"
    if (-not $migrationVerified -and $uninstalledV4 -and $originalV4Apk -and (Test-Path $originalV4Apk)) {
        try {
            [void](Invoke-ADB "-d uninstall $target")
            [void](Assert-ADB ('-d install "' + $originalV4Apk + '"') 'No se pudo recuperar APK anterior')
            $previous = $backups | Where-Object { $_.Package -eq $target } | Select-Object -First 1
            if ($previous) { Restore-Files $target $previous.Directory }
            Write-Host 'Se recupero la V4 anterior y sus datos.' -ForegroundColor Yellow
        } catch {
            Write-Warning 'No se pudo recuperar V4 automaticamente. El APK y los datos estan en el respaldo local.'
        }
    }
    Write-Host "Respaldos: $folder" -ForegroundColor Yellow
    throw
}
