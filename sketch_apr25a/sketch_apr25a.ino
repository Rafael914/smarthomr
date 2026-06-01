#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "RAFAEL6877";
const char* password = "fafael**5678++";

String serverURL = "http://192.168.137.1:8000/api/relay";

// Relay pins (Added Pin 32 and Pin 33 for Relay 4 & 5)
#define relay1 25
#define relay2 26
#define relay3 27
#define relay4 32
#define relay5 33

// Relay states
bool relayState1 = false;
bool relayState2 = false;
bool relayState3 = false;
bool relayState4 = false;
bool relayState5 = false;
bool openAll = false;
bool closeAll = false;

// Network Safeguard Variables
bool wifiSafetyEnabled = false;     
unsigned long lastWifiCheckTime = 0;   // Tracks the last timestamp when connection was healthy
const unsigned long WIFI_TIMEOUT_MS = 5000; // Time allowance (5s) before triggering auto-off

void setup() {
  Serial.begin(115200);

  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  pinMode(relay4, OUTPUT);
  pinMode(relay5, OUTPUT);

  // Initialize all 5 relays down cleanly
  digitalWrite(relay1, LOW);
  digitalWrite(relay2, LOW);
  digitalWrite(relay3, LOW);
  digitalWrite(relay4, LOW);
  digitalWrite(relay5, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
  Serial.println("IP: " + WiFi.localIP().toString());
  
  lastWifiCheckTime = millis(); // Initialize healthy timer state
}

void loop() {
  // ===== CASE 1: WI-FI IS CONNECTED =====
  if (WiFi.status() == WL_CONNECTED) {
    // Update our safety timestamp since the link is up
    lastWifiCheckTime = millis();

    HTTPClient http;
    http.begin(serverURL);

    int code = http.GET();

    if (code == 200) {
      String payload = http.getString();

      // Manual String Parsing (Expanded to 5 relays)
      relayState1       = payload.indexOf("\"relay1\":true") != -1;
      relayState2       = payload.indexOf("\"relay2\":true") != -1;
      relayState3       = payload.indexOf("\"relay3\":true") != -1;
      relayState4       = payload.indexOf("\"relay4\":true") != -1;
      relayState5       = payload.indexOf("\"relay5\":true") != -1;
      openAll           = payload.indexOf("\"openAll\":true") != -1;
      closeAll          = payload.indexOf("\"closeAll\":true") != -1;
      
      // Parse the safety key directly from the incoming string
      wifiSafetyEnabled = payload.indexOf("\"wifi_safety\":true") != -1;
    }

    http.end();

    // ===== NORMAL RELAY CONTROL ACTION =====
    if (openAll) {
      digitalWrite(relay1, HIGH);
      digitalWrite(relay2, HIGH);
      digitalWrite(relay3, HIGH);
      digitalWrite(relay4, HIGH);
      digitalWrite(relay5, HIGH);
    } 
    else if (closeAll) {
      digitalWrite(relay1, LOW);
      digitalWrite(relay2, LOW);
      digitalWrite(relay3, LOW);
      digitalWrite(relay4, LOW);
      digitalWrite(relay5, LOW);
    } 
    else {
      digitalWrite(relay1, relayState1 ? HIGH : LOW);
      digitalWrite(relay2, relayState2 ? HIGH : LOW);
      digitalWrite(relay3, relayState3 ? HIGH : LOW);
      digitalWrite(relay4, relayState4 ? HIGH : LOW);
      digitalWrite(relay5, relayState5 ? HIGH : LOW);
    }

  } 
  // ===== CASE 2: WI-FI DROPPED UNEXPECTEDLY =====
  else {
    Serial.println("⚠️ Wi-Fi Disconnected... Checking Failsafe status.");

    // Evaluate if the frontend toggled Network Failsafe Protection ON
    if (wifiSafetyEnabled) {
      // If it's been disconnected longer than our 5 second threshold
      if (millis() - lastWifiCheckTime >= WIFI_TIMEOUT_MS) {
        Serial.println("🚨 SAFEGUARD ALARM: Network lost. Killing all 5 relay systems immediately.");
        
        // Overwrite status configurations safely to local safe-states
        relayState1 = false;
        relayState2 = false;
        relayState3 = false;
        relayState4 = false;
        relayState5 = false;
        openAll = false;
        closeAll = false;

        // Force all 5 pins into immediate shutdown state
        digitalWrite(relay1, LOW);
        digitalWrite(relay2, LOW);
        digitalWrite(relay3, LOW);
        digitalWrite(relay4, LOW);
        digitalWrite(relay5, LOW);
      }
    } else {
      Serial.println("ℹ️ Network safeguard is DISABLED. Retaining previous system status.");
    }
  }

  delay(2000); // Polling baseline execution interval
}