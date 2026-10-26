"""Functional contract for the replacement full-color TFT asset container."""

import base64
import io
import struct
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from build_display_jpeg_pack import ASSET_KEYS, PHOTO_SOURCE_BY_KEY, build_pack, parse_pack, build_photo_pack


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

    def test_photo_pack_replaces_every_old_frame_with_real_photo(self):
        # An absent photo must fail the build instead of silently displaying
        # the old stick figures. All 32 screen slots must receive a photo.
        with tempfile.TemporaryDirectory() as directory:
            self.create_fixture_photos(Path(directory))
            payload = build_photo_pack(Path(directory))
            records = parse_pack(payload)
            self.assertEqual(len(records), 32)
            self.assertLess(len(payload), 300_000)
            self.assertEqual(Image.open(io.BytesIO(records[0])).size, (160, 128))
            # First screen = blue training AED, adult pads = red model chest,
            # child pads = green pediatric mannequin, infant = yellow infant.
            colors = [Image.open(io.BytesIO(records[index])).getpixel((80, 64))
                      for index in (0, 2, 3, 4)]
            for result, expected in zip(colors, [(15, 30, 180), (180, 20, 20),
                                                 (20, 180, 20), (200, 180, 20)]):
                self.assertTrue(all(abs(a - b) < 25 for a, b in zip(result, expected)))
            self.assertGreaterEqual(len(set(records)), 12)

    def test_photo_pack_never_falls_back_to_old_source_or_rejected_frames(self):
        with tempfile.TemporaryDirectory() as directory:
            self.create_fixture_photos(Path(directory))
            (Path(directory) / '05_electrodos_corregidos_nuevo.jpg').unlink()
            with self.assertRaisesRegex(FileNotFoundError, '05_electrodos_corregidos_nuevo'):
                build_photo_pack(Path(directory))

    def test_cpr_motion_uses_distinct_source_photographs(self):
        self.assertNotEqual(
            PHOTO_SOURCE_BY_KEY['14_rcp_arriba.jpg'],
            PHOTO_SOURCE_BY_KEY['15_rcp_compresion.jpg'],
        )
        with tempfile.TemporaryDirectory() as directory:
            self.create_fixture_photos(Path(directory))
            frames = parse_pack(build_photo_pack(Path(directory)))
            self.assertNotEqual(frames[12], frames[13], 'CPR animation must change frames')

    def test_adult_pads_use_corrected_lateral_placement_photo(self):
        self.assertEqual(PHOTO_SOURCE_BY_KEY['04_parches_adulto.jpg'],
                         '05_electrodos_corregidos_nuevo.jpg')
        self.assertEqual(PHOTO_SOURCE_BY_KEY['07_parches_conectados.jpg'],
                         '05_electrodos_corregidos_nuevo.jpg')

    @staticmethod
    def create_fixture_photos(root):
        by_name = {
            '00_inicio.jpg': (15, 30, 180),
            '05_electrodos_vista_anterior_propuesta.jpg': (180, 20, 20),
            '05_electrodos_corregidos_nuevo.jpg': (180, 20, 20),
            '05_parches_nino_nuevo.jpg': (20, 180, 20),
            '06_parches_lactante_nuevo.jpg': (200, 180, 20),
        }
        names = [
            '01_respuesta_corregida_propuesta.jpg', '02_llamar_emergencias.jpg',
            '03_comprobar_respiracion.jpg', '04_exponer_pecho.jpg',
            '06_compresiones_rcp.jpg', '07_todos_despejados_corregida_propuesta.jpg',
            '06_rcp_retroceso_nuevo.jpg',
            '08_pulsar_descarga.jpg', '09_ventilaciones.jpg',
            '10_error_conexion.jpg', '11_ahogamiento.jpg',
        ]
        for index, name in enumerate(names):
            by_name[name] = (20 + index * 10, 30 + index * 10, 35)
        for name, color in by_name.items():
            Image.new('RGB', (640, 512), color).save(root / name)


if __name__ == "__main__":
    unittest.main()
