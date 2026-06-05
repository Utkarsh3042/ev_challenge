from pydantic import ValidationError
import sys
import os

# add backend path to sys.path
sys.path.append(os.path.abspath('backend'))

from app.schemas.rider import RiderSubmit

payload = {
    "full_name": "Test User",
    "phone": "+919876543210",
    "city": "Bangalore",
    "platform": "swiggy",
    "years_experience": 0,
    "preferred_language": "en",
    "vehicle_type": "petrol",
    "vehicle_brand_model": None,
    "fuel_method": "petrol_pump",
    "weekly_expense": 0,
    "monthly_maintenance": 0,
    "top_challenges": [],
    "ev_challenges": [],
    "petrol_challenges": [],
    "has_accident_insurance": "yes",
    "has_health_insurance": "yes",
    "paid_out_of_pocket": False,
    "open_to_switch": "yes",
    "switch_motivators": [],
    "interested_in": [],
    "referred_by_code": "RW-ABCD"
}

try:
    RiderSubmit(**payload)
    print("Payload 1 valid")
except ValidationError as e:
    print("Payload 1 invalid", e.errors())

payload2 = payload.copy()
payload2["referred_by_code"] = ""
try:
    RiderSubmit(**payload2)
    print("Payload 2 valid")
except ValidationError as e:
    print("Payload 2 invalid", e.errors())

payload3 = payload.copy()
payload3["referred_by_code"] = "RW-SOMECODE_THAT_IS_WAY_TOO_LONG"
try:
    RiderSubmit(**payload3)
    print("Payload 3 valid")
except ValidationError as e:
    print("Payload 3 invalid", e.errors())

payload4 = payload.copy()
payload4["weekly_expense"] = 0
payload4["monthly_maintenance"] = 0
payload4["years_experience"] = 0
try:
    RiderSubmit(**payload4)
    print("Payload 4 valid")
except ValidationError as e:
    print("Payload 4 invalid", e.errors())
