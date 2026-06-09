import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler
from app.config import settings

async def start_handler(update, context):
    print("HANDLER EXECUTED!")

async def main():
    app = Application.builder().token(settings.telegram_bot_token).build()
    app.add_handler(CommandHandler("start", start_handler))
    
    await app.initialize()
    await app.start()
    
    # Simulate update
    update = Update.de_json({"update_id": 1, "message": {"message_id": 1, "date": 1, "chat": {"id": 1, "type": "private"}, "text": "/start", "entities": [{"type": "bot_command", "offset": 0, "length": 6}]}}, app.bot)
    await app.process_update(update)
    
    await asyncio.sleep(1) # wait for queue to process
    await app.stop()
    await app.shutdown()

asyncio.run(main())
