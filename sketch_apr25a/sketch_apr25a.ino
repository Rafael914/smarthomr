#include <WiFi.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <PZEM004Tv30.h>

// ==========================================
// WIFI CONFIGURATION
// ==========================================

const char* ssid = "RAFAEL6877";
const char* password = "123456789";

// ==========================================
// BACKEND API CONFIGURATION
// ==========================================

const char* relayURL = "http://10.118.174.173:5000/api/relay";
const char* pzemURL = "http://10.118.174.173:5000/api/pzem";

WiFiClient wifiClient;

// ==========================================
// PZEM CONFIGURATION
// ==========================================

// Both PZEM modules share one UART bus. Their different addresses
// allow the library to query them one at a time.
constexpr int PZEM1_RX_PIN = 16;
constexpr int PZEM1_TX_PIN = 17;
HardwareSerial pzemSerial1(2);
PZEM004Tv30 pzem1(pzemSerial1, PZEM1_RX_PIN, PZEM1_TX_PIN, 0x01);

// PZEM #2 uses address 0x03 on the same RX/TX wires as PZEM #1.
PZEM004Tv30 pzem2(pzemSerial1, PZEM1_RX_PIN, PZEM1_TX_PIN, 0x03);

constexpr size_t PZEM_COUNT = 2;

// ==========================================
// SIM800A CONFIGURATION
// ==========================================

HardwareSerial sim800Serial(1);

constexpr int SIM800_RX_PIN = 4;
constexpr int SIM800_TX_PIN = 5;
constexpr uint32_t SIM800_BAUD = 9600;

// ==========================================
// RELAY GPIO CONFIGURATION
// ==========================================

#define relay1 25
#define relay2 26
#define relay3 27
#define relay4 18  // Moved from 32 since GPIO 32 is now PZEM2 TX
#define relay5 33  // GPIO 33 is free

// ==========================================
// RELAY STATES
// ==========================================

bool relayState1 = false;
bool relayState2 = false;
bool relayState3 = false;
bool relayState4 = false;
bool relayState5 = false;

bool openAll = false;
bool closeAll = false;

// ==========================================
// SMS VARIABLES
// ==========================================

String sim800Line;
bool waitingForSmsBody = false;

// ==========================================
// WIFI MONITORING VARIABLES
// ==========================================

bool wasConnected = false;
unsigned long lastWiFiAttempt = 0;
const unsigned long WIFI_RECONNECT_INTERVAL = 5000;

// ==========================================
// SET ALL RELAYS
// ==========================================

void setAllRelays(bool enabled) {
  relayState1 = enabled;
  relayState2 = enabled;
  relayState3 = enabled;
  relayState4 = enabled;
  relayState5 = enabled;

  openAll = false;
  closeAll = false;
}

// ==========================================
// SET INDIVIDUAL RELAY
// ==========================================

void setRelayState(uint8_t relayNumber, bool enabled) {
  switch (relayNumber) {
    case 1: relayState1 = enabled; break;
    case 2: relayState2 = enabled; break;
    case 3: relayState3 = enabled; break;
    case 4: relayState4 = enabled; break;
    case 5: relayState5 = enabled; break;
    default: return;
  }
  openAll = false;
  closeAll = false;
}

// ==========================================
// APPLY RELAY STATES
// ==========================================

void updateRelays() {
  if (openAll) {
    digitalWrite(relay1, HIGH);
    digitalWrite(relay2, LOW);
    digitalWrite(relay3, LOW);
    digitalWrite(relay4, LOW);
    digitalWrite(relay5, LOW);
  } else if (closeAll) {
    digitalWrite(relay1, LOW);
    digitalWrite(relay2, HIGH);
    digitalWrite(relay3, HIGH);
    digitalWrite(relay4, HIGH);
    digitalWrite(relay5, HIGH);
  } else {
    digitalWrite(relay1, relayState1 ? HIGH : LOW);
    digitalWrite(relay2, relayState2 ? LOW : HIGH);
    digitalWrite(relay3, relayState3 ? LOW : HIGH);
    digitalWrite(relay4, relayState4 ? LOW : HIGH);
    digitalWrite(relay5, relayState5 ? LOW : HIGH);
  }
}

// ==========================================
// HANDLE SMS COMMANDS
// ==========================================

