import importlib.util
import pathlib
import tempfile
import unittest
from unittest import mock


SCRIPT = pathlib.Path(__file__).with_name("build-audio-pack.py")
SPEC = importlib.util.spec_from_file_location("audio_pack_builder", SCRIPT)
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class ApprovedSourcesTest(unittest.TestCase):
    def test_approved_take_is_copied_exactly_without_redownloading(self):
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            (root / "approved").mkdir()
            (root / "approved" / "13.mp3").write_bytes(b"approved-voice-bytes")
            target = root / "source.mp3"
            clip = {"filename": "aed-begin-cpr.wav", "approvedSource": "approved/13.mp3", "url": "https://example.invalid/old.mp3"}
            with mock.patch.object(builder, "ROOT", root), mock.patch.object(builder.urllib.request, "urlretrieve", side_effect=AssertionError("unexpected download")):
                builder.prepare_source(clip, target)
            self.assertEqual(target.read_bytes(), b"approved-voice-bytes")

    def test_missing_approved_take_does_not_fall_back_to_old_voice(self):
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            clip = {"filename": "aed-continue-cpr.wav", "approvedSource": "approved/14.mp3", "url": "https://example.invalid/old.mp3"}
            with mock.patch.object(builder, "ROOT", root), mock.patch.object(builder.urllib.request, "urlretrieve", side_effect=AssertionError("unexpected download")):
                with self.assertRaises(FileNotFoundError):
                    builder.prepare_source(clip, root / "source.mp3")


if __name__ == "__main__":
    unittest.main()
