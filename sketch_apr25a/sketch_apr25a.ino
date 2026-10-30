
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <PZEM004Tv30.h>

// WiFi Configuration
const char* ssid = "RAFAEL6877";
const char* password = "YOUR_WIFI_PASSWORD";

// ngrok HTTPS API URLs
const char* relayURL = "https://your-domain.ngrok-free.app/api/relay";
const char* pzemURL = "https://your-domain.ngrok-free.app/api/pzem";

// HTTPS Client
WiFiClientSecure secureClient;

// PZEM Configuration
constexpr int PZEM_RX_PIN = 16;
constexpr int PZEM_TX_PIN = 17;

constexpr uint8_t PZEM_ADDRESSES[] = {
  0x01, 0x02, 0x03, 0x04, 0x05
};

constexpr size_t PZEM_COUNT =
  sizeof(PZEM_ADDRESSES) / sizeof(PZEM_ADDRESSES[0]);

HardwareSerial pzemSerial(2);

PZEM004Tv30 pzems[] = {
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[0]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[1]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[2]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[3]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[4])
};

// Relay GPIO Pins
#define relay1 25
#define relay2 26
#define relay3 27
#define relay4 32
#define relay5 33

// Relay States
bool relayState1 = false;
bool relayState2 = false;
bool relayState3 = false;
bool relayState4 = false;
bool relayState5 = false;

bool openAll = false;
bool closeAll = false;

// WiFi Connection
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Testing only: replace with CA certificate verification for production
  secureClient.setInsecure();
}

// Send PZEM Readings to Backend
void postPzemReadings() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. PZEM upload skipped.");
    return;
  }

  String body = "[";

  for (size_t i = 0; i < PZEM_COUNT; i++) {
    float voltage = pzems[i].voltage();
    float current = pzems[i].current();
    float power = pzems[i].power();
    float energy = pzems[i].energy();
    float frequency = pzems[i].frequency();
    float pf = pzems[i].pf();

    if (i > 0) {
      body += ",";
    }

    body += "{\"outlet_id\":" + String(i + 1);
    body += ",\"voltage\":" + String(isnan(voltage) ? 0 : voltage, 2);
    body += ",\"current\":" + String(isnan(current) ? 0 : current, 3);
    body += ",\"power\":" + String(isnan(power) ? 0 : power, 2);
    body += ",\"energy\":" + String(isnan(energy) ? 0 : energy, 3);
    body += ",\"frequency\":" + String(isnan(frequency) ? 0 : frequency, 1);
    body += ",\"pf\":" + String(isnan(pf) ? 0 : pf, 2);
    body += "}";
  }

  body += "]";

  HTTPClient http;

  http.setTimeout(10000);

  if (!http.begin(secureClient, pzemURL)) {
    Serial.println("Failed to initialize PZEM HTTPS connection.");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  Serial.println("Uploading PZEM readings...");

  int code = http.POST(body);

  if (code >= 200 && code < 300) {
    Serial.println("Five PZEM readings successfully sent.");
    Serial.println(http.getString());
  } else {
    Serial.printf("PZEM POST failed: %d\n", code);

    if (code > 0) {
      Serial.println(http.getString());
    }
  }

  http.end();
}

// Get Relay Commands from Backend
void getRelayCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected.");
    return;
  }

  HTTPClient http;

  http.setTimeout(10000);

  if (!http.begin(secureClient, relayURL)) {
    Serial.println("Failed to initialize relay HTTPS connection.");
    return;
  }

  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();

    Serial.println("Relay API Response:");
    Serial.println(payload);

    relayState1 = payload.indexOf("\"relay1\":true") != -1;
    relayState2 = payload.indexOf("\"relay2\":true") != -1;
    relayState3 = payload.indexOf("\"relay3\":true") != -1;
    relayState4 = payload.indexOf("\"relay4\":true") != -1;
    relayState5 = payload.indexOf("\"relay5\":true") != -1;

    openAll = payload.indexOf("\"openAll\":true") != -1;
    closeAll = payload.indexOf("\"closeAll\":true") != -1;

  } else {
    Serial.printf("Relay GET failed: %d\n", code);

    if (code > 0) {
      Serial.println(http.getString());
    }
  }

  http.end();
}

// Apply Relay States
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

// Setup
void setup() {
  Serial.begin(115200);

  pzemSerial.begin(
    9600,
    SERIAL_8N1,
    PZEM_RX_PIN,
    PZEM_TX_PIN
  );

  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  pinMode(relay4, OUTPUT);
  pinMode(relay5, OUTPUT);

  digitalWrite(relay1, LOW);
  digitalWrite(relay2, HIGH);
  digitalWrite(relay3, HIGH);
  digitalWrite(relay4, HIGH);
  digitalWrite(relay5, HIGH);

  connectWiFi();

  Serial.println("VoltGuard ESP32 Started");
  Serial.println("Using ngrok HTTPS connection");
}

// Main Loop
void loop() {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.reconnect();

    delay(3000);
    return;
  }

  getRelayCommands();

  updateRelays();

  postPzemReadings();

  delay(2000);
}
