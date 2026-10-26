"""Mueve el 'de' de RESPONDE del inicio del segundo audio al primero.

Los archivos originales permanecen en local-inspection; no se genera voz.
"""
from pathlib import Path
import wave


SOURCE = Path(__file__).parent
ASSETS = SOURCE.parent / "assets"
RATE = 44100
TAIL_SECONDS = 0.30
BREATH_START_SECONDS = 2.26


def read(name):
    with wave.open(str(SOURCE / name), "rb") as recording:
        assert (recording.getnchannels(), recording.getsampwidth(), recording.getframerate()) == (1, 2, RATE)
        return recording.readframes(recording.getnframes())


def write(name, samples):
    with wave.open(str(ASSETS / name), "wb") as recording:
        recording.setnchannels(1)
        recording.setsampwidth(2)
        recording.setframerate(RATE)
        recording.writeframes(samples)


def main():
    response = read("aed-check-response.wav")
    breathing = read("aed-check-breathing.wav")
    # Cada muestra es de 2 bytes (mono PCM 16-bit).
    ending = breathing[:round(TAIL_SECONDS * RATE) * 2]
    complete_breathing = breathing[round(BREATH_START_SECONDS * RATE) * 2:]
    write("aed-check-response.wav", response + ending)
    write("aed-check-breathing.wav", complete_breathing)
    print(f"Respuesta: {(len(response)+len(ending)) / (2*RATE):.3f} s (incluye 'de' recuperado)")
    print(f"Respiración: {len(complete_breathing) / (2*RATE):.3f} s (sin el 'de' ajeno ni pausa larga)")


if __name__ == "__main__":
    main()
