"""Los fragmentos de voz se reubican sin sintetizar ni alterar las muestras."""
import struct
import unittest
import wave
from pathlib import Path


AUDIO = Path(__file__).resolve().parents[2] / "audio"
ORIGINAL = AUDIO / "local-inspection"
OUTPUT = AUDIO / "assets"
RATE = 44100
TAIL_SAMPLES = round(RATE * 0.30)
BREATH_START_SAMPLES = round(RATE * 2.26)


def read_pcm(path):
    with wave.open(str(path), "rb") as wav:
        assert wav.getnchannels() == 1
        assert wav.getframerate() == RATE
        assert wav.getsampwidth() == 2
        raw = wav.readframes(wav.getnframes())
    return struct.unpack("<" + "h" * (len(raw) // 2), raw)


class AudioRepartido(unittest.TestCase):
    def test_response_keeps_original_and_adds_de_from_breathing(self):
        response = read_pcm(ORIGINAL / "aed-check-response.wav")
        breath = read_pcm(ORIGINAL / "aed-check-breathing.wav")
        repaired = read_pcm(OUTPUT / "aed-check-response.wav")
        self.assertEqual(response, repaired[:len(response)])
        self.assertEqual(breath[:TAIL_SAMPLES], repaired[len(response):])
        self.assertEqual(len(response) + TAIL_SAMPLES, len(repaired))

    def test_breathing_keeps_full_speech_without_misplaced_de_or_long_pause(self):
        breath = read_pcm(ORIGINAL / "aed-check-breathing.wav")
        repaired = read_pcm(OUTPUT / "aed-check-breathing.wav")
        self.assertEqual(breath[BREATH_START_SAMPLES:], repaired)
        self.assertGreater(len(repaired), RATE)
        self.assertLess(len(repaired), RATE * 2)


if __name__ == "__main__":
    unittest.main()