void handleSmsCommand(String command) {
  command.trim();
  command.toLowerCase();
  command.replace(" ", "");

  if (command == "all:on" || command == "allon" || command == "relay:on" || command == "relayon") {
    setAllRelays(true);
    Serial.println("[SMS] All relays ON");
    updateRelays();
    return;
  }

  if (command == "all:off" || command == "alloff" || command == "relay:off" || command == "relayoff") {
    setAllRelays(false);
    Serial.println("[SMS] All relays OFF");
    updateRelays();
    return;
  }

  if (!command.startsWith("relay") || command.length() < 9) {
    Serial.println("[SMS] Unknown command.");
    return;
  }

  int separator = command.indexOf(':');
  if (separator < 6) {
    Serial.println("[SMS] Invalid relay command.");
    return;
  }

  uint8_t relayNumber = command.substring(5, separator).toInt();
  String action = command.substring(separator + 1);

  if (relayNumber < 1 || relayNumber > 5 || (action != "on" && action != "off")) {
    Serial.println("[SMS] Invalid relay command.");
    return;
  }

  setRelayState(relayNumber, action == "on");
  Serial.printf("[SMS] Relay %u %s\n", relayNumber, action == "on" ? "ON" : "OFF");
  updateRelays();
}

// ==========================================
// PROCESS SIM800A SMS RESPONSE
// ==========================================

void processSim800Line(String line) {
  line.trim();
  if (line.startsWith("+CMT:")) {
    waitingForSmsBody = true;
    Serial.println("[SIM800A] Incoming SMS detected.");
    return;
  }

  if (waitingForSmsBody) {
    waitingForSmsBody = false;
    if (line.length() > 0) {
      Serial.print("[SMS] Received: ");
      Serial.println(line);
      handleSmsCommand(line);
    }
  }
}

// ==========================================
// READ SIM800A MESSAGES
// ==========================================

void processSim800Messages() {
  while (sim800Serial.available()) {
    char character = static_cast<char>(sim800Serial.read());
    if (character == '\n') {
      processSim800Line(sim800Line);
      sim800Line = "";
    } else if (character != '\r') {
      sim800Line += character;
    }
  }
}

// ==========================================
// WIFI CONNECTION
// ==========================================

void connectWiFi() {
  Serial.println();
  Serial.println("================================");
  Serial.println("       WIFI CONNECTION");
  Serial.println("================================");

  WiFi.mode(WIFI_STA);
  Serial.print("[WIFI] Connecting to: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int attempts = 0;
  const int maxAttempts = 30;

  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    Serial.print("[WIFI] Connecting");
    for (int i = 0; i < 3; i++) {
      delay(500);
      Serial.print(".");
    }
    Serial.println();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wasConnected = true;
    Serial.println();
    Serial.println("[WIFI] CONNECTION SUCCESSFUL!");
    Serial.print("[WIFI] ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    wasConnected = false;
    Serial.println();
    Serial.println("[WIFI] CONNECTION FAILED!");
  }
  Serial.println("================================");
  Serial.println();
}

// ==========================================
// WIFI CONNECTION MONITOR
// ==========================================

void monitorWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wasConnected) {
      wasConnected = true;
      Serial.println("[WIFI] RECONNECTED SUCCESSFULLY!");
    }
    return;
  }

  if (wasConnected) {
    Serial.println("[WIFI] CONNECTION LOST!");
    wasConnected = false;
  }

  if (millis() - lastWiFiAttempt >= WIFI_RECONNECT_INTERVAL) {
    lastWiFiAttempt = millis();
    WiFi.reconnect();
  }
}

// ==========================================
// SEND PZEM READINGS TO BACKEND
// ==========================================

