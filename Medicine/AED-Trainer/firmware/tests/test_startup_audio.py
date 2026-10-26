"""The two early DEA prompts must be intact and use the existing voice."""

import struct
import unittest
import wave
from pathlib import Path


ASSETS = Path(__file__).resolve().parents[2] / "audio" / "assets"


def samples(name):
    with wave.open(str(ASSETS / name), "rb") as w:
        assert (w.getnchannels(), w.getsampwidth(), w.getframerate()) == (1, 2, 44100)
        raw = w.readframes(w.getnframes())
        return struct.unpack("<" + "h" * (len(raw) // 2), raw)


class StartupVoiceTests(unittest.TestCase):
    def test_prompts_start_without_artificial_silence(self):
        for filename, shortest, longest in (
            ("aed-check-response.wav", 2.1, 2.5),
            ("aed-check-breathing.wav", 1.3, 1.8),
        ):
            with self.subTest(filename=filename):
                pcm = samples(filename)
                self.assertLess(shortest, len(pcm) / 44100)
                self.assertLess(len(pcm) / 44100, longest)
                # Boot preparation belongs in the audio driver, not the voice recording.
                self.assertGreater(max(map(abs, pcm[:round(0.2 * 44100)])), 100)

    def test_breathing_has_no_two_second_hole_in_the_middle(self):
        pcm = samples("aed-check-breathing.wav")
        # Inspect 0.1-second chunks; the original split had 2.119s of dead air.
        rate = 44100
        active = []
        for a in range(0, len(pcm), round(0.1 * rate)):
            chunk = pcm[a:a + round(0.1 * rate)]
            active.append(max(map(abs, chunk), default=0) > 300)
        longest_silence = 0
        streak = 0
        for live in active:
            streak = 0 if live else streak + 1
            longest_silence = max(longest_silence, streak)
        self.assertLess(longest_silence, 7, "No long silence within a spoken phrase")

if __name__ == "__main__":
    unittest.main()
