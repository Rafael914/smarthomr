#include <WiFi.h>
#include <HTTPClient.h>
#include <PZEM004Tv30.h>

const char* ssid = "RAFAEL6877";
const char* password = "fafael**5678++";

const char* relayURL = "http://192.168.137.1:8000/api/relay";
const char* pzemURL = "http://192.168.137.1:8000/api/pzem";

// PZEMs share the ESP32 UART2 RS485/TTL bus. Set these to the addresses
// actually programmed into the five meters (each address must be unique).
constexpr int PZEM_RX_PIN = 16;
constexpr int PZEM_TX_PIN = 17;
constexpr uint8_t PZEM_ADDRESSES[] = {0x01, 0x02, 0x03, 0x04, 0x05};
constexpr size_t PZEM_COUNT = sizeof(PZEM_ADDRESSES) / sizeof(PZEM_ADDRESSES[0]);

HardwareSerial pzemSerial(2);
PZEM004Tv30 pzems[] = {
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[0]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[1]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[2]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[3]),
  PZEM004Tv30(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN, PZEM_ADDRESSES[4])
};

// Relay pins and control state retained from the original sketch.
#define relay1 25
#define relay2 26
#define relay3 27
#define relay4 32
#define relay5 33

bool relayState1 = false;
bool relayState2 = false;
bool relayState3 = false;
bool relayState4 = false;
bool relayState5 = false;
bool openAll = false;
bool closeAll = false;

void postPzemReadings() {
  if (WiFi.status() != WL_CONNECTED) return;

  String body = "[";
  for (size_t i = 0; i < PZEM_COUNT; ++i) {
    const float voltage = pzems[i].voltage();
    const float current = pzems[i].current();
    const float power = pzems[i].power();
    const float energy = pzems[i].energy();
    const float frequency = pzems[i].frequency();
    const float pf = pzems[i].pf();

    if (i > 0) body += ",";
    body += "{\"outlet_id\":" + String(i + 1);
    body += ",\"voltage\":" + String(isnan(voltage) ? 0 : voltage, 2);
    body += ",\"current\":" + String(isnan(current) ? 0 : current, 3);
    body += ",\"power\":" + String(isnan(power) ? 0 : power, 2);
    body += ",\"energy\":" + String(isnan(energy) ? 0 : energy, 3);
    body += ",\"frequency\":" + String(isnan(frequency) ? 0 : frequency, 1);
    body += ",\"pf\":" + String(isnan(pf) ? 0 : pf, 2) + "}";
  }
  body += "]";

  HTTPClient http;
  http.begin(pzemURL);
  http.addHeader("Content-Type", "application/json");
  const int code = http.POST(body);
  if (code < 200 || code >= 300) {
    Serial.printf("PZEM POST failed: %d\n", code);
    if (code > 0) Serial.println(http.getString());
  } else {
    Serial.println("Five PZEM readings sent to dashboard API.");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pzemSerial.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);

  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  pinMode(relay4, OUTPUT);
  pinMode(relay5, OUTPUT);

  // SAFE INITIAL STATE (ALL OFF)
  digitalWrite(relay1, LOW);
  digitalWrite(relay2, HIGH);
  digitalWrite(relay3, HIGH);
  digitalWrite(relay4, HIGH);
  digitalWrite(relay5, HIGH);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print('.');
  }
  Serial.println("\nWiFi Connected");
  Serial.println(WiFi.localIP());
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;
    http.begin(relayURL);

    int code = http.GET();

    if (code == 200) {

      String payload = http.getString();
      Serial.println(payload);

      relayState1 = payload.indexOf("\"relay1\":true") != -1;
      relayState2 = payload.indexOf("\"relay2\":true") != -1;
      relayState3 = payload.indexOf("\"relay3\":true") != -1;
      relayState4 = payload.indexOf("\"relay4\":true") != -1;
      relayState5 = payload.indexOf("\"relay5\":true") != -1;

      openAll = payload.indexOf("\"openAll\":true") != -1;
      closeAll = payload.indexOf("\"closeAll\":true") != -1;
    }

    http.end();

    // =========================
    // RELAY CONTROL LOGIC
    // =========================

    if (openAll) {

      digitalWrite(relay1, HIGH);
      digitalWrite(relay2, LOW);
      digitalWrite(relay3, LOW);
      digitalWrite(relay4, LOW);
      digitalWrite(relay5, LOW);

    }
    else if (closeAll) {

      digitalWrite(relay1, LOW);
      digitalWrite(relay2, HIGH);
      digitalWrite(relay3, HIGH);
      digitalWrite(relay4, HIGH);
      digitalWrite(relay5, HIGH);

    }
    else {

      // Relay 1 (normal relay)
      digitalWrite(relay1, relayState1 ? HIGH : LOW);

      // Relay 2-5 (ACTIVE-LOW relay board)
      digitalWrite(relay2, relayState2 ? LOW : HIGH);
      digitalWrite(relay3, relayState3 ? LOW : HIGH);
      digitalWrite(relay4, relayState4 ? LOW : HIGH);
      digitalWrite(relay5, relayState5 ? LOW : HIGH);
    }

    postPzemReadings();
  } else {

    Serial.println("WiFi Disconnected");

    // Relays keep their last state.
    // No automatic shutdown.
  }

  delay(2000);
}

//THIS IS THE CODE WHERE YOU CAN SET THE ADDRESS OF THE PZEM004T MODULES.

// #include <PZEM004Tv30.h>

// PZEM004Tv30 pzem(Serial2, 16, 17);

// void setup() {
//   Serial.begin(115200);
//   delay(1000);

//   uint8_t newAddr = 0x01;

//   if (pzem.setAddress(newAddr)) {
//     Serial.println("Success");
//   } else {
//     Serial.println("Failed");
//   }
// }

// void loop() {
// }