void postPzemReadings() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[API] WiFi disconnected. PZEM upload skipped.");
    return;
  }

  float v1 = pzem1.voltage(), c1 = pzem1.current(), p1 = pzem1.power(), e1 = pzem1.energy(), f1 = pzem1.frequency(), pf1 = pzem1.pf();
  float v2 = pzem2.voltage(), c2 = pzem2.current(), p2 = pzem2.power(), e2 = pzem2.energy(), f2 = pzem2.frequency(), pf2 = pzem2.pf();

  String body = "[";

  // Outlet 1 (PZEM #1 - Addr 0x01 on GPIO 16/17)
  body += "{\"outlet_id\":1";
  body += ",\"voltage\":" + String(isnan(v1) ? 0 : v1, 2);
  body += ",\"current\":" + String(isnan(c1) ? 0 : c1, 3);
  body += ",\"power\":" + String(isnan(p1) ? 0 : p1, 2);
  body += ",\"energy\":" + String(isnan(e1) ? 0 : e1, 3);
  body += ",\"frequency\":" + String(isnan(f1) ? 0 : f1, 1);
  body += ",\"pf\":" + String(isnan(pf1) ? 0 : pf1, 2);
  body += "},";

  // Outlet 2 (PZEM #2 - Addr 0x03 on the shared GPIO 16/17 bus)
  body += "{\"outlet_id\":2";
  body += ",\"voltage\":" + String(isnan(v2) ? 0 : v2, 2);
  body += ",\"current\":" + String(isnan(c2) ? 0 : c2, 3);
  body += ",\"power\":" + String(isnan(p2) ? 0 : p2, 2);
  body += ",\"energy\":" + String(isnan(e2) ? 0 : e2, 3);
  body += ",\"frequency\":" + String(isnan(f2) ? 0 : f2, 1);
  body += ",\"pf\":" + String(isnan(pf2) ? 0 : pf2, 2);
  body += "}]";

  HTTPClient http;
  http.setTimeout(10000);

  if (!http.begin(wifiClient, pzemURL)) {
    Serial.println("[API] Failed to initialize PZEM HTTP connection.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);

  if (code >= 200 && code < 300) {
    Serial.printf("[API] PZEM upload successful. HTTP: %d\n", code);
  } else {
    Serial.printf("[API] PZEM POST failed. HTTP: %d\n", code);
  }

  http.end();
}

// ==========================================
// GET RELAY COMMANDS FROM BACKEND
// ==========================================

void getRelayCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.setTimeout(10000);

  if (!http.begin(wifiClient, relayURL)) return;

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    relayState1 = payload.indexOf("\"relay1\":true") != -1;
    relayState2 = payload.indexOf("\"relay2\":true") != -1;
    relayState3 = payload.indexOf("\"relay3\":true") != -1;
    relayState4 = payload.indexOf("\"relay4\":true") != -1;
    relayState5 = payload.indexOf("\"relay5\":true") != -1;
    openAll = payload.indexOf("\"openAll\":true") != -1;
    closeAll = payload.indexOf("\"closeAll\":true") != -1;
  }
  http.end();
}

// ==========================================
// SETUP
// ==========================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("================================");
  Serial.println("       VOLTGUARD SMART HUB");
  Serial.println("       POWER CONTROL SYSTEM");
  Serial.println("================================");

  // Both PZEM modules share UART2. Connect both RX pins to GPIO 16
  // and both TX pins to GPIO 17, with addresses 0x01 and 0x03.
  pzemSerial1.begin(
    9600,
    SERIAL_8N1,
    PZEM1_RX_PIN,
    PZEM1_TX_PIN
  );

  // SIM800A SERIAL (UART1 on GPIO 4 & 5)
  sim800Serial.begin(SIM800_BAUD, SERIAL_8N1, SIM800_RX_PIN, SIM800_TX_PIN);

  // RELAY PINS
  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  pinMode(relay4, OUTPUT);
  pinMode(relay5, OUTPUT);

  // DEFAULT RELAY STATES: ALL OFF
  digitalWrite(relay1, LOW);
  digitalWrite(relay2, HIGH);
  digitalWrite(relay3, HIGH);
  digitalWrite(relay4, HIGH);
  digitalWrite(relay5, HIGH);

  connectWiFi();

  // SIM800A INITIALIZATION
  delay(1000);
  sim800Serial.println("AT");
  delay(500);
  sim800Serial.println("AT+CMGF=1");
  delay(500);
  sim800Serial.println("AT+CNMI=2,2,0,0,0");
  delay(500);

  Serial.println("[SYSTEM] Setup Complete.");
}

// ==========================================
// MAIN LOOP
// ==========================================

void loop() {
  processSim800Messages();
  monitorWiFi();

  if (WiFi.status() != WL_CONNECTED) {
    delay(100);
    return;
  }

  getRelayCommands();
  updateRelays();
  postPzemReadings();

  delay(2000);
}