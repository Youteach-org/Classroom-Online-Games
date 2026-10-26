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
    def test_complete_voice_starts_only_after_i2s_warmup(self):
        for filename in ("aed-check-response.wav", "aed-check-breathing.wav"):
            with self.subTest(filename=filename):
                pcm = samples(filename)
                self.assertTrue(3.7 < len(pcm) / 44100 < 5.0)
                # Never send a clipped first consonant while I2S starts.
                self.assertLess(max(map(abs, pcm[:round(1.7 * 44100)])), 20)
                self.assertGreater(max(map(abs, pcm[round(2.0 * 44100):])), 6000)

    def test_breathing_has_no_two_second_hole_in_the_middle(self):
        pcm = samples("aed-check-breathing.wav")
        # Previous source had 2.119s of internal dead air after the first
        # clipped syllable. Inspect 0.1s segments after initial pre-roll.
        rate = 44100
        active = []
        for a in range(round(1.9 * rate), len(pcm), round(0.1 * rate)):
            chunk = pcm[a:a + round(0.1 * rate)]
            active.append(max(map(abs, chunk), default=0) > 300)
        longest_silence = 0
        streak = 0
        for live in active:
            streak = 0 if live else streak + 1
            longest_silence = max(longest_silence, streak)
        self.assertLess(longest_silence, 7, "No long silence within a spoken phrase")

    def test_breathing_reuses_real_approved_compruebe_voice_samples(self):
        response = samples("aed-check-response.wav")
        breathing = samples("aed-check-breathing.wav")
        # Compare samples from the latter half of the full word, not only
        # the first syllable; earlier bad repair clipped after 0.385s.
        a = round(2.28 * 44100)
        b = round(2.50 * 44100)
        self.assertEqual(response[a:b], breathing[a:b])


if __name__ == "__main__":
    unittest.main()
