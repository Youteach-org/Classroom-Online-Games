"""Stage V15 TFT JPEG assets with full color and careful source resizing.

Container DEAV15J1: magic[8], width/height/count uint16-le, then 32 pairs
of (absolute offset, JPEG length) uint32-le, followed by JPEG bytes.
The JPEG decoder in firmware converts the image into RGB565 at runtime.
No 4-bit palette or pixel-art quantization is used.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import struct
from pathlib import Path

from PIL import Image


MAGIC = b"DEAV15J1"
WIDTH, HEIGHT = 160, 128

# The first 24 indices preserve the existing DisplayAdapter asset contract.
# Last eight are temporary distinct, photographic case references, not approved
# artwork; no such source will be promoted to stable firmware without review.
ASSET_KEYS = [
    "01_inicio.jpg", "03_seleccion_variante.jpg", "04_parches_adulto.jpg",
    "05_parches_nino.jpg", "06_parches_lactante.jpg",
    "07_parches_conectados.jpg", "08_analizando_ritmo.jpg",
    "09_descarga_recomendada.jpg", "10_todos_despejados.jpg",
    "11_aplicando_descarga.jpg", "12_descarga_aplicada.jpg",
    "13_inicia_rcp.jpg", "14_rcp_arriba.jpg", "15_rcp_compresion.jpg",
    "16_dos_ventilaciones.jpg", "17_continua_rcp.jpg",
    "18_reevaluando_ritmo.jpg", "19_no_descarga.jpg",
    "20_error_parches.jpg", "startup-breathing.jpg",
    "startup-chest.jpg", "startup-help.jpg", "startup-response.jpg",
    "variant-drowning.jpg",
    "12_descarga_aplicada.jpg", "09_descarga_recomendada.jpg",
    "20_error_parches.jpg", "18_reevaluando_ritmo.jpg",
    "19_no_descarga.jpg", "11_aplicando_descarga.jpg",
    "08_analizando_ritmo.jpg", "07_parches_conectados.jpg",
]

# Only reviewed photographic proposals are eligible for the new PREVIEW pack.
# The refused _revisar images, pixel-art JPGs and historical JSON are excluded.
PHOTO_SOURCE_BY_KEY = {
    "01_inicio.jpg": "00_inicio.jpg",
    "03_seleccion_variante.jpg": "01_respuesta_corregida_propuesta.jpg",
    "04_parches_adulto.jpg": "05_electrodos_vista_anterior_propuesta.jpg",
    "05_parches_nino.jpg": "05_parches_nino_nuevo.jpg",
    "06_parches_lactante.jpg": "06_parches_lactante_nuevo.jpg",
    "07_parches_conectados.jpg": "05_electrodos_vista_anterior_propuesta.jpg",
    "08_analizando_ritmo.jpg": "07_todos_despejados_corregida_propuesta.jpg",
    "09_descarga_recomendada.jpg": "07_todos_despejados_corregida_propuesta.jpg",
    "10_todos_despejados.jpg": "07_todos_despejados_corregida_propuesta.jpg",
    "11_aplicando_descarga.jpg": "08_pulsar_descarga.jpg",
    "12_descarga_aplicada.jpg": "08_pulsar_descarga.jpg",
    "13_inicia_rcp.jpg": "06_compresiones_rcp.jpg",
    "14_rcp_arriba.jpg": "06_compresiones_rcp.jpg",
    "15_rcp_compresion.jpg": "06_compresiones_rcp.jpg",
    "16_dos_ventilaciones.jpg": "09_ventilaciones.jpg",
    "17_continua_rcp.jpg": "06_compresiones_rcp.jpg",
    "18_reevaluando_ritmo.jpg": "07_todos_despejados_corregida_propuesta.jpg",
    "19_no_descarga.jpg": "07_todos_despejados_corregida_propuesta.jpg",
    "20_error_parches.jpg": "10_error_conexion.jpg",
    "startup-breathing.jpg": "03_comprobar_respiracion.jpg",
    "startup-chest.jpg": "04_exponer_pecho.jpg",
    "startup-help.jpg": "02_llamar_emergencias.jpg",
    "startup-response.jpg": "01_respuesta_corregida_propuesta.jpg",
    "variant-drowning.jpg": "11_ahogamiento.jpg",
}


def build_pack(assets: dict[str, str]) -> bytes:
    encoded = []
    for key in ASSET_KEYS:
        if key not in assets:
            raise ValueError(f"Missing source JPEG: {key}")
        raw = base64.b64decode(assets[key], validate=True)
        if not raw.startswith(b"\xff\xd8") or not raw.endswith(b"\xff\xd9"):
            raise ValueError(f"Invalid JPEG: {key}")
        try:
            with Image.open(io.BytesIO(raw)) as image:
                image.verify()
            with Image.open(io.BytesIO(raw)) as image:
                width, height = image.size
                # Never enlarge a thumbnail or silently crop a photo; both
                # create the distorted/blurry output the TFT review rejected.
                if (width < WIDTH or height < HEIGHT or
                    abs(width * HEIGHT - height * WIDTH) >
                        max(width * HEIGHT, height * WIDTH) * 0.01):
                    raise ValueError(
                        f"{key} must be 160x128 or larger 5:4 JPEG, "
                        f"got {image.size}"
                    )
                if image.size != (WIDTH, HEIGHT):
                    out = io.BytesIO()
                    image.convert("RGB").resize(
                        (WIDTH, HEIGHT), Image.Resampling.LANCZOS,
                        reducing_gap=3.0
                    ).save(out, format="JPEG", quality=90, subsampling=0)
                    raw = out.getvalue()
        except OSError as err:
            raise ValueError(f"Invalid JPEG: {key}") from err
        encoded.append(raw)

    count = len(encoded)
    header = MAGIC + struct.pack("<HHH", WIDTH, HEIGHT, count)
    offset = len(header) + count * 8
    directory = bytearray()
    for record in encoded:
        directory.extend(struct.pack("<II", offset, len(record)))
        offset += len(record)
    return header + directory + b"".join(encoded)


def parse_pack(payload: bytes) -> list[bytes]:
    if len(payload) < 14 or payload[:8] != MAGIC:
        raise ValueError("Invalid DEAV15J1 header")
    width, height, count = struct.unpack_from("<HHH", payload, 8)
    if (width, height, count) != (WIDTH, HEIGHT, len(ASSET_KEYS)):
        raise ValueError("Incorrect dimensions or image count")
    start = 14 + count * 8
    if len(payload) < start:
        raise ValueError("Truncated directory")
    result = []
    for index in range(count):
        offset, length = struct.unpack_from("<II", payload, 14 + index * 8)
        if offset != start or length < 4 or offset + length > len(payload):
            raise ValueError(f"Corrupt index entry {index}")
        result.append(payload[offset:offset + length])
        start += length
    if start != len(payload):
        raise ValueError("Trailing bytes")
    return result


def build_photo_pack(photo_dir: Path) -> bytes:
    """Build every screen from independent high-resolution clinical photos.

    Fail closed if any photograph is missing; NEVER fall back to the
    rejected illustrations or the base64 thumbnails in display-source.json.
    """
    if set(ASSET_KEYS) != set(PHOTO_SOURCE_BY_KEY):
        raise ValueError("The 32 display slots lack a complete photo mapping")

    photo_cache: dict[str, bytes] = {}
    encoded: list[bytes] = []
    for key in ASSET_KEYS:
        filename = PHOTO_SOURCE_BY_KEY[key]
        if filename not in photo_cache:
            path = photo_dir / filename
            if not path.is_file():
                raise FileNotFoundError(f"Missing clinical photograph: {path}")
            with Image.open(path) as image:
                w, h = image.size
                if w < WIDTH or h < HEIGHT or abs(w * HEIGHT - h * WIDTH) > max(w * HEIGHT, h * WIDTH) * 0.01:
                    raise ValueError(f"{filename}: expected large 5:4 photograph, found {w}x{h}")
                output = io.BytesIO()
                image.convert("RGB").resize(
                    (WIDTH, HEIGHT), Image.Resampling.LANCZOS, reducing_gap=3.0
                ).save(output, format="JPEG", quality=86, subsampling=0)
                photo_cache[filename] = output.getvalue()
        encoded.append(photo_cache[filename])

    header = MAGIC + struct.pack("<HHH", WIDTH, HEIGHT, len(encoded))
    offset = len(header) + len(encoded) * 8
    directory = bytearray()
    for record in encoded:
        directory.extend(struct.pack("<II", offset, len(record)))
        offset += len(record)
    payload = header + directory + b"".join(encoded)
    parse_pack(payload)
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument("--source", type=Path)
    inputs.add_argument("--photo-dir", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.photo_dir:
        payload = build_photo_pack(args.photo_dir)
    else:
        source = json.loads(args.source.read_text(encoding="utf-8"))["assets"]
        payload = build_pack(source)
    parse_pack(payload)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(payload)
    print(f"DEAV15J1: {len(ASSET_KEYS)} full-color JPEGs, {len(payload)} bytes")


if __name__ == "__main__":
    main()
