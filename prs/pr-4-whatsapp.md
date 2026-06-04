# PR #4 — WhatsApp Integration (Twilio + Chatbot)

## 🎯 Goal
Replace the mock WhatsApp dispatcher with a real **Twilio WhatsApp Business API** integration, complete with:
- Outbound templated messages (welcome, milestone, lucky draw) in 3 languages
- Inbound webhook handling (MY SCORE, REFERRAL, HELP, menu)
- A full **chatbot flow** that lets a rider complete the entire 6-section questionnaire over WhatsApp without ever opening a browser
- Webhook signature verification for security
- Delivery status tracking
- Fallback graceful behavior if Twilio is unavailable

After this PR, end-to-end the system works: rider fills form on web → gets WhatsApp in Hindi → shares code with friend → friend submits via web → original rider gets WhatsApp "+5 points" → after 10 referrals, gets badge WhatsApp. They can also text "MY SCORE" to the Twilio number and get an instant reply.

## 📋 Scope
- Twilio account setup documentation
- Real `TwilioWhatsAppDispatcher` (replaces mock from PR #2)
- Twilio webhook signature verification
- Inbound message router (`MY SCORE`, `REFERRAL`, `HELP`, `START`, free-text, chatbot steps)
- Step-by-step chatbot questionnaire (6 sections over chat)
- `whatsapp_sessions` state management
- Message delivery status webhooks
- Twilio template content for all 9 templates × 3 languages = 27 templates
- Admin "Messages" tab populated with real data
- WHATSAPP_SETUP.md guide

**OUT of scope**:
- Meta Business Manager account setup (user must do)
- WhatsApp template approval with Meta (user submits, we provide content)
- Cost optimization (handled in PR #5)

## 🔗 Depends On
- **PR #1** ✅ — schema (whatsapp_messages, whatsapp_sessions)
- **PR #2** ✅ — dispatcher interface, mock impl, webhook endpoint stub
- **PR #3** ✅ — admin Messages tab UI

## 🤝 Twilio Decision
**Why Twilio over direct Meta Cloud API:**
- Sandbox available instantly for testing (no Meta approval needed for dev)
- Unified SDK across WhatsApp/SMS/Voice (future-proof)
- Built-in delivery status callbacks
- Python SDK is mature
- Pay-per-conversation pricing is transparent

**Alternatives considered:**
- **360dialog** — cheaper but no sandbox, longer setup
- **MessageBird** — similar to Twilio, less Python tooling
- **Direct Meta Cloud API** — most control but most setup work, no sandbox


## 📁 Files to Create/Modify

```
backend/
├── app/
│   ├── main.py                              # ✏️ Wire dispatcher based on config
│   ├── config.py                            # ✏️ Add Twilio + WhatsApp config
│   ├── api/
│   │   ├── webhooks.py                      # ✏️ Full inbound handler + chatbot
│   │   └── webhooks_status.py               # ✨ Status callback endpoint
│   ├── services/
│   │   ├── whatsapp_dispatcher.py           # ✏️ Interface (no change, but make abstract)
│   │   ├── whatsapp_twilio.py               # ✨ Real Twilio implementation
│   │   ├── whatsapp_mock.py                 # ✏️ Refactor into proper mock (was inline)
│   │   ├── whatsapp_templates.py            # ✨ Template content + language variants
│   │   ├── whatsapp_chatbot.py              # ✨ Step-by-step Q&A flow
│   │   └── whatsapp_session_manager.py      # ✨ Get/create/update sessions
│   ├── locales/
│   │   ├── en.json                          # ✏️ Fill in WhatsApp template keys
│   │   ├── hi.json                          # ✏️ Fill in
│   │   └── kn.json                          # ✏️ Fill in
│   └── utils/
│       └── templates_meta.json              # ✨ Twilio template SID map
├── tests/
│   ├── test_whatsapp_twilio.py              # ✨ Unit tests with mocked Twilio client
│   ├── test_whatsapp_chatbot.py             # ✨ Full chatbot flow simulation
│   ├── test_whatsapp_webhook.py             # ✏️ Expand to test all message types
│   ├── test_whatsapp_signature.py           # ✨ Verify signature check
│   └── test_whatsapp_status.py              # ✨ Status callback flow
└── WHATSAPP_SETUP.md                        # ✨ Setup guide

frontend/
├── app/
│   └── admin/
│       └── messages/
│           └── page.tsx                     # ✏️ Make fully functional (was stub in PR #3)
└── components/
    └── admin/
        ├── MessageLogTable.tsx              # ✨ New
        ├── MessageFilters.tsx               # ✨ New
        └── MessagePreviewDialog.tsx         # ✨ New
```

## 🔌 Twilio Configuration

### New env vars in `config.py`
```python
# Twilio
twilio_account_sid: str = ""
twilio_auth_token: str = ""
twilio_whatsapp_from: str = "whatsapp:+14155238886"  # Sandbox default
twilio_whatsapp_number: str = ""  # Your approved WhatsApp number (for prod)

# Webhook security
twilio_webhook_url: str = ""  # e.g. https://api.roadwarrior.in/api/webhooks/whatsapp
twilio_auth_token_for_signing: str = ""  # Same as twilio_auth_token but explicit

# Mode
whatsapp_mode: Literal["mock", "live"] = "mock"
# When "mock": uses MockWhatsAppDispatcher (no real sends)
# When "live": uses TwilioWhatsAppDispatcher (requires all above vars)

# Feature flags
whatsapp_chatbot_enabled: bool = True
whatsapp_signature_verify: bool = True   # Disable ONLY for local dev with ngrok issues
```

### `utils/templates_meta.json`
Maps our template names to Twilio Content SID (or template SID) once approved. Empty placeholders for now, filled in after Meta approval:
```json
{
  "welcome": {
    "en": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "hi": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "kn": "HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  },
  "milestone_10": { "en": "...", "hi": "...", "kn": "..." },
  "milestone_25": { "en": "...", "hi": "...", "kn": "..." },
  "milestone_50": { "en": "...", "hi": "...", "kn": "..." },
  "my_score":     { "en": "...", "hi": "...", "kn": "..." },
  "referral_share": { "en": "...", "hi": "...", "kn": "..." },
  "chatbot_menu":  { "en": "...", "hi": "...", "kn": "..." },
  "chatbot_step":  { "en": "...", "hi": "...", "kn": "..." },
  "duplicate":     { "en": "...", "hi": "...", "kn": "..." }
}
```

In **sandbox mode** (no approval), we use plain session messages (free-form text) instead of templates. The code auto-falls back if the template SID is missing.

## 📜 Outbound Message Templates

For **sandbox/dev mode** (no approval needed), messages are sent as free-form session messages. Content:

### Welcome (outbound, sent on form submit)
**EN:**
```
Welcome {{name}}! 🎉

You are now registered with Road Warrior.
Your referral code: {{code}}

Share it with other riders to earn points and rewards.
Road Warrior — let's go! 🚴
```

**HI:**
```
Namaste {{name}} bhai! 🎉

Aapka Road Warrior pe registration ho gaya.
Aapka referral code: {{code}}

Is code ko apne doston ke saath share karo aur points kamao.
Road Warrior bano! 🚴
```

**KN:**
```
Namaskara {{name}}! 🎉

Nimma Road Warrior registration aythu.
Nimma referral code: {{code}}

Baddi riders jothe share madi points gagne.
Road Warrior — mundhe noduva! 🚴
```

### Milestone 10 (sent on 10th referral)
**EN:**
```
🎉 Congratulations {{name}}!

You've referred 10 riders and earned 100 bonus points!
You're now a Road Warrior 🥉 BRONZE member.

Keep going — 25 referrals unlocks SILVER + 300 bonus points!

Your stats:
• Total points: {{points}}
• Total referrals: {{count}}
```

(Hindi and Kannada variants in `locales/`)

### Milestone 25
**EN:**
```
🏆 Amazing {{name}}!

25 referrals complete!
You've earned 300 bonus points and are now 🥈 SILVER.

The road is yours!
• Total points: {{points}}
• Referrals: {{count}}

Next: 50 referrals for 🥇 GOLD + lucky draw entry!
```

### Milestone 50
**EN:**
```
🥇 LEGENDARY {{name}}!

50 riders referred! INCREDIBLE!
You've earned 500 bonus points + entered our LUCKY DRAW! 🎰

Stay tuned for the draw announcement on 15th.

• Total points: {{points}}
• You're in the top {{percentile}}% of all riders!
```

### MY SCORE (reply to "MY SCORE" inbound)
**EN:**
```
Hi {{name}}! 🏍️

Your Road Warrior stats:
• Points: {{points}}
• Referrals: {{count}}
• Rank: #{{rank}} of {{total}} riders

{{next_milestone_text}}

Your code: {{code}}
Share: {{share_url}}
```

`next_milestone_text` is computed dynamically:
- If < 10: `"You're {{X}} referrals away from 100 bonus points! 🥉"`
- If < 25: `"You're {{X}} referrals away from 300 bonus points! 🥈"`
- If < 50: `"You're {{X}} referrals away from the lucky draw! 🥇"`
- If >= 50: `"You've reached the maximum milestone! 🏆"`

### Referral Share (reply to "REFERRAL" inbound)
**EN:**
```
Your Road Warrior referral code: {{code}}

Share this message:
---
🚴 Join me on Road Warrior! Use my code {{code}} to register and we'll both earn rewards. Let's go electric!
{{share_url}}
---
```

### Duplicate (sent when existing rider submits again)
**EN:**
```
Hi {{name}}! You're already a Road Warrior. 

Your code: {{code}}
Your points: {{points}}

Share it with more friends to earn more points!
```


## 🤖 Chatbot Flow (Full Questionnaire over WhatsApp)

When a rider sends **any message** to the Twilio number (and isn't in an active flow), they get the menu. When they reply `1` (or `START`), the chatbot begins the 6-section questionnaire, one question at a time.

### State machine

```
        ┌──────────┐
   ──▶  │  MENU    │  (initial state, or "0" to return)
        └────┬─────┘
             │ 1 / START / FORM
             ▼
        ┌──────────┐
        │  LANG    │  "Choose: 1) English 2) हिंदी 3) ಕನ್ನಡ"
        └────┬─────┘
             │ 1/2/3
             ▼
        ┌──────────┐
        │  NAME    │  "What's your full name?"
        └────┬─────┘
             │ text
             ▼
        ┌──────────┐
        │  PHONE   │  "Your WhatsApp number? (10 digits)"
        └────┬─────┘
             │ 10-digit
             ▼
        ┌──────────┐
        │  CITY    │  "City: 1) Bangalore 2) Mumbai 3) Delhi 4) Hyd 5) Chennai 6) Pune 7) Other"
        └────┬─────┘
             │ 1-7
             ▼
        ┌──────────┐
        │  PLAT    │  "Platform: 1) Swiggy 2) Zomato 3) Blinkit 4) Porter 5) Dunzo 6) Other"
        └────┬─────┘
             │ 1-6
             ▼
        ┌──────────┐
        │  YEARS   │  "Years of experience? (0-50)"
        └────┬─────┘
             │ number
             ▼
        ┌──────────┐
        │  VEHICLE │  "Vehicle: 1) Petrol 2) Diesel 3) Electric 4) Other"
        └────┬─────┘
             │ 1-4
             ▼
        ┌──────────┐
        │  BRAND   │  "Brand & model? (or 'skip')"
        └────┬─────┘
             │ text or 'skip'
             ▼
        ┌──────────┐
        │  FUEL    │  "How do you fuel? 1) Petrol pump 2) Home charging 3) Battery swap 4) Other"
        └────┬─────┘
             │ 1-4
             ▼
        ┌──────────┐
        │  WEEKLY  │  "Weekly fuel/charge expense in ₹?"
        └────┬─────┘
             │ number
             ▼
        ┌──────────┐
        │  MONTHLY │  "Monthly maintenance in ₹?"
        └────┬─────┘
             │ number
             ▼
        ┌──────────┐
        │  CHAL    │  "Top 3 challenges? Reply with numbers, comma-separated (e.g. 1,3,5)"
        │          │  1) High fuel cost 2) Frequent breakdown 3) No charging 4) Range anxiety 5) Repair cost 6) Long refuel 7) Other
        └────┬─────┘
             │ "1,3,5" or "1,3" etc
             ▼
        ┌──────────┐
        │  INS_ACC │  "Accidental insurance? 1) Yes 2) No 3) Not sure"
        └────┬─────┘
             │ 1-3
             ▼
        ┌──────────┐
        │  INS_HLT │  "Health insurance? 1) Yes 2) No 3) Not sure"
        └────┬─────┘
             │ 1-3
             ▼
        ┌──────────┐
        │  OOP     │  "Ever paid out of pocket for an accident? 1) Yes 2) No"
        └────┬─────┘
             │ 1-2
             ▼
        ┌──────────┐
        │  SWITCH  │  "Open to EV? 1) Yes 2) No 3) Already EV 4) Need info"
        └────┬─────┘
             │ 1-4
             ▼
        ┌──────────┐
        │  MOTIV   │  "What would make you switch? Reply with numbers, comma-separated"
        │          │  1) Lower rental 2) Better range 3) Swap nearby 4) Income guarantee 5) Subsidy 6) Other
        └────┬─────┘
             │ "1,4,5" etc
             ▼
        ┌──────────┐
        │  INTRSTD │  "Interested in: 1) EV rental 2) Insurance 3) Retrofit 4) All 5) None (reply with numbers)"
        └────┬─────┘
             │ numbers
             ▼
        ┌──────────┐
        │  REFER   │  "Were you referred? 1) Yes 2) No"
        └────┬─────┘
             │ 1
             ▼
        ┌──────────┐
        │  REFCODE │  "Enter referral code (e.g. RW-4821)"
        └────┬─────┘
             │ RW-XXXX
             ▼
        ┌──────────┐
        │ CONFIRM  │  "Confirm? Reply YES to submit, NO to cancel"
        └────┬─────┘
             │ YES
             ▼
        ┌──────────┐
        │  DONE    │  Saves rider, sends welcome WhatsApp
        └──────────┘
```

### Session persistence
- `whatsapp_sessions` table stores `{ phone, step, partial_data (jsonb), language, last_active_at }`
- TTL: 30 minutes — if no reply, session expires
- On `START`, a new session is created (or old one replaced)
- On `0` or `MENU`, returns to menu and clears `step`
- On `CANCEL` or `QUIT`, deletes the session
- On error in any step, sends "Invalid input, try again" with the same question

### Section C skip logic
- If `vehicle == 1 (petrol)` or `2 (diesel)`: after main challenges, ask PETROL sub-challenges
- If `vehicle == 3 (electric)`: ask EV sub-challenges
- If `vehicle == 4 (other)`: skip sub-challenges

### Step handlers (in `services/whatsapp_chatbot.py`)
Each step is a function:
```python
async def handle_name(session, message) -> str:
    if len(message) < 2:
        return "Please enter your full name (at least 2 characters)."
    session.partial_data["full_name"] = message.strip()
    session.step = "phone"
    return await ask_phone(session.language)

async def handle_phone(session, message) -> str:
    if not validate_indian_phone(message):
        return "Invalid phone. Enter 10 digits (e.g. 9876543210)."
    normalized = normalize(message)
    # Check for duplicate
    existing = await get_rider_by_phone(db, normalized)
    if existing:
        # Send duplicate message, end session
        await dispatcher.send_duplicate(existing)
        await session_manager.delete(session)
        return None  # no further reply
    session.partial_data["phone"] = normalized
    session.step = "city"
    return await ask_city(session.language)
```

The router in `api/webhooks.py`:
```python
async def route_inbound(phone: str, body: str):
    session = await session_manager.get_or_create(phone)
    body = body.strip()

    # Global commands (work in any state)
    if body.upper() in ("0", "MENU", "HELP"):
        session.step = "menu"
        return await ask_menu(session.language)
    if body.upper() in ("CANCEL", "QUIT", "STOP"):
        await session_manager.delete(session)
        return "Cancelled. Type anything to start again."

    # Menu state
    if session.step == "menu":
        if body in ("1", "START", "FORM"):
            session.step = "lang"
            return await ask_lang()
        if body.upper() == "MY SCORE":
            return await handle_my_score(phone)
        if body.upper() == "REFERRAL":
            return await handle_referral_share(phone)
        return "Reply 1, 2, 3, or MY SCORE / REFERRAL / HELP"

    # Mid-flow
    handler = STEP_HANDLERS.get(session.step)
    return await handler(session, body)
```


## 🛡️ Twilio Implementation Details

### `services/whatsapp_twilio.py`

```python
from twilio.rest import Client
from twilio.request_validator import RequestValidator

class TwilioWhatsAppDispatcher:
    def __init__(self):
        self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        self.from_number = settings.twilio_whatsapp_from
        self.validator = RequestValidator(settings.twilio_auth_token)

    def verify_signature(self, url: str, params: dict, signature: str) -> bool:
        if not settings.whatsapp_signature_verify:
            return True  # dev escape hatch
        return self.validator.validate(url, params, signature)

    async def _send(self, to_phone: str, body: str, template: str = None, language: str = "en") -> MessageResult:
        # Check if we have an approved template SID for this template+language
        template_sid = self._get_template_sid(template, language)
        try:
            if template_sid:
                # Use Twilio Content API
                msg = self.client.messages.create(
                    from_=self.from_number,
                    to=f"whatsapp:{to_phone}",
                    content_sid=template_sid,
                    content_variables=json.dumps({...})  # parsed from body placeholders
                )
            else:
                # Fallback: plain session message (works in sandbox)
                msg = self.client.messages.create(
                    from_=self.from_number,
                    to=f"whatsapp:{to_phone}",
                    body=body
                )
            return MessageResult(success=True, sid=msg.sid, status=msg.status)
        except Exception as e:
            logger.exception("Twilio send failed")
            return MessageResult(success=False, error=str(e))

    async def send_welcome(self, rider): ...
    async def send_milestone(self, rider, milestone): ...
    async def send_my_score(self, rider, stats): ...
    async def send_referral_share(self, rider): ...
    async def send_duplicate(self, rider): ...
```

**Key behaviors:**
- All sends are wrapped in try/except — never crash the API call
- Each send writes a `whatsapp_messages` row before and after, with status updates
- `template_variables` extracted from body using regex (e.g., `{{name}}` → actual name)
- Phone numbers are E.164 formatted before sending
- Sandbox rate limit: 1 msg/sec → small `asyncio.sleep` if needed in burst scenarios

### Dispatcher factory (in `main.py`)

```python
def get_dispatcher() -> WhatsAppDispatcher:
    if settings.whatsapp_mode == "live":
        return TwilioWhatsAppDispatcher()
    return MockWhatsAppDispatcher()
```

Stored in `app.state.dispatcher` at startup, injected via `Depends`.

### `api/webhooks.py` (full implementation)

```python
@router.post("/api/webhooks/whatsapp")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),       # "whatsapp:+919876543210"
    Body: str = Form(...),       # user message
    MessageSid: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    # 1. Verify signature
    form_data = await request.form()
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    if not dispatcher.verify_signature(url, dict(form_data), signature):
        raise HTTPException(403, "Invalid signature")

    # 2. Log inbound message
    phone = From.replace("whatsapp:", "")
    await log_message(db, phone=phone, direction="inbound", body=Body, status="received")

    # 3. Route
    response_text = await route_inbound(db, phone, Body, dispatcher)

    # 4. Return TwiML
    if response_text is None:
        return Response(content="<Response/>", media_type="application/xml")
    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{response_text}</Message></Response>'
    return Response(content=twiml, media_type="application/xml")
```

### `api/webhooks_status.py` (delivery status callbacks)

```python
@router.post("/api/webhooks/whatsapp/status")
async def whatsapp_status(
    MessageSid: str = Form(...),
    MessageStatus: str = Form(...),   # queued, sent, delivered, read, failed
    ErrorCode: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    # Update whatsapp_messages.status where twilio_sid = MessageSid
    ...
```

Configured in Twilio console: "Status Callback URL" = `https://api.../api/webhooks/whatsapp/status`

## 🧪 Tests

### `test_whatsapp_twilio.py` (~10 tests)
- Mock the Twilio `Client` with `unittest.mock`
- Verify `send_welcome` calls the right Twilio method with right params
- Verify E.164 phone formatting
- Verify template SID lookup with fallback
- Verify exception handling (Twilio returns error → MessageResult(success=False))
- Verify `verify_signature` accepts valid sig, rejects invalid
- Verify signature bypass when `whatsapp_signature_verify=False`

### `test_whatsapp_chatbot.py` (~15 tests)
- Start → menu
- Menu → START → language prompt
- Each step: valid input advances, invalid input returns same question
- Phone validation: rejects "1234", accepts "9876543210"
- Duplicate phone: sends duplicate message, ends session
- Cancellation: deletes session
- Full happy path: simulate all 18 steps in sequence, assert final DB row + welcome sent
- Mid-flow "MENU" command: returns to menu, preserves partial_data (or wipes? — TBD)

### `test_whatsapp_webhook.py` (~8 tests, expanded from PR #2)
- POST without signature → 403
- POST with valid signature → 200, returns TwiML
- "MY SCORE" message → my-score reply sent
- "REFERRAL" message → share message sent
- Unknown command in menu state → fallback help
- "START" in menu state → begins chatbot

### `test_whatsapp_signature.py` (~3 tests)
- Real Twilio signature algorithm produces expected result
- Modified body fails verification
- Missing signature header → 403

### `test_whatsapp_status.py` (~4 tests)
- Status "delivered" updates DB row
- Status "failed" updates DB row + records error
- Unknown SID → 200 (idempotent)
- Missing params → handled gracefully

## 📖 WHATSAPP_SETUP.md (Setup Guide Content)

Will include step-by-step:
1. Create Twilio account
2. Activate WhatsApp sandbox (instant) OR request production access
3. Get Account SID, Auth Token
4. Configure webhook URL in Twilio console: `https://<your-api>/api/webhooks/whatsapp`
5. Configure status callback: `https://<your-api>/api/webhooks/whatsapp/status`
6. Set env vars: `WHATSAPP_MODE=live`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
7. (Optional) Submit templates to Meta for approval — content provided in `services/whatsapp_templates.py`
8. Test with sandbox: join by sending `join <keyword>` to the sandbox number
9. Going to production: WhatsApp Business API setup with Meta, phone number verification
10. Cost expectations: ~₹0.50 per business-initiated conversation in India


## 🖥️ Admin Messages Tab (Frontend)

Make the PR #3 stub functional:

### `app/admin/messages/page.tsx`
- Server component that fetches initial messages via `GET /api/admin/messages?limit=100`
- Client component for filtering and live updates

### `MessageLogTable.tsx`
- Columns: Timestamp, Phone, Direction (⇡/⇩), Template, Language, Status, Body preview
- Click row → opens MessagePreviewDialog with full body + Twilio SID
- Pagination (50 per page)
- Sortable by timestamp
- Status badges: color-coded (green=delivered, yellow=sent, red=failed, gray=queued)

### `MessageFilters.tsx`
- Direction filter (outbound / inbound)
- Status filter (multi-select)
- Template filter (multi-select)
- Date range
- Phone search

### `MessagePreviewDialog.tsx`
- Modal showing full message body
- Template variables extracted
- Twilio SID (clickable to Twilio console in prod)
- Retry button for failed messages (calls `POST /api/admin/messages/{id}/retry`)

### New API endpoints needed
- `POST /api/admin/messages/{id}/retry` — re-send a failed message
- (Optional) `POST /api/admin/messages/preview` — show what a message would look like for a given rider

## ✅ Acceptance Criteria

### Twilio Integration
- [ ] `WHATSAPP_MODE=live` with valid creds → form submission triggers real Twilio send
- [ ] Webhook with valid X-Twilio-Signature → 200, message processed
- [ ] Webhook with invalid signature → 403
- [ ] Webhook with missing signature (in dev mode) → 200 (when `whatsapp_signature_verify=False`)
- [ ] Status callback updates `whatsapp_messages.status` correctly
- [ ] Twilio API errors don't crash the calling code (return `MessageResult(success=False)`)
- [ ] All sends logged in `whatsapp_messages` table

### Outbound Messages
- [ ] Submit form → rider receives WhatsApp in their preferred language
- [ ] 10th referral → original rider receives milestone_10 WhatsApp
- [ ] 25th referral → milestone_25 WhatsApp
- [ ] 50th referral → milestone_50 WhatsApp
- [ ] Duplicate submission → duplicate WhatsApp (not welcome)
- [ ] `MY SCORE` text → instant reply with current stats
- [ ] `REFERRAL` text → reply with code + share message

### Chatbot Flow
- [ ] First message → menu
- [ ] `1` or `START` → language selection
- [ ] All 18 steps handle valid input correctly
- [ ] All 18 steps handle invalid input gracefully
- [ ] Phone duplicate mid-chatbot → duplicate message + session ends
- [ ] `0` or `MENU` mid-flow → returns to menu
- [ ] `CANCEL` mid-flow → session deleted, friendly message
- [ ] Session expires after 30 min inactivity
- [ ] Final submission via chatbot creates rider + sends welcome

### Admin UI
- [ ] `/admin/messages` shows all messages, both directions
- [ ] Filters work correctly
- [ ] Click message → preview dialog shows full body
- [ ] Failed messages show retry button
- [ ] Retry successfully re-sends

### Tests
- [ ] All 40 new tests pass
- [ ] Coverage on `services/whatsapp_*` > 80%
- [ ] `test_whatsapp_chatbot` simulates full 18-step flow successfully

## 📊 Estimated Effort
- **Size:** L (Large)
- **Files:** ~15 new + 5 modified
- **Lines:** ~2,000 LOC
- **Tests:** ~40 new test cases

## ⚠️ Risks & Notes
- **Twilio sandbox** is great for dev but doesn't replicate production template behavior — must test in live mode before launch
- **Webhook signature validation** requires HTTPS — `ngrok` or deployed URL only
- **Meta template approval** takes 24-48 hours; must be done early in launch timeline
- **Chatbot UX** is text-only — no rich media. If we want images/buttons later, Twilio supports it but adds complexity
- **Rate limits**: Twilio sandbox caps at ~100 msg/day per sender; production has per-number limits
- **Hindi/Kannada** templates need Meta approval in those specific languages — separate submissions
- **Twilio costs** in India: ~₹0.50 per business-initiated conversation, ~₹0.25 for user-initiated. Budget for 5K conversations/month
- **Test mode**: Twilio's `+15005550006` magic numbers can simulate send failures — use in tests

## 🔗 Related PRs
- **PR #1** ✅ — schema (whatsapp_messages, whatsapp_sessions)
- **PR #2** ✅ — dispatcher interface, mock implementation
- **PR #3** ✅ — Messages tab UI stub
- **PR #5** — CI/CD, e2e tests, monitoring, cost dashboards

---

**Reviewer focus areas:**
1. Twilio choice — confirm vs 360dialog/MessageBird/direct Meta. Sandbox experience is the deciding factor for dev velocity.
2. Chatbot state machine — is 18 steps too many? Should we group them (e.g., ask 3 challenges at once)?
3. Template approval strategy — should we submit all 9 templates × 3 languages = 27 at once, or iterate?
4. Webhook security — is signature verification sufficient, or should we add IP allowlist for Twilio's webhook IPs?
5. Session timeout — 30 min seems long, 10 min might be safer?
6. Admin retry — should we retry with backoff automatically, or require manual intervention?
