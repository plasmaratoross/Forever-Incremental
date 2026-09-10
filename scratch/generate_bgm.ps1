$bgmDir = Join-Path $PSScriptRoot "..\assets\sounds\bgm"
if (!(Test-Path $bgmDir)) {
    New-Item -ItemType Directory -Force -Path $bgmDir | Out-Null
}

$sampleRate = 22050
$durationSec = 12
$totalSamples = $sampleRate * $durationSec

function Export-Wav {
    param(
        [string]$filePath,
        [float[]]$samples
    )
    $stream = [System.IO.File]::Create($filePath)
    $writer = New-Object System.IO.BinaryWriter($stream)

    $dataSize = $samples.Length * 2
    $riffHeader = [System.Text.Encoding]::ASCII.GetBytes("RIFF")
    $waveHeader = [System.Text.Encoding]::ASCII.GetBytes("WAVE")
    $fmtHeader  = [System.Text.Encoding]::ASCII.GetBytes("fmt ")
    $dataHeader = [System.Text.Encoding]::ASCII.GetBytes("data")

    $writer.Write($riffHeader)
    $writer.Write([int32](36 + $dataSize))
    $writer.Write($waveHeader)

    $writer.Write($fmtHeader)
    $writer.Write([int32]16)       # Subchunk1Size
    $writer.Write([int16]1)        # PCM
    $writer.Write([int16]1)        # Mono
    $writer.Write([int32]$sampleRate)
    $writer.Write([int32]($sampleRate * 2))
    $writer.Write([int16]2)        # BlockAlign
    $writer.Write([int16]16)       # BitsPerSample

    $writer.Write($dataHeader)
    $writer.Write([int32]$dataSize)

    foreach ($s in $samples) {
        $val = [Math]::Max(-1.0, [Math]::Min(1.0, $s))
        $intVal = if ($val -lt 0) { [int16]($val * 32768) } else { [int16]($val * 32767) }
        $writer.Write($intVal)
    }

    $writer.Close()
    $stream.Close()
}

# Track 1: Midnight Lofi Chill (E minor 9 / A minor 7 lofi chords + warm click accents)
Write-Host "Synthesizing Track 1: Midnight Lofi Chill..."
$samples1 = New-Object float[] $totalSamples
$chord1 = @(164.81, 196.00, 246.94, 293.66, 369.99)
$chord2 = @(220.00, 261.63, 329.63, 392.00)

for ($i = 0; $i -lt $totalSamples; $i++) {
    $t = $i / $sampleRate
    $progress = ($t % $durationSec) / $durationSec
    $chord = if ($progress -lt 0.5) { $chord1 } else { $chord2 }
    $env = 0.5 + 0.5 * [Math]::Sin($t * [Math]::PI * 2 * 0.25)
    
    $sample = 0.0
    foreach ($freq in $chord) {
        $sample += [Math]::Sin($t * [Math]::PI * 2 * $freq) * 0.08
        $sample += [Math]::Sin($t * [Math]::PI * 2 * $freq * 2) * 0.02
    }

    # Vinyl click accent
    $clickPhase = $t % 1.5
    if ($clickPhase -lt 0.015) {
        $rnd = ([System.Random]::new($i).NextDouble() * 2.0 - 1.0)
        $sample += $rnd * [Math]::Exp(-$clickPhase * 200) * 0.12
    }

    $samples1[$i] = $sample * $env * 0.45
}
Export-Wav (Join-Path $bgmDir "track1.wav") $samples1

# Track 2: Gentle Rain Clicks (C major 7 / F major 7 melody + rain clicks)
Write-Host "Synthesizing Track 2: Gentle Rain Clicks..."
$samples2 = New-Object float[] $totalSamples
$melody = @(261.63, 329.63, 392.00, 493.88, 440.00, 392.00, 329.63, 261.63)

for ($i = 0; $i -lt $totalSamples; $i++) {
    $t = $i / $sampleRate
    $idx = [Math]::Floor($t * 1.5) % $melody.Length
    $freq = $melody[$idx]
    $noteT = ($t * 1.5) % 1.0
    $noteEnv = [Math]::Exp(-$noteT * 3)

    $sample = [Math]::Sin($t * [Math]::PI * 2 * $freq) * $noteEnv * 0.22
    $sample += [Math]::Sin($t * [Math]::PI * 2 * $freq * 0.5) * $noteEnv * 0.15

    # Rain click tick
    $tickPhase = $t % 0.75
    if ($tickPhase -lt 0.01) {
        $rnd = ([System.Random]::new($i).NextDouble() * 2.0 - 1.0)
        $sample += $rnd * [Math]::Exp(-$tickPhase * 300) * 0.08
    }

    $samples2[$i] = $sample * 0.45
}
Export-Wav (Join-Path $bgmDir "track2.wav") $samples2

# Track 3: Cosmic Idle Groove (D major 7 / G major 7 cosmic synth pads + clicking beat)
Write-Host "Synthesizing Track 3: Cosmic Idle Groove..."
$samples3 = New-Object float[] $totalSamples
$pad = @(146.83, 185.00, 220.00, 277.18)

for ($i = 0; $i -lt $totalSamples; $i++) {
    $t = $i / $sampleRate
    $lfo = 0.5 + 0.5 * [Math]::Sin($t * [Math]::PI * 2 * 0.2)

    $sample = 0.0
    foreach ($freq in $pad) {
        $sample += [Math]::Sin($t * [Math]::PI * 2 * $freq) * 0.07
        $sample += [Math]::Sin($t * [Math]::PI * 2 * $freq * 1.5) * 0.03
    }

    # Soft click beat
    $beatPhase = $t % 0.5
    if ($beatPhase -lt 0.008) {
        $sample += [Math]::Sin($t * [Math]::PI * 2 * 1200) * [Math]::Exp(-$beatPhase * 400) * 0.1
    }

    $samples3[$i] = $sample * $lfo * 0.5
}
Export-Wav (Join-Path $bgmDir "track3.wav") $samples3

Write-Host "SUCCESS: All 3 BGM audio tracks exported to assets/sounds/bgm/!"
