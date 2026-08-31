# ResQNet — Native Android Emergency SOS System

This directory contains the **Native Android (Kotlin & Jetpack Compose)** implementation of the ResQNet Emergency SOS system, built for **Android Studio**.

---

## 🏗️ Architecture & Features

* **Language**: Kotlin 2.0+
* **UI Toolkit**: Jetpack Compose (Material 3 Dark Theme)
* **Data Architecture**: Kotlinx Serialization & EncryptedSharedPreferences
* **Hardware Services**:
  * `AndroidLocationService`: High-Accuracy Fused Location Provider (`PRIORITY_HIGH_ACCURACY`)
  * `AndroidSmsCallService`: Native Telephony (`Intent.ACTION_CALL`) and pre-filled GPS distress SMS
  * `EmergencyServerBridge`: FastAPI / Central Emergency Server cloud upload (`/api/v1/incidents/ingest`)

---

## 🏛️ 10-Module Automatic SOS Distribution System

| # | Module | Kotlin Class | Responsibility |
|---|---|---|---|
| 1 | **Existing RSEP System** | `ExistingRsepManager` | Loads pre-existing `.rsep` file from secure internal vault with zero user selection. |
| 2 | **SOS Controller** | `AutomaticSosController` | Coordinates the 1-touch automated distribution pipeline. |
| 3 | **Device Discovery** | `DeviceDiscoveryManager` | Multi-transport scan across BLE 5.0 & Wi-Fi Direct. |
| 4 | **Connection Manager** | `ConnectionManager` | Zero-prompt GATT / Socket peer handshake. |
| 5 | **RSEP Transfer Manager** | `RsepTransferManager` | Transmits raw `.rsep` payload over BLE MTU chunks or Wi-Fi Direct socket. |
| 6 | **Relay Manager** | `RelayManager` | Receiving devices automatically become relay nodes. |
| 7 | **Duplicate Detection** | `DuplicateDetectionManager` | `SOS-XXXXX = RECEIVED` registry; drops repeated packets (`DUPLICATE → IGNORE`). |
| 8 | **TTL Management** | `TtlManager` | Enforces hop decrement (5 ➔ 0); halts relay when TTL reaches 0. |
| 9 | **Internet Gateway** | `InternetGatewayManager` | Detects internet on any node, uploads RSEP, marks `DELIVERED`, and stops relay. |
| 10 | **Emergency Server** | `EmergencyServerBridge` | Ingests RSEP at FastAPI `/api/v1/incidents/ingest` and issues receipts. |

---

## 📱 How to Open & Run in Android Studio

1. Launch **Android Studio**.
2. Click **File ➔ Open...** (or **Open an Existing Project**).
3. Select the `android/` folder inside this repository (`c:\work\Anitigravity\hackathon\disaster management\ResQNet\android`).
4. Wait for Gradle Sync to complete.
5. Select an Android Emulator (API 34+) or connect a physical Android phone.
6. Click the green **Run ▶️** button.

---

## 🧪 Testing the 1-Touch Emergency Flow

1. On the **Home Screen**, hold the **Hero SOS Button** for 3 seconds.
2. The app will navigate directly to **Active SOS Screen**.
3. Watch the **Automatic SOS Distribution Stepper** progress live:
   * `SOS ACTIVATED`
   * `RSEP FOUND`
   * `SEARCHING FOR NEARBY DEVICES`
   * `DEVICE FOUND (Device A - BLE)`
   * `RSEP TRANSFERRED`
   * `RELAYING THROUGH MESH`
   * `INTERNET GATEWAY FOUND (Device C)`
   * `SOS DELIVERED TO EMERGENCY SERVER`
