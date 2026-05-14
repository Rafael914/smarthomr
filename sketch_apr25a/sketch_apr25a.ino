#include <WiFi.h>
#include <HTTPClient.h>
#include <PZEM004Tv30.h>

const char* ssid = "RAFAEL6877";
const char* password = "fafael**5678++";

String serverURL = "http://192.168.137.1:8000";

#define relay1 25
#define relay2 26
#define relay3 27

// UART2 shared
HardwareSerial pzemSerial(2);

// PZEM devices (different addresses)
PZEM004Tv30 pzem1(pzemSerial, 16, 17, 0x01);
PZEM004Tv30 pzem2(pzemSerial, 16, 17, 0x02);
PZEM004Tv30 pzem3(pzemSerial, 16, 17, 0x03);

// Relay states
bool relayState1 = false;
bool relayState2 = false;
bool relayState3 = false;
bool openAll = false;
bool closeAll = false;

void setup() {
  Serial.begin(115200);

  // UART for PZEM
  pzemSerial.begin(9600, SERIAL_8N1, 16, 17);

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

void sendPZEMData() {
  // ===== PZEM 1 =====
  float v1 = pzem1.voltage();
  float c1 = pzem1.current();
  float p1 = pzem1.power();
  float e1 = pzem1.energy();
  float f1 = pzem1.frequency();
  float pf1 = pzem1.pf();

  // ===== PZEM 2 =====
  float v2 = pzem2.voltage();
  float c2 = pzem2.current();
  float p2 = pzem2.power();
  float e2 = pzem2.energy();
  float f2 = pzem2.frequency();
  float pf2 = pzem2.pf();

  // ===== PZEM 3 =====
  float v3 = pzem3.voltage();
  float c3 = pzem3.current();
  float p3 = pzem3.power();
  float e3 = pzem3.energy();
  float f3 = pzem3.frequency();
  float pf3 = pzem3.pf();

  Serial.println("=== PZEM READINGS ===");
  Serial.printf("P1 V:%.2f A:%.2f W:%.2f\n", v1, c1, p1);
  Serial.printf("P2 V:%.2f A:%.2f W:%.2f\n", v2, c2, p2);
  Serial.printf("P3 V:%.2f A:%.2f W:%.2f\n", v3, c3, p3);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL + "/api/pzem");
    http.addHeader("Content-Type", "application/json");

    String json = "{";

    // ===== PZEM 1 =====
    json += "\"pzem1\":{";
    json += "\"voltage\":"   + String(isnan(v1)?0:v1,2) + ",";
    json += "\"current\":"   + String(isnan(c1)?0:c1,2) + ",";
    json += "\"power\":"     + String(isnan(p1)?0:p1,2) + ",";
    json += "\"energy\":"    + String(isnan(e1)?0:e1,2) + ",";
    json += "\"frequency\":" + String(isnan(f1)?0:f1,2) + ",";
    json += "\"pf\":"        + String(isnan(pf1)?0:pf1,2);
    json += "},";

    // ===== PZEM 2 =====
    json += "\"pzem2\":{";
    json += "\"voltage\":"   + String(isnan(v2)?0:v2,2) + ",";
    json += "\"current\":"   + String(isnan(c2)?0:c2,2) + ",";
    json += "\"power\":"     + String(isnan(p2)?0:p2,2) + ",";
    json += "\"energy\":"    + String(isnan(e2)?0:e2,2) + ",";
    json += "\"frequency\":" + String(isnan(f2)?0:f2,2) + ",";
    json += "\"pf\":"        + String(isnan(pf2)?0:pf2,2);
    json += "},";

    // ===== PZEM 3 =====
    json += "\"pzem3\":{";
    json += "\"voltage\":"   + String(isnan(v3)?0:v3,2) + ",";
    json += "\"current\":"   + String(isnan(c3)?0:c3,2) + ",";
    json += "\"power\":"     + String(isnan(p3)?0:p3,2) + ",";
    json += "\"energy\":"    + String(isnan(e3)?0:e3,2) + ",";
    json += "\"frequency\":" + String(isnan(f3)?0:f3,2) + ",";
    json += "\"pf\":"        + String(isnan(pf3)?0:pf3,2);
    json += "}";

    json += "}";

    int code = http.POST(json);
    Serial.println("POST -> " + String(code));
    http.end();
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL + "/api/sensor");

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

  // Relay control
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

  // Send PZEM data
  sendPZEMData();

  delay(2000);
}