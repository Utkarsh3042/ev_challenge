# Twilio WhatsApp Setup Guide

This guide walks you through connecting the Road Warrior platform to the official Twilio WhatsApp API for both inbound chatbots and outbound messages.

## 1. Twilio Sandbox Setup (Local Dev)
To test the chatbot without submitting business verification to Meta:

1. Sign up / Log in to [Twilio Console](https://console.twilio.com/).
2. Navigate to **Messaging > Try it out > Send a WhatsApp message**.
3. Activate the Sandbox. You will be given a Sandbox Number (e.g. `whatsapp:+14155238886`) and a join code (e.g. `join road-warrior`).
4. To test, send the join code from your personal WhatsApp to the Sandbox Number.

## 2. Update Environment Variables
Copy your Account SID and Auth Token from the Twilio Console homepage and add them to `backend/.env`:

```env
WHATSAPP_MODE=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
WHATSAPP_SIGNATURE_VERIFY=false  # Set to false for local dev with ngrok if it fails
```

## 3. Webhook Configuration (Inbound Chatbot)
To allow Twilio to send messages to your local machine:

1. Start ngrok on port 8000: `ngrok http 8000`
2. Copy the secure HTTPS URL (e.g. `https://xxxx.ngrok.app`).
3. In Twilio Console (Sandbox settings), paste the following into the **"WHEN A MESSAGE COMES IN"** field:
   `https://xxxx.ngrok.app/api/webhooks/whatsapp`
4. Set the HTTP method to **POST**.

## 4. Status Callback Configuration
To track message delivery statuses (Sent, Delivered, Read, Failed):

1. In the same Sandbox settings page, paste the following into the **"STATUS CALLBACK URL"** field:
   `https://xxxx.ngrok.app/api/webhooks/whatsapp/status`
2. Set the HTTP method to **POST**.

## 5. Testing the Flow
1. Start the backend: `make dev` (or `uvicorn app.main:app --reload`).
2. Send `START` to your Twilio Sandbox number on WhatsApp.
3. The chatbot will reply asking for your language, initiating the 5-step registration flow!
4. Check the Admin Dashboard under **Messages** to view the live logs and delivery statuses.
