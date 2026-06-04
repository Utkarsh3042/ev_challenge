"""QR code generation for referral share links."""

from __future__ import annotations

import io

import qrcode
from qrcode.image.pil import PilImage
from qrcode.main import QRCode

DEFAULT_SIZE_PX = 200


def build_share_url(referral_code: str, base_url: str | None = None) -> str:
    """Construct the full shareable URL for a referral code.

    The form page at ``/form?ref=CODE`` reads this on load to attribute
    the new rider to the referrer.
    """
    base = (base_url or "http://localhost:3000").rstrip("/")
    return f"{base}/form?ref={referral_code}"


def generate_qr_png(data: str, size: int = DEFAULT_SIZE_PX) -> bytes:
    """Generate a QR code PNG as raw bytes.

    Args:
        data: The string to encode (typically a full share URL).
        size: Target image side length in pixels (square).

    Returns:
        PNG image bytes (suitable for ``Response(content=..., media_type="image/png")``).
    """
    # ``box_size`` controls module size; ``border`` is in modules, not pixels.
    # We compute box_size to roughly hit the target ``size`` in pixels.
    border = 4
    modules = 33  # default for the "M" error-correction level we use
    box = max(1, (size - 2 * border * 6) // modules)

    qr = QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img: PilImage = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
