# MSG91 OTP Setup — ResQNet

> Send real OTP SMS to any Indian phone number — **5,000 free SMS** on signup, no credit card required.

---

## Why MSG91 over Firebase?

| Item | Firebase Phone Auth | MSG91 |
|---|---|---|
| India delivery | Region disabled by default (must upgrade to Blaze) | ✅ Native, no setup |
| Free tier | 10K/mo but **requires Blaze plan + credit card** | 5K on signup, **no credit card** |
| Setup time | ~10 min + console | ~5 min |
| Cost after free tier | ~$0.01/SMS | ~₹0.20/SMS (cheaper for India) |
| DLT compliance | N/A | Auto-registered when you pick a template |

For a hackathon demo in India, **MSG91 is the better choice** — no credit card, no region issues, fast.

---

## 5-Minute Setup

### Step 1: Create your MSG91 account
1. Go to **https://msg91.com/signup**
2. Sign up with your email + phone (no credit card)
3. Verify your email

### Step 2: Get your Auth Key
1. Login → **Dashboard**
2. Top right → click your profile → **API**
3. Copy your **Auth Key** (a long alphanumeric string)

### Step 3: Register a Sender ID (DLT, required for India)
1. Go to **https://vigore.in** (DLT platform)
2. Register as an entity (Principal Entity)
3. Register a **Header** (Sender ID) like `ResQNet` (6 chars max, alpha)
4. Wait for approval (~1-24 hours)

### Step 4: Create a DLT Template
1. Same DLT platform → **Template Registration**
2. Template content (use a registered template category like "OTP"):
   ```
   Your ResQNet verification code is {#var#}. Valid for 5 minutes. Do not share this code.
   ```
3. After approval, copy the **Template ID** (numeric, e.g. `1107161234567890123`)

### Step 5: Configure backend `.env`
Edit `ResQNet/backend/.env`:

```bash
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_actual_auth_key_here
MSG91_SENDER_ID=ResQNet
MSG91_TEMPLATE_ID=your_dlt_template_id_here
MSG91_OTP_LENGTH=6
MSG91_OTP_EXPIRY_MINUTES=5
```

> You only need `MSG91_AUTH_KEY` for testing. `MSG91_SENDER_ID` and `MSG91_TEMPLATE_ID` are required for production DLT compliance in India — without them, MSG91 may deliver only to your own test number.

### Step 6: Restart the backend
```bash
# Stop the existing server (Ctrl+C in its terminal), then:
cd ResQNet/backend
venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 7: Test it
1. Open **http://localhost:8081**
2. Phone login screen → country = **India (+91)**
3. Enter your real phone number (10 digits)
4. Click **Send Verification Code**
5. Real SMS arrives in 5-10 seconds
6. Enter the 6-digit code → you're logged in

---

## Demo Mode (zero setup, no SMS)

If you skip the setup above, the backend runs in **Demo Mode**:
- Any 6-digit code is accepted
- A fixed code `123456` is logged in the backend console
- No real SMS is sent, no MSG91 account needed
- Perfect for offline development, demos, and CI

To verify the backend is in demo mode, check the API response:
```json
{ "success": true, "requestId": "req_...", "message": "DEMO MODE: use code 123456", "mode": "demo" }
```

To explicitly force demo mode, set in `ResQNet/backend/.env`:
```bash
MSG91_ENABLED=false
```

And in `ResQNet/mobile/.env`:
```bash
EXPO_PUBLIC_OTP_PROVIDER=demo
```

---

## Cost Reference

| Volume | Cost (approx) |
|---|---|
| First 5,000 SMS | **Free** (signup bonus) |
| Next 5,000 SMS | ~₹0.20/SMS = ₹1,000 |
| 50K SMS/month | ~₹10,000 |
| 100K SMS/month | ~₹18,000 |

MSG91 is significantly cheaper than Firebase for India-specific delivery.

---

## Troubleshooting

### "Auth key invalid" (error 101)
- Double-check `MSG91_AUTH_KEY` in `backend/.env`
- Make sure there are no extra spaces
- Restart the backend after editing `.env`

### "Number blocked" / "DLT issue" (error 102)
- For production Indian numbers, you MUST register a DLT template
- For testing, use your own phone number (the one you signed up with)

### "Region not enabled" (error 105)
- Some regions require additional approval
- Check MSG91 Dashboard → **Coverage** to see enabled regions

### SMS arrives but verify fails
- Check the backend logs for the actual MSG91 response
- Common: Template content mismatch — the variable in your template must be `{#var#}` exactly
- Make sure the OTP length matches your template

### Mobile app says "Could not reach the auth server"
- Make sure backend is running on port 8000
- Open http://localhost:8000/docs to verify it's up
- For phone testing (not localhost), update `EXPO_PUBLIC_API_BASE_URL` to your LAN IP

### Want to test without burning SMS credits?
MSG91 doesn't have Firebase-style "test phone numbers", but:
- Use demo mode (any code works)
- Or send OTP to your own number only

---

## Files Touched

| File | What changed |
|---|---|
| `ResQNet/backend/app/config.py` | Added MSG91 settings (auth key, sender, template, expiry) |
| `ResQNet/backend/app/api/v1/otp.py` | New `/auth/otp/send` and `/auth/otp/verify` endpoints |
| `ResQNet/backend/app/main.py` | Registered the new OTP router |
| `ResQNet/backend/.env` | New file with MSG91 config (defaults to demo mode) |
| `ResQNet/mobile/src/services/msg91Auth.ts` | New service: calls backend proxy, mimics Firebase user shape |
| `ResQNet/mobile/src/services/firebaseAuth.ts` | Now delegates to MSG91 when configured |
| `ResQNet/mobile/src/firebase.ts` | Lazy Firebase init, added `isMsg91Configured()` |
| `ResQNet/mobile/.env` | Added `EXPO_PUBLIC_OTP_PROVIDER=msg91` |

The mobile UI (phone-login.tsx, verify-otp.tsx) is **untouched** — the swap is transparent.
