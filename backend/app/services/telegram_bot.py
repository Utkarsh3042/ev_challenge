import logging
from sqlalchemy import select
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.rider import Rider

logger = logging.getLogger("road_warrior.telegram")

# Global application instance
bot_app: Application | None = None

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start <referral_code>."""
    if not update.effective_user or not update.effective_chat:
        return

    chat_id = update.effective_chat.id
    args = context.args

    if not args:
        await context.bot.send_message(
            chat_id=chat_id,
            text="Welcome to Road Warrior! To link your account, use the link provided after you sign up."
        )
        return

    ref_code = args[0].upper()

    async with AsyncSessionLocal() as db:
        rider = await db.scalar(select(Rider).where(Rider.referral_code == ref_code))
        if not rider:
            await context.bot.send_message(
                chat_id=chat_id,
                text="Invalid referral code. Please check your link and try again."
            )
            return

        # Check if already linked
        if rider.telegram_chat_id == chat_id:
            await context.bot.send_message(
                chat_id=chat_id,
                text=f"Welcome back, {rider.full_name}! Your account is already linked."
            )
            return

        # Link account
        rider.telegram_chat_id = chat_id
        await db.commit()
        
        await context.bot.send_message(
            chat_id=chat_id,
            text=f"🎉 Success! Welcome, {rider.full_name}. Your Road Warrior account is now linked. You'll receive instant notifications here."
        )

async def points_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /points."""
    if not update.effective_chat:
        return
    chat_id = update.effective_chat.id
    async with AsyncSessionLocal() as db:
        rider = await db.scalar(select(Rider).where(Rider.telegram_chat_id == chat_id))
        if not rider:
            await context.bot.send_message(chat_id=chat_id, text="Your account is not linked. Use your referral link to connect.")
            return

        await context.bot.send_message(
            chat_id=chat_id,
            text=f"Your current balance is: {rider.points} points ⚡\nRefer more friends to earn points!"
        )

async def ev_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /ev."""
    if not update.effective_chat:
        return
    text = "🔋 *EV Rentals & Purchase*\n\nLooking to switch to an Electric Vehicle? We offer flexible rental plans starting at just ₹100/day, including free battery swaps.\n\nVisit your nearest Road Warrior hub to get started."
    await context.bot.send_message(chat_id=update.effective_chat.id, text=text, parse_mode="Markdown")

async def support_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /support."""
    if not update.effective_chat:
        return
    text = "🛠 *Support*\n\nNeed help with your account, EV, or points? Contact our support team at support@roadwarrior.com or call 1800-EV-RIDER."
    await context.bot.send_message(chat_id=update.effective_chat.id, text=text, parse_mode="Markdown")


def init_bot() -> Application | None:
    """Initialize the python-telegram-bot application."""
    global bot_app
    if not settings.telegram_bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not set. Telegram bot will not be initialized.")
        return None

    application = Application.builder().token(settings.telegram_bot_token).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("points", points_command))
    application.add_handler(CommandHandler("ev", ev_command))
    application.add_handler(CommandHandler("support", support_command))
    
    bot_app = application
    return application

async def send_notification(chat_id: int, text: str) -> bool:
    """Helper to send outbound notifications."""
    if not bot_app:
        return False
    try:
        await bot_app.bot.send_message(chat_id=chat_id, text=text, parse_mode="Markdown")
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram message to {chat_id}: {e}")
        return False
