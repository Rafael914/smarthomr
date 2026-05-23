#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "RAFAEL6877";
const char* password = "fafael**5678++";

String serverURL = "http://192.168.137.1:8000";

// Relay pins
#define relay1 25
#define relay2 26
#define relay3 27

// Relay states
bool relayState1 = false;
bool relayState2 = false;
bool relayState3 = false;
bool openAll = false;
bool closeAll = false;

void setup() {
  Serial.begin(115200);

  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);

  digitalWrite(relay1, LOW);
  digitalWrite(relay2, LOW);
  digitalWrite(relay3, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
  Serial.println("IP: " + WiFi.localIP().toString());
}

void loop() {
  // ===== GET RELAY COMMANDS =====
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL + "/api/relay");

    int code = http.GET();

    if (code == 200) {
      String payload = http.getString();

      relayState1 = payload.indexOf("\"relay1\":true") != -1;
      relayState2 = payload.indexOf("\"relay2\":true") != -1;
      relayState3 = payload.indexOf("\"relay3\":true") != -1;
      openAll     = payload.indexOf("\"openAll\":true") != -1;
      closeAll    = payload.indexOf("\"closeAll\":true") != -1;
    }

    http.end();
  }

  // ===== RELAY CONTROL =====
  if (openAll) {
    digitalWrite(relay1, HIGH);
    digitalWrite(relay2, HIGH);
    digitalWrite(relay3, HIGH);
  } 
  else if (closeAll) {
    digitalWrite(relay1, LOW);
    digitalWrite(relay2, LOW);
    digitalWrite(relay3, LOW);
  } 
  else {
    digitalWrite(relay1, relayState1);
    digitalWrite(relay2, relayState2);
    digitalWrite(relay3, relayState3);
  }

  delay(2000);
}