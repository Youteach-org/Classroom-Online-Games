"""Functional contract for the replacement full-color TFT asset container."""

import base64
import io
import struct
import sys
import unittest
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from build_display_jpeg_pack import ASSET_KEYS, build_pack, parse_pack


class DisplayJpegPackTests(unittest.TestCase):
    def setUp(self):
        sample = Image.new("RGB", (160, 128))
        sample.putdata(
            [(x * 255 // 159, y * 255 // 127, (x + y) % 256)
             for y in range(128) for x in range(160)]
        )
        out = io.BytesIO()
        sample.save(out, format="JPEG", quality=92, subsampling=0)
        self.jpg = out.getvalue()
        self.source = {key: base64.b64encode(self.jpg).decode("ascii")
                       for key in set(ASSET_KEYS)}

    def test_uses_jpeg_payload_instead_of_16_color_palette(self):
        payload = build_pack(self.source)
        self.assertEqual(payload[:8], b"DEAV15J1")
        self.assertEqual(struct.unpack_from("<HHH", payload, 8), (160, 128, 32))
        records = parse_pack(payload)
        self.assertEqual(len(records), 32)
        self.assertEqual(records[0], self.jpg)
        self.assertGreater(len(set(Image.open(io.BytesIO(records[0])).get_flattened_data())), 16)

    def test_rejects_wrong_size_or_non_jpeg(self):
        wrong = Image.new("RGB", (128, 160), "navy")
        out = io.BytesIO()
        wrong.save(out, format="JPEG")
        key = ASSET_KEYS[0]
        invalid = dict(self.source, **{key: base64.b64encode(out.getvalue()).decode("ascii")})
        with self.assertRaisesRegex(ValueError, "160x128"):
            build_pack(invalid)
        invalid[key] = base64.b64encode(b"not an image").decode("ascii")
        with self.assertRaises(ValueError):
            build_pack(invalid)

    def test_all_32_records_decode_and_offsets_are_contiguous(self):
        payload = build_pack(self.source)
        self.assertLess(len(payload), 300_000)
        records = parse_pack(payload)
        for image_bytes in records:
            image = Image.open(io.BytesIO(image_bytes))
            self.assertEqual(image.size, (160, 128))
        offset, length = struct.unpack_from("<II", payload, 14)
        self.assertEqual(offset, 14 + 32 * 8)
        self.assertEqual(length, len(self.jpg))

    def test_high_resolution_photograph_is_downsampled_without_palette_or_warp(self):
        # Catches rejecting a high-resolution source instead of preparing it
        # for the actual 160x128 display. Expected dimensions are physical.
        image = Image.new("RGB", (640, 512))
        image.putdata([(x * 255 // 639, y * 255 // 511, 100)
                       for y in range(512) for x in range(640)])
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=95, subsampling=0)
        key = ASSET_KEYS[0]
        source = dict(self.source, **{
            key: base64.b64encode(output.getvalue()).decode("ascii")
        })

        jpeg = parse_pack(build_pack(source))[0]
        downsized = Image.open(io.BytesIO(jpeg))
        self.assertEqual(downsized.size, (160, 128))
        # Full color depth and both image axes must survive the resize.
        self.assertGreater(len(set(downsized.get_flattened_data())), 1000)
        r, g, _ = downsized.getpixel((80, 64))
        self.assertTrue(110 <= r <= 145)
        self.assertTrue(110 <= g <= 145)

    def test_rejects_upscale_and_mismatched_aspect_ratio(self):
        key = ASSET_KEYS[0]
        for size in [(80, 64), (640, 480)]:
            with self.subTest(size=size):
                image = Image.new("RGB", size, "blue")
                output = io.BytesIO()
                image.save(output, format="JPEG")
                source = dict(self.source, **{
                    key: base64.b64encode(output.getvalue()).decode("ascii")
                })
                with self.assertRaisesRegex(ValueError, "160x128"):
                    build_pack(source)


if __name__ == "__main__":
    unittest.main()
