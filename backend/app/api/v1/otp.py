"""
ResQNet — OTP Authentication Proxy
==================================

Routes OTP requests to the configured provider (Fast2SMS preferred,
MSG91 as alternate, or DEMO MODE for instant local testing).

Free tier:
  - Fast2SMS: 50 SMS on signup, no KYC, no DLT required for free trial
  - MSG91:    5,000 SMS on signup, but requires KYC + DLT for delivery
  - Demo:     unlimited, no SMS sent (use code 123456)

Provider selection: the first enabled provider in this order is used:
  1. FAST2SMS_ENABLED + FAST2SMS_API_KEY → Fast2SMS
  2. MSG91_ENABLED    + MSG91_AUTH_KEY    → MSG91
  3. Otherwise                            → Demo Mode

Flow:
  Mobile → POST /auth/otp/send   { phoneNumber } → Provider sends SMS
  Mobile → POST /auth/otp/verify { phoneNumber, otp, requestId } → Provider verifies
"""
import random
import re
import smtplib
import time
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.security.auth import create_access_token
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("ResQNet_OTP")

# In-memory OTP request store (requestId -> {phone/email, expiresAt, provider, demoOtp})
# In production this should be Redis or a DB table. For a single-node
# FastAPI instance, in-memory is sufficient and avoids a new dependency.
_otp_store: Dict[str, Dict] = {}


def _active_provider() -> str:
    """Returns the provider name to use: 'fast2sms', 'msg91', or 'demo'."""
    if settings.FAST2SMS_ENABLED and settings.FAST2SMS_API_KEY:
        return "fast2sms"
    if settings.MSG91_ENABLED and settings.MSG91_AUTH_KEY:
        return "msg91"
    return "demo"


def _is_smtp_configured() -> bool:
    """Returns True if SMTP/Gmail credentials are fully configured."""
    return bool(
        settings.SMTP_ENABLED
        and settings.SMTP_HOST
        and settings.SMTP_USER
        and settings.SMTP_PASSWORD
    )


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────


class EmailOTPSendRequest(BaseModel):
    email: str = Field(..., description="Recipient email address, e.g. user@gmail.com")

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", cleaned):
            raise ValueError("Invalid email format")
        return cleaned


class EmailOTPVerifyRequest(BaseModel):
    email: str
    otp: str = Field(..., min_length=4, max_length=10)
    requestId: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────


class OTPSendRequest(BaseModel):
    phoneNumber: str = Field(..., description="E.164 format, e.g. +919876543210")
    countryCode: Optional[str] = Field("91", description="Numeric country code, default 91 (India)")

    @field_validator("phoneNumber")
    @classmethod
    def _normalize_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not cleaned.startswith("+"):
            raise ValueError("phoneNumber must be in E.164 format with leading +")
        digits = cleaned[1:]
        if not digits.isdigit() or len(digits) < 8 or len(digits) > 15:
            raise ValueError("phoneNumber has an invalid length")
        return cleaned


class OTPSendResponse(BaseModel):
    success: bool
    requestId: str
    message: str
    mode: str  # "fast2sms" | "msg91" | "demo"


class OTPVerifyRequest(BaseModel):
    phoneNumber: str
    otp: str = Field(..., min_length=4, max_length=10)
    requestId: Optional[str] = None


class OTPVerifyResponse(BaseModel):
    verified: bool
    mode: str
    accessToken: str
    user: Dict
    message: str


# ─────────────────────────────────────────────────────────────────────────────
# Provider Adapters
# ─────────────────────────────────────────────────────────────────────────────


