#include <PZEM004Tv30.h>

#define RELAY_PIN 25

PZEM004Tv30 pzem(Serial2, 16, 17, 0x01);

bool relayState = false;

void setup() {
  Serial.begin(115200);

  Serial2.begin(9600, SERIAL_8N1, 16, 17);

  pinMode(RELAY_PIN, OUTPUT);

  // Default relay state
  digitalWrite(RELAY_PIN, LOW);
}

void loop() {

  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();
  float frequency = pzem.frequency();
  float pf = pzem.pf();

  Serial.println("========== PZEM ==========");

  if (isnan(voltage)) {
    Serial.println("PZEM NOT FOUND");
  } else {
    Serial.print("Voltage: ");
    Serial.print(voltage);
    Serial.println(" V");

    Serial.print("Current: ");
    Serial.print(current);
    Serial.println(" A");

    Serial.print("Power: ");
    Serial.print(power);
    Serial.println(" W");

    Serial.print("Energy: ");
    Serial.print(energy);
    Serial.println(" kWh");

    Serial.print("Frequency: ");
    Serial.print(frequency);
    Serial.println(" Hz");

    Serial.print("Power Factor: ");
    Serial.println(pf);
  }

  delay(2000);
}