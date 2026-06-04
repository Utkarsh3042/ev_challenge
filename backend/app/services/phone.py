"""Phone-number helpers for Indian mobile numbers.

Wraps the ``phonenumbers`` library with project-specific conventions:
always store as E.164 (``+91...``), always validate against the IN region,
and a human-friendly display format for the UI.
"""

from __future__ import annotations

import re

import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberFormat, PhoneNumberType

DEFAULT_REGION = "IN"  # India
_E164_RE = re.compile(r"^\+\d{10,15}$")


def normalize(raw: str) -> str:
    """Return the E.164 form of an Indian mobile number.

    Strips spaces/dashes/parens, handles inputs like:
      - ``"9876543210"``            -> ``"+919876543210"``
      - ``"+91 98765 43210"``       -> ``"+919876543210"``
      - ``"919876543210"``          -> ``"+919876543210"``
      - ``"09876543210"``           -> ``"+919876543210"``

    Raises ``ValueError`` if the number cannot be parsed as an Indian number.
    """
    if not raw:
        raise ValueError("Phone number is empty")

    cleaned = re.sub(r"[\s\-\(\)]", "", raw.strip())
    if not cleaned:
        raise ValueError("Phone number is empty after stripping")

    try:
        parsed = phonenumbers.parse(cleaned, DEFAULT_REGION)
    except NumberParseException as exc:
        raise ValueError(f"Invalid phone number: {raw}") from exc

    if parsed.country_code != 91:
        raise ValueError(f"Only Indian (+91) numbers are accepted, got +{parsed.country_code}")

    return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)


def validate(raw: str) -> bool:
    """Return ``True`` iff ``raw`` is a valid Indian mobile number.

    More permissive than ``normalize``: this never raises. Use it for
    quick checks (e.g. live form validation) where raising is overkill.
    """
    if not raw:
        return False
    try:
        normalized = normalize(raw)
    except ValueError:
        return False
    try:
        parsed = phonenumbers.parse(normalized, None)
    except NumberParseException:
        return False
    # Must be IN region AND a mobile number (not landline / VoIP / etc.)
    return (
        phonenumbers.is_valid_number(parsed)
        and phonenumbers.region_code_for_number(parsed) == DEFAULT_REGION
        and phonenumbers.number_type(parsed) == PhoneNumberType.MOBILE
    )


def format_display(e164: str) -> str:
    """Format an E.164 number for human display: ``"+91 98765 43210"``."""
    if not e164 or not _E164_RE.match(e164):
        return e164
    try:
        parsed = phonenumbers.parse(e164, None)
        national = phonenumbers.national_significant_number(parsed)
        # national is 10 digits for IN mobiles
        if len(national) == 10:
            return f"+91 {national[:5]} {national[5:]}"
    except NumberParseException:
        pass
    return e164