def _fast2sms_send(phone_e164: str, request_id: str) -> str:
    """
    Send an OTP via Fast2SMS using the bulkV2 route (works without DLT
    for free trial credits). Fast2SMS generates the OTP and returns a
    request_id we can use to verify.
    Returns the provider's request_id (for stateless verify calls).
    """
    import httpx

    # Fast2SMS expects 10-digit Indian number for bulkV2
    digits = re.sub(r"\D", "", phone_e164)
    last10 = digits[-10:]

    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": settings.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "route": "otp",
        "variables_values": str(settings.FAST2SMS_OTP_LENGTH),  # not used; platform generates
        "flash": 0,
        "numbers": last10,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as e:
        logger.error(f"Fast2SMS network error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the SMS provider. Please try again.",
        )

    if resp.status_code >= 500:
        logger.error(f"Fast2SMS server error {resp.status_code}: {resp.text[:200]}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="SMS provider is temporarily unavailable.",
        )

    try:
        result = resp.json()
    except ValueError:
        logger.error(f"Fast2SMS returned non-JSON: {resp.text[:200]}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected response from SMS provider.",
        )

    if not result.get("return"):
        msg = result.get("message", "Failed to send OTP")
        logger.error(f"Fast2SMS send failed: {result}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Fast2SMS returns {"return":true,"request_id":"...","message":"..."}
    provider_request_id = str(result.get("request_id", request_id))
    logger.info(f"Fast2SMS OTP sent to {phone_e164} (request_id={provider_request_id})")
    return provider_request_id


def _fast2sms_verify(phone_e164: str, otp: str) -> bool:
    """
    Verify an OTP via Fast2SMS /dev/otp/verify.
    NOTE: bulkV2 route generates the OTP server-side and the user
    receives it via SMS. To verify, we still call /dev/otp/verify with
    the same mobile + otp — Fast2SMS matches the most recent OTP for
    that number.
    """
    import httpx

    digits = re.sub(r"\D", "", phone_e164)
    last10 = digits[-10:]

    url = "https://www.fast2sms.com/dev/otp/verify"
    headers = {
        "authorization": settings.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {"mobile": last10, "otp": otp}

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as e:
        logger.error(f"Fast2SMS verify network error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the SMS provider. Please try again.",
        )

    try:
        result = resp.json()
    except ValueError:
        logger.error(f"Fast2SMS verify returned non-JSON: {resp.text[:200]}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unexpected response from SMS provider.",
        )

    if not result.get("return"):
        # 200 with return=false → wrong OTP; 404 → no OTP found
        return False
    return True


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/otp/send", response_model=OTPSendResponse)
def send_otp(req: OTPSendRequest):
    """
    Send a one-time password to the given phone number.

    Provider is selected automatically based on which keys are configured
    (Fast2SMS > MSG91 > Demo Mode). Demo Mode does not send SMS — the
    fixed code 123456 is logged server-side and accepted by /verify.
    """
    provider = _active_provider()
    digits = re.sub(r"\D", "", req.phoneNumber)

    # Track this request server-side so verify can scope to it
    request_id = f"req_{uuid.uuid4().hex[:16]}"
    _otp_store[request_id] = {
        "phone": req.phoneNumber,
        "mobile_digits": digits,
        "issuedAt": time.time(),
        "expiresAt": time.time() + (
            settings.FAST2SMS_OTP_EXPIRY_MINUTES
            if provider == "fast2sms"
            else settings.MSG91_OTP_EXPIRY_MINUTES
        ) * 60,
        "verified": False,
        "provider": provider,
    }

    # ─── Demo Mode ───────────────────────────────────────────────────────
    if provider == "demo":
        demo_otp = "123456"
        _otp_store[request_id]["demoOtp"] = demo_otp
        logger.warning(
            f"[DEMO MODE] OTP send for {req.phoneNumber} — use code: {demo_otp} "
            f"(no provider enabled in .env)"
        )
        return OTPSendResponse(
            success=True,
            requestId=request_id,
            message=f"DEMO MODE: use code {demo_otp}",
            mode="demo",
        )

    # ─── Fast2SMS ────────────────────────────────────────────────────────
    if provider == "fast2sms":
        provider_request_id = _fast2sms_send(req.phoneNumber, request_id)
        _otp_store[request_id]["provider_request_id"] = provider_request_id
        return OTPSendResponse(
            success=True,
            requestId=request_id,
            message="OTP sent via Fast2SMS",
            mode="fast2sms",
        )

    # ─── MSG91 ───────────────────────────────────────────────────────────
    # (Kept for completeness; Fast2SMS is preferred when both are configured)
    if provider == "msg91":
        import httpx

        url = "https://api.msg91.com/api/v5/otp"
        params = {
            "mobile": digits,
            "otp_length": settings.MSG91_OTP_LENGTH,
            "otp_expiry": settings.MSG91_OTP_EXPIRY_MINUTES,
        }
        if settings.MSG91_TEMPLATE_ID:
            params["template_id"] = settings.MSG91_TEMPLATE_ID
        headers = {"authkey": settings.MSG91_AUTH_KEY, "Accept": "application/json"}

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(url, params=params, headers=headers)
        except httpx.HTTPError as e:
            logger.error(f"MSG91 network error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach the SMS provider. Please try again.",
            )

        try:
            result = resp.json()
        except ValueError:
            logger.error(f"MSG91 returned non-JSON: {resp.text[:200]}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unexpected response from SMS provider.",
            )

        if result.get("type") != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("message", "Failed to send OTP"),
            )

        _otp_store[request_id]["provider_request_id"] = result.get("requestId", request_id)
        return OTPSendResponse(
            success=True,
            requestId=request_id,
            message="OTP sent via MSG91",
            mode="msg91",
        )

    # Unreachable
    raise HTTPException(status_code=500, detail="Unknown provider state")


@router.post("/otp/verify", response_model=OTPVerifyResponse)
def verify_otp(req: OTPVerifyRequest):
    """
    Verify the OTP entered by the user. On success, returns a ResQNet
    JWT access token and a synthetic user object.
    """
    # ─── Locate the original request ────────────────────────────────────
    record = _otp_store.get(req.requestId or "")
    if not record:
        record = next(
            (r for r in _otp_store.values() if r["phone"] == req.phoneNumber and not r["verified"]),
            None,
        )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending OTP request found. Please request a new code.",
        )

    # Expiry check
    if time.time() > record["expiresAt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new code.",
        )

    provider = record.get("provider", "demo")

    # ─── Demo Mode verify ───────────────────────────────────────────────
    if provider == "demo":
        expected = record.get("demoOtp", "123456")
        if req.otp != expected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code.",
            )

    # ─── Fast2SMS verify ────────────────────────────────────────────────
    elif provider == "fast2sms":
        ok = _fast2sms_verify(record["phone"], req.otp)
        if not ok:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code.",
            )

    # ─── MSG91 verify ───────────────────────────────────────────────────
    elif provider == "msg91":
        import httpx

        url = "https://control.msg91.com/api/v5/otp/verify"
        headers = {
            "authkey": settings.MSG91_AUTH_KEY,
            "Content-Type": "application/json",
        }
        payload = {
            "mobile": record["mobile_digits"],
            "otp": req.otp,
            "requestId": record.get("provider_request_id", req.requestId),
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(url, json=payload, headers=headers)
        except httpx.HTTPError as e:
            logger.error(f"MSG91 verify network error: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach the SMS provider. Please try again.",
            )
        try:
            result = resp.json()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code.",
            )
        if result.get("type") != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code.",
            )

    # ─── Mark verified & issue ResQNet session token ────────────────────
    record["verified"] = True
    user_id = f"{provider}_{record['mobile_digits']}"
    access_token = create_access_token(user_id=user_id)

    user = {
        "id": user_id,
        "uid": user_id,
        "phoneNumber": record["phone"],
        "displayName": f"User {record['mobile_digits'][-4:]}",
        "email": "",
        "createdAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "firebaseUid": None,
    }

    logger.info(f"OTP verified for {record['phone']} via {provider} (uid={user_id})")
    return OTPVerifyResponse(
        verified=True,
        mode=provider,
        accessToken=access_token,
        user=user,
        message="Phone number verified successfully",
    )


