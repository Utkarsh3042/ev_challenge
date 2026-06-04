"""Tests for QR code generation."""

from app.services.qr_service import build_share_url, generate_qr_png


def test_build_share_url_default_base():
    url = build_share_url("RW-AB12")
    assert url.endswith("/form?ref=RW-AB12")


def test_build_share_url_strips_trailing_slash():
    url = build_share_url("RW-AB12", "http://example.com/")
    assert url == "http://example.com/form?ref=RW-AB12"


def test_generate_qr_png_returns_valid_png_bytes():
    png = generate_qr_png("http://example.com/form?ref=RW-AB12", size=200)
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(png) > 100


def test_generate_qr_png_default_size():
    png = generate_qr_png("hello", size=200)
    assert isinstance(png, bytes)
    assert len(png) > 0
