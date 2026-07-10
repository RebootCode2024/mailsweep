"""
Generate the two Google Workspace Marketplace promo graphics for MailSweep.

Outputs:
  D:/Projects/Mailsweep/marketing/promo-220x140.png   (small card tile)
  D:/Projects/Mailsweep/marketing/promo-920x680.png   (large banner)

Design: clean Material-style, white background, broom logo, wordmark +
tagline in brand colors. Matches the title card aesthetic.
"""

from PIL import Image, ImageDraw, ImageFont
import os

LOGO_PATH = r"D:\Projects\Mailsweep\docs\img\logo.png"
OUT_DIR = r"D:\Projects\Mailsweep\marketing"
os.makedirs(OUT_DIR, exist_ok=True)

BG = (255, 255, 255)
TEXT_DARK = (32, 33, 36)     # #202124
TEXT_MUTED = (95, 99, 104)   # #5F6368
BRAND = (26, 115, 232)       # #1A73E8


def load_font(size, bold=False):
    candidates = (
        ["arialbd.ttf", "segoeuib.ttf", "calibrib.ttf"] if bold
        else ["arial.ttf", "segoeui.ttf", "calibri.ttf"]
    )
    for d in (r"C:\Windows\Fonts", r"C:\Windows\System32\Fonts"):
        for name in candidates:
            p = os.path.join(d, name)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except OSError:
                    pass
    return ImageFont.load_default()


def load_logo(height):
    logo = Image.open(LOGO_PATH).convert("RGBA")
    scale = height / logo.height
    return logo.resize((int(logo.width * scale), height), Image.LANCZOS)


def text_size(draw, text, font):
    b = draw.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1]


# ----------------------------------------------------------------------
# Small promo tile — 220 x 140
# Compact: logo top-center, "MailSweep" below. No tagline (too small).
# ----------------------------------------------------------------------
def make_small():
    W, H = 220, 140
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    logo = load_logo(56)
    logo_x = (W - logo.width) // 2
    logo_y = 24
    canvas.paste(logo, (logo_x, logo_y), logo)

    font = load_font(26, bold=True)
    tw, th = text_size(draw, "MailSweep", font)
    draw.text(((W - tw) // 2, logo_y + logo.height + 12), "MailSweep",
              fill=TEXT_DARK, font=font)

    out = os.path.join(OUT_DIR, "promo-220x140.png")
    canvas.save(out, "PNG", optimize=True)
    print("Wrote", out, os.path.getsize(out), "bytes")


# ----------------------------------------------------------------------
# Large banner — 920 x 680
# Logo + wordmark + tagline, generous whitespace, a subtle brand accent bar.
# ----------------------------------------------------------------------
def make_large():
    W, H = 920, 680
    canvas = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(canvas)

    # thin brand accent bar across the top
    draw.rectangle([0, 0, W, 8], fill=BRAND)

    logo = load_logo(200)
    logo_x = (W - logo.width) // 2
    logo_y = 150
    canvas.paste(logo, (logo_x, logo_y), logo)

    wordmark_font = load_font(76, bold=True)
    tagline_font = load_font(30, bold=False)

    wm = "MailSweep"
    tw, th = text_size(draw, wm, wordmark_font)
    wm_y = logo_y + logo.height + 40
    draw.text(((W - tw) // 2, wm_y), wm, fill=TEXT_DARK, font=wordmark_font)

    tagline = "Bulk-clean Gmail in seconds"
    ttw, tth = text_size(draw, tagline, tagline_font)
    draw.text(((W - ttw) // 2, wm_y + th + 28), tagline,
              fill=TEXT_MUTED, font=tagline_font)

    out = os.path.join(OUT_DIR, "promo-920x680.png")
    canvas.save(out, "PNG", optimize=True)
    print("Wrote", out, os.path.getsize(out), "bytes")


make_small()
make_large()
print("Done.")