# ─────────────────────────────────────────────────────────────────────────────
# Email (Gmail) OTP Endpoints — 100% Free & No Telecom DLT Required
# ─────────────────────────────────────────────────────────────────────────────


def _send_gmail_smtp(to_email: str, otp_code: str):
    """
    Sends a styled emergency OTP email via SMTP (e.g. Gmail).
    Uses standard smtplib with TLS on port 587.
    """
    sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    sender_name = settings.SMTP_FROM_NAME or "ResQNet Emergency Network"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🚨 {otp_code} is your ResQNet Verification Code"
    msg["From"] = formataddr((sender_name, sender_email))
    msg["To"] = to_email

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e6edf3; margin: 0; padding: 24px 12px; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #161b22; border-radius: 16px; border: 1px solid #30363d; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }}
        .banner {{ background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 28px 20px; text-align: center; }}
        .banner h1 {{ margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }}
        .banner p {{ margin: 6px 0 0 0; color: #fecaca; font-size: 13px; font-weight: 500; }}
        .body {{ padding: 32px 24px; text-align: center; }}
        .body p {{ color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; }}
        .code-container {{ background: #0d1117; border: 2px dashed #00E5FF; border-radius: 12px; padding: 18px 24px; margin: 0 auto 24px auto; display: inline-block; }}
        .code {{ font-family: 'Courier New', monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #00E5FF; margin: 0; }}
        .warning {{ font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; }}
        .footer {{ padding: 16px 24px; background: #0d1117; border-top: 1px solid #21262d; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="banner">
          <h1>🚨 ResQNet Access</h1>
          <p>Emergency Mesh & Disaster Response Vault</p>
        </div>
        <div class="body">
          <p>Your one-time authentication code for ResQNet is:</p>
          <div class="code-container">
            <div class="code">{otp_code}</div>
          </div>
          <p class="warning">
            ⏱️ This emergency code will expire in <strong>{settings.EMAIL_OTP_EXPIRY_MINUTES} minutes</strong>.<br>
            🔒 Never share this code with anyone.
          </p>
        </div>
        <div class="footer">
          ResQNet Central Cloud &bull; Zero-Telecom Emergency Protocol
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = (
        f"ResQNet Emergency Network Verification Code: {otp_code}\n"
        f"This code will expire in {settings.EMAIL_OTP_EXPIRY_MINUTES} minutes.\n"
        f"Do not share this code with anyone."
    )

    msg.attach(MIMEText(plain_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender_email, [to_email], msg.as_string())
        logger.info(f"Email OTP sent successfully to {to_email} via SMTP ({settings.SMTP_HOST})")
    except Exception as e:
        logger.error(f"Failed to send email OTP to {to_email} via SMTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to deliver verification email: {str(e)}",
        )


@router.post("/email-otp/send", response_model=OTPSendResponse)
def send_email_otp(req: EmailOTPSendRequest):
    """
    Send an OTP verification code to the user's email address (e.g. Gmail).
    - If Gmail SMTP credentials are configured in .env, sends real email.
    - Otherwise, automatically runs in Free Demo Mode (code: 123456).
    """
    email_clean = req.email.strip().lower()
    request_id = f"req_email_{uuid.uuid4().hex[:16]}"
    is_smtp = _is_smtp_configured()
    provider = "smtp" if is_smtp else "demo"

    if is_smtp:
        # Generate real 6-digit random code
        otp_code = f"{random.randint(100000, 999999)}"
        _otp_store[request_id] = {
            "email": email_clean,
            "issuedAt": time.time(),
            "expiresAt": time.time() + (settings.EMAIL_OTP_EXPIRY_MINUTES * 60),
            "verified": False,
            "provider": "smtp",
            "otp": otp_code,
        }
        _send_gmail_smtp(email_clean, otp_code)
        return OTPSendResponse(
            success=True,
            requestId=request_id,
            message=f"Verification code sent to {email_clean}",
            mode="smtp",
        )
    else:
        # Free Demo Mode
        demo_otp = "123456"
        _otp_store[request_id] = {
            "email": email_clean,
            "issuedAt": time.time(),
            "expiresAt": time.time() + (settings.EMAIL_OTP_EXPIRY_MINUTES * 60),
            "verified": False,
            "provider": "demo",
            "demoOtp": demo_otp,
        }
        logger.warning(
            f"[EMAIL DEMO MODE] OTP send for {email_clean} — use code: {demo_otp} "
            f"(configure SMTP_USER & SMTP_PASSWORD in backend/.env for real Gmail delivery)"
        )
        return OTPSendResponse(
            success=True,
            requestId=request_id,
            message=f"DEMO MODE: use code {demo_otp}",
            mode="demo",
        )


@router.post("/email-otp/verify", response_model=OTPVerifyResponse)
def verify_email_otp(req: EmailOTPVerifyRequest):
    """
    Verify the email OTP entered by the user.
    Returns a JWT access token and unified ResQNet user session.
    """
    email_clean = req.email.strip().lower()

    # Find pending record
    record = _otp_store.get(req.requestId or "")
    if not record:
        record = next(
            (r for r in _otp_store.values() if r.get("email") == email_clean and not r.get("verified")),
            None,
        )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending email OTP request found. Please request a new code.",
        )

    # Expiry check
    if time.time() > record["expiresAt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    provider = record.get("provider", "demo")

    if provider == "smtp":
        expected = record.get("otp")
        if req.otp != expected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check your email.",
            )
    else:
        # Demo mode
        expected = record.get("demoOtp", "123456")
        if req.otp != expected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. (In demo mode, use 123456)",
            )

    # Mark verified & issue session
    record["verified"] = True
    clean_id = re.sub(r"[^a-zA-Z0-9]", "_", email_clean)
    user_id = f"email_{clean_id}"
    access_token = create_access_token(user_id=user_id)

    name_prefix = email_clean.split("@")[0].replace(".", " ").title()
    user = {
        "id": user_id,
        "uid": user_id,
        "phoneNumber": "",
        "displayName": name_prefix,
        "email": email_clean,
        "createdAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "firebaseUid": None,
    }

    logger.info(f"Email OTP verified successfully for {email_clean} (uid={user_id})")
    return OTPVerifyResponse(
        verified=True,
        mode=provider,
        accessToken=access_token,
        user=user,
        message="Email verified successfully",
    )

