# twilio_service.py
# Small helper to send real SMS messages using Twilio.

import os
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def send_sms(to_number: str, message: str):
    print("Calling Twilio...")

    try:
        sms = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        print("Message SID:", sms.sid)
        return True, sms.sid

    except Exception as e:
        print("Twilio SMS Error:", e)
        return False, str(e)