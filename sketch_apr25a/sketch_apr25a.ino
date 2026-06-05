#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "RAFAEL6877";
const char* password = "fafael**5678++";

String serverURL = "http://192.168.137.1:8000/api/relay";
// String serverURL = "https://smarthomr-production.up.railway.app/api/relay";

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

void setup() {
  Serial.begin(115200);

  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);
  pinMode(relay3, OUTPUT);
  pinMode(relay4, OUTPUT);
  pinMode(relay5, OUTPUT);

  // Start with all relays OFF
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
}

void loop() {

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;
    http.begin(serverURL);

    int code = http.GET();

    if (code == 200) {
      String payload = http.getString();

      relayState1 = payload.indexOf("\"relay1\":true") != -1;
      relayState2 = payload.indexOf("\"relay2\":true") != -1;
      relayState3 = payload.indexOf("\"relay3\":true") != -1;
      relayState4 = payload.indexOf("\"relay4\":true") != -1;
      relayState5 = payload.indexOf("\"relay5\":true") != -1;

      openAll  = payload.indexOf("\"openAll\":true") != -1;
      closeAll = payload.indexOf("\"closeAll\":true") != -1;
    }

    http.end();

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
  else {

    Serial.println("⚠️ Wi-Fi Disconnected");

    // Relays keep their last state.
    // No automatic shutdown.

  }

  delay(2000);
}