#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <PZEM004Tv30.h>
#include <math.h>
#include <string.h>

#include "secrets.h"

const int RELAY_PIN_1 = 26;
const int RELAY_PIN_2 = 27;
const int BUTTON_PIN_1 = 18;
const int BUTTON_PIN_2 = 19;
const int LED_PIN = 2;
const int PZEM_RX_PIN = 16;
const int PZEM_TX_PIN = 17;
const unsigned long DEBOUNCE_MS = 50;

String TOPIC_TELEMETRY = String("smarthome/") + USER_ID + "/" + DEVICE_ID + "/telemetry";
String TOPIC_RELAY = String("smarthome/") + USER_ID + "/" + DEVICE_ID + "/relay";
String TOPIC_STATUS = String("smarthome/") + USER_ID + "/" + DEVICE_ID + "/status";
String TOPIC_HEARTBEAT = String("smarthome/") + USER_ID + "/" + DEVICE_ID + "/heartbeat";

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

bool relay1State = false;
bool relay2State = false;
bool lastButton1Reading = HIGH;
bool lastButton2Reading = HIGH;
bool button1State = HIGH;
bool button2State = HIGH;
unsigned long lastDebounce1 = 0;
unsigned long lastDebounce2 = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastHeartbeatTime = 0;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

void publishRelayStatus() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["esp32Id"] = DEVICE_ID;
  doc["relay1"] = relay1State ? "ON" : "OFF";
  doc["relay2"] = relay2State ? "ON" : "OFF";
  String payload;
  serializeJson(doc, payload);
  mqttClient.publish(TOPIC_STATUS.c_str(), payload.c_str());
}

void setRelay1(bool on) {
  relay1State = on;
  digitalWrite(RELAY_PIN_1, relay1State ? LOW : HIGH);
  Serial.println("[Relay 1] " + String(relay1State ? "ON" : "OFF"));
}

void setRelay2(bool on) {
  relay2State = on;
  digitalWrite(RELAY_PIN_2, relay2State ? LOW : HIGH);
  Serial.println("[Relay 2] " + String(relay2State ? "ON" : "OFF"));
}

void setupWiFi() {
  delay(10);
  Serial.println("\n[WiFi] Connecting to: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n[WiFi] Failed to connect. Check credentials and use a 2.4GHz hotspot.");
    digitalWrite(LED_PIN, LOW);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  Serial.println("[MQTT] " + String(topic) + " -> " + message);

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, message)) return;

  if (String(topic) != TOPIC_RELAY) return;

  const int relayNum = doc["relay"] | 1;
  const char* state = doc["state"] | "OFF";
  const bool newState = strcmp(state, "ON") == 0 || strcmp(state, "true") == 0 || doc["state"] == true;

  if (relayNum == 1) setRelay1(newState);
  else if (relayNum == 2) setRelay2(newState);
  else return;

  publishRelayStatus();
}

void reconnectMQTT() {
  while (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    Serial.print("[MQTT] Connecting...");
    String clientId = "ESP32_SmartHome_" + String(random(0xffff), HEX);
    const bool connected = MQTT_USER[0] == '\0'
                             ? mqttClient.connect(clientId.c_str())
                             : mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);

    if (connected) {
      Serial.println("Connected!");
      mqttClient.subscribe(TOPIC_RELAY.c_str());

      StaticJsonDocument<256> statusDoc;
      statusDoc["status"] = "online";
      statusDoc["rssi"] = WiFi.RSSI();
      statusDoc["hardware"] = "ESP32-WROOM-32";
      String statusPayload;
      serializeJson(statusDoc, statusPayload);
      mqttClient.publish(TOPIC_STATUS.c_str(), statusPayload.c_str());
      publishRelayStatus();
    } else {
      Serial.print("Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Retrying in 5s...");
      delay(5000);
    }
  }
}

