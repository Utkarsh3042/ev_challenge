import logging
import httpx
from app.config import settings

logger = logging.getLogger("road_warrior.sms")

async def send_fast2sms(phone: str, message: str) -> bool:
    """Send an SMS via Fast2SMS."""
    if not settings.fast2sms_api_key or settings.fast2sms_api_key.startswith("paste_"):
        logger.info(f"Fast2SMS Mock: sending '{message}' to {phone}")
        return True

    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "route": "q",
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": phone.replace("+91", "")
    }
    headers = {
        "authorization": settings.fast2sms_api_key,
        "Content-Type": "application/x-www-form-urlencoded"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, data=payload, headers=headers)
            data = response.json()
            if data.get("return"):
                logger.info("Fast2SMS sent successfully to %s", phone)
                return True
            else:
                logger.error("Fast2SMS error: %s", data)
                return False
        except Exception as e:
            logger.error("Fast2SMS exception: %s", str(e))
            return False

async def send_otp(phone: str, otp: str) -> bool:
    """Send OTP via Fast2SMS."""
    message = f"Your Road Warrior verification code is: {otp}. It expires in 10 minutes."
    return await send_fast2sms(phone, message)
