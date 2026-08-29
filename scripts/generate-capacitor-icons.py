#!/usr/bin/env python3
"""Generate padded PWA, Android, and iOS launcher icons.

This script intentionally uses only Python's standard library so native icon
generation does not add a project dependency. It supports the 8-bit PNG formats
used by the existing source icons.
"""

from __future__ import annotations

import json
import math
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/icons/icon-512.png"
BACKGROUND = (0x26, 0x46, 0x39, 255)

ANDROID_LEGACY = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ANDROID_ADAPTIVE = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

IOS_ICONS = [
    ("AppIcon-20@2x.png", 40),
    ("AppIcon-20@3x.png", 60),
    ("AppIcon-29@2x.png", 58),
    ("AppIcon-29@3x.png", 87),
    ("AppIcon-40@2x.png", 80),
    ("AppIcon-40@3x.png", 120),
    ("AppIcon-60@2x.png", 120),
    ("AppIcon-60@3x.png", 180),
    ("AppIcon-20@1x-ipad.png", 20),
    ("AppIcon-20@2x-ipad.png", 40),
    ("AppIcon-29@1x-ipad.png", 29),
    ("AppIcon-29@2x-ipad.png", 58),
    ("AppIcon-40@1x-ipad.png", 40),
    ("AppIcon-40@2x-ipad.png", 80),
    ("AppIcon-76@1x-ipad.png", 76),
    ("AppIcon-76@2x-ipad.png", 152),
    ("AppIcon-83.5@2x-ipad.png", 167),
    ("AppIcon-1024.png", 1024),
]


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png(path: Path) -> tuple[int, int, list[tuple[int, int, int, int]]]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")

    offset = 8
    width = height = bit_depth = color_type = interlace = None
    palette: list[tuple[int, int, int]] = []
    trans: list[int] = []
    idat = bytearray()

    while offset < len(data):
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        ctype = data[offset + 4 : offset + 8]
        chunk = data[offset + 8 : offset + 8 + length]
        offset += 12 + length

        if ctype == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(">IIBBBBB", chunk)
        elif ctype == b"PLTE":
            palette = [tuple(chunk[i : i + 3]) for i in range(0, len(chunk), 3)]
        elif ctype == b"tRNS":
            trans = list(chunk)
        elif ctype == b"IDAT":
            idat.extend(chunk)
        elif ctype == b"IEND":
            break

    if bit_depth != 8 or interlace != 0:
        raise ValueError("Only non-interlaced 8-bit PNG files are supported")
    if color_type not in (0, 2, 3, 4, 6):
        raise ValueError(f"Unsupported PNG color type: {color_type}")

    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color_type]
    row_bytes = width * channels
    raw = zlib.decompress(bytes(idat))
    rows: list[bytearray] = []
    pos = 0

    for _ in range(height):
        ftype = raw[pos]
        pos += 1
        row = bytearray(raw[pos : pos + row_bytes])
        pos += row_bytes
        prev = rows[-1] if rows else bytearray(row_bytes)

        for i in range(row_bytes):
            left = row[i - channels] if i >= channels else 0
            up = prev[i]
            up_left = prev[i - channels] if i >= channels else 0
            if ftype == 1:
                row[i] = (row[i] + left) & 0xFF
            elif ftype == 2:
                row[i] = (row[i] + up) & 0xFF
            elif ftype == 3:
                row[i] = (row[i] + ((left + up) // 2)) & 0xFF
            elif ftype == 4:
                row[i] = (row[i] + paeth(left, up, up_left)) & 0xFF
            elif ftype != 0:
                raise ValueError(f"Unsupported PNG filter: {ftype}")
        rows.append(row)

    pixels: list[tuple[int, int, int, int]] = []
    for row in rows:
        for x in range(width):
            i = x * channels
            if color_type == 0:
                v = row[i]
                pixels.append((v, v, v, 255))
            elif color_type == 2:
                pixels.append((row[i], row[i + 1], row[i + 2], 255))
            elif color_type == 3:
                idx = row[i]
                r, g, b = palette[idx]
                a = trans[idx] if idx < len(trans) else 255
                pixels.append((r, g, b, a))
            elif color_type == 4:
                v, a = row[i], row[i + 1]
                pixels.append((v, v, v, a))
            else:
                pixels.append((row[i], row[i + 1], row[i + 2], row[i + 3]))
    return width, height, pixels


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path, width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        row = pixels[y * width : (y + 1) * width]
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    data = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + png_chunk(b"IEND", b"")
    path.write_bytes(data)


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return math.sqrt(sum((a[i] - b[i]) ** 2 for i in range(3)))


def is_logo_pixel(px: tuple[int, int, int, int]) -> bool:
    r, g, b, a = px
    if a <= 12:
        return False
    if color_distance((r, g, b), BACKGROUND[:3]) < 42:
        return False
    return max(r, g, b) >= 56 and not (r < 48 and g < 48 and b < 48)


def crop_logo(width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> tuple[int, int, list[tuple[int, int, int, int]]]:
    xs: list[int] = []
    ys: list[int] = []
    for y in range(height):
        for x in range(width):
            if is_logo_pixel(pixels[y * width + x]):
                xs.append(x)
                ys.append(y)

    if not xs:
        raise ValueError("Could not detect a visible logo in source icon")

    pad = 6
    left = max(0, min(xs) - pad)
    right = min(width - 1, max(xs) + pad)
    top = max(0, min(ys) - pad)
    bottom = min(height - 1, max(ys) + pad)
    crop_w = right - left + 1
    crop_h = bottom - top + 1
    crop: list[tuple[int, int, int, int]] = []

    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            r, g, b, a = pixels[y * width + x]
            if a <= 12 or (r < 40 and g < 40 and b < 40) or color_distance((r, g, b), BACKGROUND[:3]) < 42:
                crop.append((r, g, b, 0))
            else:
                crop.append((r, g, b, a))

    return crop_w, crop_h, crop


def resize_rgba(width: int, height: int, pixels: list[tuple[int, int, int, int]], new_width: int, new_height: int) -> list[tuple[int, int, int, int]]:
    out: list[tuple[int, int, int, int]] = []
    for y in range(new_height):
        sy = (y + 0.5) * height / new_height - 0.5
        y0 = max(0, min(height - 1, math.floor(sy)))
        y1 = max(0, min(height - 1, y0 + 1))
        wy = sy - y0
        for x in range(new_width):
            sx = (x + 0.5) * width / new_width - 0.5
            x0 = max(0, min(width - 1, math.floor(sx)))
            x1 = max(0, min(width - 1, x0 + 1))
            wx = sx - x0

            samples = (
                (pixels[y0 * width + x0], (1 - wx) * (1 - wy)),
                (pixels[y0 * width + x1], wx * (1 - wy)),
                (pixels[y1 * width + x0], (1 - wx) * wy),
                (pixels[y1 * width + x1], wx * wy),
            )
            premul = [0.0, 0.0, 0.0]
            alpha = 0.0
            for (r, g, b, a), weight in samples:
                aw = (a / 255.0) * weight
                premul[0] += r * aw
                premul[1] += g * aw
                premul[2] += b * aw
                alpha += aw
            if alpha <= 0:
                out.append((0, 0, 0, 0))
            else:
                out.append((
                    max(0, min(255, round(premul[0] / alpha))),
                    max(0, min(255, round(premul[1] / alpha))),
                    max(0, min(255, round(premul[2] / alpha))),
                    max(0, min(255, round(alpha * 255))),
                ))
    return out


def monochrome(pixels: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    return [(255, 255, 255, a) for _, _, _, a in pixels]


def compose(size: int, logo: tuple[int, int, list[tuple[int, int, int, int]]], fraction: float, transparent: bool = False, mono: bool = False) -> list[tuple[int, int, int, int]]:
    logo_w, logo_h, logo_px = logo
    target = max(1, int(size * fraction))
    scale = target / max(logo_w, logo_h)
    new_w = max(1, round(logo_w * scale))
    new_h = max(1, round(logo_h * scale))
    resized = resize_rgba(logo_w, logo_h, logo_px, new_w, new_h)
    if mono:
        resized = monochrome(resized)

    bg = (0, 0, 0, 0) if transparent else BACKGROUND
    canvas = [bg for _ in range(size * size)]
    off_x = (size - new_w) // 2
    off_y = (size - new_h) // 2

    for y in range(new_h):
        for x in range(new_w):
            sr, sg, sb, sa = resized[y * new_w + x]
            if sa == 0:
                continue
            idx = (off_y + y) * size + off_x + x
            dr, dg, db, da = canvas[idx]
            af = sa / 255.0
            bf = da / 255.0 * (1 - af)
            out_a = af + bf
            if out_a <= 0:
                canvas[idx] = (0, 0, 0, 0)
            else:
                canvas[idx] = (
                    round((sr * af + dr * bf) / out_a),
                    round((sg * af + dg * bf) / out_a),
                    round((sb * af + db * bf) / out_a),
                    round(out_a * 255),
                )
    return canvas


def update_ios_contents() -> None:
    appicon = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    contents = {
        "images": [
            {"filename": "AppIcon-20@2x.png", "idiom": "iphone", "scale": "2x", "size": "20x20"},
            {"filename": "AppIcon-20@3x.png", "idiom": "iphone", "scale": "3x", "size": "20x20"},
            {"filename": "AppIcon-29@2x.png", "idiom": "iphone", "scale": "2x", "size": "29x29"},
            {"filename": "AppIcon-29@3x.png", "idiom": "iphone", "scale": "3x", "size": "29x29"},
            {"filename": "AppIcon-40@2x.png", "idiom": "iphone", "scale": "2x", "size": "40x40"},
            {"filename": "AppIcon-40@3x.png", "idiom": "iphone", "scale": "3x", "size": "40x40"},
            {"filename": "AppIcon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60"},
            {"filename": "AppIcon-60@3x.png", "idiom": "iphone", "scale": "3x", "size": "60x60"},
            {"filename": "AppIcon-20@1x-ipad.png", "idiom": "ipad", "scale": "1x", "size": "20x20"},
            {"filename": "AppIcon-20@2x-ipad.png", "idiom": "ipad", "scale": "2x", "size": "20x20"},
            {"filename": "AppIcon-29@1x-ipad.png", "idiom": "ipad", "scale": "1x", "size": "29x29"},
            {"filename": "AppIcon-29@2x-ipad.png", "idiom": "ipad", "scale": "2x", "size": "29x29"},
            {"filename": "AppIcon-40@1x-ipad.png", "idiom": "ipad", "scale": "1x", "size": "40x40"},
            {"filename": "AppIcon-40@2x-ipad.png", "idiom": "ipad", "scale": "2x", "size": "40x40"},
            {"filename": "AppIcon-76@1x-ipad.png", "idiom": "ipad", "scale": "1x", "size": "76x76"},
            {"filename": "AppIcon-76@2x-ipad.png", "idiom": "ipad", "scale": "2x", "size": "76x76"},
            {"filename": "AppIcon-83.5@2x-ipad.png", "idiom": "ipad", "scale": "2x", "size": "83.5x83.5"},
            {"filename": "AppIcon-1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024"},
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (appicon / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    width, height, source_pixels = read_png(SOURCE)
    logo = crop_logo(width, height, source_pixels)

    pwa_dir = ROOT / "public/icons"
    write_png(pwa_dir / "icon-192.png", 192, 192, compose(192, logo, 0.72))
    write_png(pwa_dir / "icon-512.png", 512, 512, compose(512, logo, 0.72))
    write_png(pwa_dir / "maskable-icon-512.png", 512, 512, compose(512, logo, 0.62))
    write_png(ROOT / "public/apple-touch-icon.png", 180, 180, compose(180, logo, 0.72))

    android_res = ROOT / "android/app/src/main/res"
    for folder, size in ANDROID_LEGACY.items():
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            write_png(android_res / folder / name, size, size, compose(size, logo, 0.72))

    for folder, size in ANDROID_ADAPTIVE.items():
        write_png(android_res / folder / "ic_launcher_foreground.png", size, size, compose(size, logo, 0.62, transparent=True))
        write_png(android_res / folder / "ic_launcher_monochrome.png", size, size, compose(size, logo, 0.62, transparent=True, mono=True))

    appicon = ROOT / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    for filename, size in IOS_ICONS:
        write_png(appicon / filename, size, size, compose(size, logo, 0.72))
    update_ios_contents()

    print(f"Source: {SOURCE.relative_to(ROOT)}")
    print(f"Detected logo crop: {logo[0]}x{logo[1]}")
    print("Generated PWA, Android, and iOS launcher icons.")


if __name__ == "__main__":
    main()