void handleButton(int pin, bool& lastReading, bool& stableState,
                  unsigned long& lastDebounceTime, int relayNumber) {
  const bool reading = digitalRead(pin);
  if (reading != lastReading) {
    lastDebounceTime = millis();
    lastReading = reading;
  }

  if (millis() - lastDebounceTime < DEBOUNCE_MS || reading == stableState) return;
  stableState = reading;
  if (stableState != LOW) return;

  if (relayNumber == 1) setRelay1(!relay1State);
  else setRelay2(!relay2State);
  publishRelayStatus();
}

void setup() {
  Serial.begin(115200);
  Serial.println("[SmartHome AI] Booting ESP32 2-socket node...");

  pinMode(RELAY_PIN_1, OUTPUT);
  pinMode(RELAY_PIN_2, OUTPUT);
  digitalWrite(RELAY_PIN_1, HIGH);
  digitalWrite(RELAY_PIN_2, HIGH);

  pinMode(BUTTON_PIN_1, INPUT_PULLUP);
  pinMode(BUTTON_PIN_2, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  setupWiFi();

  if (!mqttClient.setBufferSize(512)) {
    Serial.println("[MQTT] Failed to allocate telemetry packet buffer.");
  }
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  ArduinoOTA.setHostname("esp32-smarthome-node");
  ArduinoOTA.begin();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) setupWiFi();
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();
  ArduinoOTA.handle();

  handleButton(BUTTON_PIN_1, lastButton1Reading, button1State, lastDebounce1, 1);
  handleButton(BUTTON_PIN_2, lastButton2Reading, button2State, lastDebounce2, 2);

  const unsigned long now = millis();
  if (mqttClient.connected() && now - lastTelemetryTime >= 2000) {
    lastTelemetryTime = now;

    const float voltageV = pzem.voltage();
    const float currentA = pzem.current();
    const float powerW = pzem.power();
    const float energyKWh = pzem.energy();
    const float frequencyHz = pzem.frequency();
    const float powerFactor = pzem.pf();
    const bool pzemConnected = isfinite(voltageV) && isfinite(currentA) && isfinite(powerW) && isfinite(energyKWh) && isfinite(frequencyHz) && isfinite(powerFactor);

    Serial.printf(
      "[PZEM] voltage=%.2f V, current=%.3f A, power=%.2f W, energy=%.3f kWh, frequency=%.2f Hz, factor=%.2f, valid=%s\n",
      voltageV,
      currentA,
      powerW,
      energyKWh,
      frequencyHz,
      powerFactor,
      pzemConnected ? "yes" : "no"
    );

    StaticJsonDocument<512> doc;
    doc["esp32Id"] = DEVICE_ID;
    doc["relayState"] = relay1State;
    doc["relay1"] = relay1State;
    doc["relay2"] = relay2State;
    doc["pzemConnected"] = pzemConnected;
    if (pzemConnected) {
      doc["voltageV"] = voltageV;
      doc["currentA"] = currentA;
      doc["powerW"] = powerW;
      doc["energyKWh"] = energyKWh;
      doc["powerFactor"] = powerFactor;
      doc["frequencyHz"] = frequencyHz;
    }
    doc["timestamp"] = now;

    String telemetryPayload;
    serializeJson(doc, telemetryPayload);
    const bool published = mqttClient.publish(TOPIC_TELEMETRY.c_str(), telemetryPayload.c_str());
    if (published) {
      Serial.println("[MQTT] Telemetry publish: accepted by client.");
    } else {
      Serial.printf(
        "[MQTT] Telemetry publish rejected (connected=%s, payload=%u bytes, state=%d).\n",
        mqttClient.connected() ? "yes" : "no",
        static_cast<unsigned int>(telemetryPayload.length()),
        mqttClient.state()
      );
    }
  }

  if (mqttClient.connected() && now - lastHeartbeatTime >= 30000) {
    lastHeartbeatTime = now;
    mqttClient.publish(TOPIC_HEARTBEAT.c_str(), "{\"status\":\"alive\"}");
  }
}
