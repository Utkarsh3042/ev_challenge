"""Tests for app.services.phone."""

from app.services.phone import normalize, validate, format_display


def test_normalize_10_digit():
    assert normalize("9876543210") == "+919876543210"


def test_normalize_with_country_code_and_spaces():
    assert normalize("+91 98765 43210") == "+919876543210"


def test_normalize_with_country_code_no_plus():
    assert normalize("919876543210") == "+919876543210"


def test_normalize_with_leading_zero():
    assert normalize("09876543210") == "+919876543210"


def test_normalize_empty_raises():
    import pytest
    with pytest.raises(ValueError):
        normalize("")


def test_normalize_non_indian_raises():
    import pytest
    with pytest.raises(ValueError, match="Indian"):
        normalize("+14155551234")


def test_validate_valid_mobile():
    assert validate("+919876543210") is True
    assert validate("9876543210") is True


def test_validate_short_number():
    assert validate("1234") is False


def test_validate_landline_raises_or_false():
    # Indian landline (011-...) is not a valid "mobile" — validate returns False
    assert validate("+911123456789") is False


def test_format_display():
    assert format_display("+919876543210") == "+91 98765 43210"


def test_format_display_invalid():
    assert format_display("not a phone") == "not a phone"
