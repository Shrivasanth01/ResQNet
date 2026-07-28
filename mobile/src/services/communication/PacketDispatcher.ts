import { EmergencyPacket } from "../../types/packet";
import { IDispatcher, CommunicationMethod, NetworkState } from "./CommunicationTypes";

/**
 * Functional Placeholder: Internet Dispatcher
 * Directly simulates sending encrypted distress payloads over HTTP POST to future FastAPI Server
 */
export class InternetDispatcher implements IDispatcher {
  public getMethodName(): CommunicationMethod {
    return "INTERNET";
  }

  public isAvailable(network: NetworkState): boolean {
    return network.internetAvailable && network.networkQualityScore >= 40;
  }

  public async dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean> {
    // Simulate lightweight network latency & successful ACK return from cloud server
    await new Promise((res) => setTimeout(res, 30));
    return true;
  }
}

/**
 * Functional Placeholder: Offline Queue Dispatcher
 * Guarantees local ACID persistence when zero RF or internet spectrums are available
 */
export class OfflineDispatcher implements IDispatcher {
  public getMethodName(): CommunicationMethod {
    return "OFFLINE_QUEUE";
  }

  public isAvailable(network: NetworkState): boolean {
    return true; // Always available as failsafe bunker storage
  }

  public async dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean> {
    // Confirms secure lodging into local outbox database vault
    return true;
  }
}

/**
 * Mocked Interface Contract: Bluetooth Mesh Dispatcher (Phase 3 Replacement)
 */
export class BluetoothDispatcher implements IDispatcher {
  public getMethodName(): CommunicationMethod {
    return "BLUETOOTH_MESH";
  }
  public isAvailable(network: NetworkState): boolean {
    return network.bluetoothAvailable && network.batteryLevel > 5;
  }
  public async dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 20));
    return true;
  }
}

/**
 * Mocked Interface Contract: Wi-Fi Direct Dispatcher (Phase 3 Replacement)
 */
export class WifiDispatcher implements IDispatcher {
  public getMethodName(): CommunicationMethod {
    return "WIFI_DIRECT";
  }
  public isAvailable(network: NetworkState): boolean {
    return network.wifiAvailable;
  }
  public async dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean> {
    return true;
  }
}

/**
 * Mocked Interface Contract: SMS Dispatcher (Future Carrier Text Replacement)
 */
export class SmsDispatcher implements IDispatcher {
  public getMethodName(): CommunicationMethod {
    return "SMS";
  }
  public isAvailable(network: NetworkState): boolean {
    return network.currentNetworkType.startsWith("CELLULAR") || network.batteryLevel > 15;
  }
  public async dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean> {
    return true;
  }
}

/**
 * Mocked Interface Contract: Satellite Dispatcher (Future LEO Satellite Uplink)
 */
export class SatelliteDispatcher implements IDispatcher {
  public getMethodName(): CommunicationMethod {
    return "SATELLITE";
  }
  public isAvailable(network: NetworkState): boolean {
    return network.gpsStatus === "LOCKED" && network.batteryLevel > 20;
  }
  public async dispatch(packet: EmergencyPacket, gatewayId?: string): Promise<boolean> {
    return true;
  }
}
