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
import re
import time
import uuid
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.security.auth import create_access_token
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger("ResQNet_OTP")

# In-memory OTP request store (requestId -> {phone, expiresAt, provider, demoOtp})
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
