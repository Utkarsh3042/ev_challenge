import asyncio
import os
import sys

sys.path.append(os.path.abspath('backend'))
from app.database import async_session_maker
from app.models import Rider
from sqlalchemy import select

async def check():
    async with async_session_maker() as session:
        result = await session.execute(
            select(Rider).where(Rider.referred_by_code == 'RW-4B2S')
        )
        riders = result.scalars().all()
        if not riders:
            print("No riders signed up using RW-4B2S")
        for r in riders:
            print(f"Rider ID: {r.id}, Phone: {r.phone}, Name: {r.full_name}, Created: {r.created_at}")

if __name__ == '__main__':
    asyncio.run(check())
