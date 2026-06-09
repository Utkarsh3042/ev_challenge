import asyncio
import os
import asyncpg
from dotenv import load_dotenv

async def main():
    load_dotenv()
    url = os.environ.get("DATABASE_URL").replace("+asyncpg", "")
    conn = await asyncpg.connect(url)
    try:
        await conn.execute("ALTER TABLE riders DROP COLUMN telegram_chat_id CASCADE;")
        print("Dropped column.")
    except Exception as e:
        print("Error dropping column:", e)
        
    try:
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_riders_segments ON riders USING gin(segments);")
        print("Created index.")
    except Exception as e:
        print("Error creating index:", e)
    
    # We also need to fix alembic version table so it applies the migration again
    await conn.execute("UPDATE alembic_version SET version_num = '232fb1d552e6';")
    print("Updated alembic version.")
    await conn.close()

asyncio.run(main())
