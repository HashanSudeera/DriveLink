#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <TinyGPS++.h>

// Firebase library and helpers
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// WiFi Credentials
#define WIFI_SSID "Dialog 4G Home"
#define WIFI_PASSWORD "De73fAA7"

// Firebase Credentials
#define API_KEY "AIzaSyAa9bahojYMk_1meGG8YCgUDFNj6MEHPeI"
#define DATABASE_URL "https://espclientsnew-default-rtdb.asia-southeast1.firebasedatabase.app/"

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Timer for Firebase updates
unsigned long sendDataPrevMillis = 0;
unsigned long sendDataInterval = 1000; // 1 second interval
bool signupOK = false;

// Ultrasonic Sensor Pins
const int tPin = 15;
const int ePin = 2;

// Button Pin
const int buttonPin = 4;

// LED Pins
const int led1 = 19;
const int led2 = 23;
bool led_status = false;

// Ultrasonic Constants
#define SOUND_SPEED 0.034
float distanceCm;
long duration;

// GPS Setup
static const int RXD2 = 5, TXD2 = 18; // Set correct ESP32 UART pins for GPS module
TinyGPSPlus gps;
HardwareSerial gpsSerial(2); // Use UART2 for GPS module

// GPS Data Variables
float latitude = 0.0, longitude = 0.0, speed_kmh = 0.0;
int satellites = 0;
String DeviceId = "User15"; // Change this for each ESP32 tracking device

// OLED display setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);


// fuel sensor
const int sensorPin = 32;  // ESP32 Analog input pin (change according to your wiring)
int sensorValue = 0;       // sensorPin default value
float Vin = 3.3;           // ESP32 operates at 3.3V
float Vout = 0;            // Vout default value
float Rref = 976;          // Reference resistor's value in ohms
float R = 0;               // Tested resistor default value

//battery
const int voltageSensorPin = 35;          // sensor pin
float vIn;                                // measured voltage (3.3V = max. 16.5V, 5V = max 25V)
float vOut;
float voltageSensorVal;                   // value on pin A3 (0 - 1023)
const float factor = 5.45;               // reduction factor of the Voltage Sensor shield
const float vCC = 3.3;                   // Arduino input voltage (measurable by voltmeter)



void startupScreen() {
    display.clearDisplay();
    display.setTextSize(2);
    display.setTextColor(WHITE);
    display.setCursor(20, 10);
    display.println("DriveLink");
    display.setTextSize(1);
    display.setCursor(30, 40);
    display.println("By TeraNode");
    display.display();
    delay(2000);
    display.clearDisplay();
}

void setup() {
    Serial.begin(115200);
    gpsSerial.begin(9600, SERIAL_8N1, RXD2, TXD2);

    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("OLED initialization failed!");
        while (true);
    }
    startupScreen();

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(300);
    }
    Serial.println("\nConnected to WiFi");

    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;

    pinMode(led1, OUTPUT);
    pinMode(led2, OUTPUT);
    pinMode(buttonPin, INPUT_PULLUP);
    pinMode(tPin, OUTPUT);
    pinMode(ePin, INPUT);

    // Firebase Anonymous Authentication
    if (Firebase.signUp(&config, &auth, "", "")) {
        Serial.println("Firebase Anonymous Authentication Successful!");
        signupOK = true;
    } else {
        Serial.printf("Firebase SignUp Failed: %s\n", config.signer.signupError.message.c_str());
    }

    config.token_status_callback = tokenStatusCallback;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // Create tasks for dual-core processing
    xTaskCreatePinnedToCore(ultrasonicAndDisplayTask, "UltrasonicAndDisplayTask", 10000, NULL, 1, NULL, 1); // Core 1
    xTaskCreatePinnedToCore(firebaseTask, "FirebaseTask", 10000, NULL, 1, NULL, 0); // Core 0
}

void loop() {
  sensorValue = analogRead(sensorPin);  // Read ADC value (0-4095 for ESP32)
  Vout = (Vin * sensorValue) / 4095.0;  // Convert ADC value to voltage
  if (Vout > 0) {                       // Avoid division by zero
    R = Rref * (1 / ((Vin / Vout) - 1)); // Calculate resistance
    Serial.print("Resistance (Ohms): ");
    Serial.println(R);
  } else {
    R = 0;
    Serial.println("Error: Vout is zero, check wiring.");
  }

   voltageSensorVal = analogRead(voltageSensorPin);    // read the current sensor value (0 - 1023) 
  Serial.println(voltageSensorVal);
  vOut = (voltageSensorVal / 4095) * vCC; //3.3            // convert the value to the real voltage on the analog pin
  vIn =  vOut * factor;                               // convert the voltage on the source by multiplying with the factor

  Serial.print("Voltage = ");             
  Serial.print(vIn);
  Serial.println("V");

    // The main loop doesn't need to handle sensor or Firebase tasks anymore.
    // We are delegating that to the FreeRTOS tasks.
   // Main loop is idle, waiting for tasks to handle
    while (gpsSerial.available() > 0) {
        gps.encode(gpsSerial.read()); // Parse GPS data
    }
    delay(100);
}

void ultrasonicAndDisplayTask(void *parameter) {
    while (true) {
        // Read Ultrasonic Sensor
        digitalWrite(tPin, LOW);
        delayMicroseconds(2);
        digitalWrite(tPin, HIGH);
        delayMicroseconds(10);
        digitalWrite(tPin, LOW);
        duration = pulseIn(ePin, HIGH);
        distanceCm = duration * SOUND_SPEED / 2;

        // Read GPS Data
        if (gps.location.isValid()) {
            latitude = gps.location.lat();
            longitude = gps.location.lng();
        }
        if (gps.speed.isValid()) {
            speed_kmh = gps.speed.kmph();
        }
        if (gps.satellites.isValid()) {
            satellites = gps.satellites.value();
        }

        Serial.printf("GPS: Lat: %.6f, Lon: %.6f, Speed: %.2f km/h, Satellites: %d\n",
                      latitude, longitude, speed_kmh, satellites);

        // Update OLED Display
        display.clearDisplay();
        display.setCursor(0, 10);
        display.println("Device: " + DeviceId);
        display.println("WiFi: Connected");
        display.println("Distance: " + String(distanceCm) + " cm");
        display.println("Lat: " + String(latitude, 6));
        display.println("Lon: " + String(longitude, 6));
        display.println("Speed: " + String(speed_kmh) + " km/h");
        display.display();

        vTaskDelay(500 / portTICK_PERIOD_MS);
    }
}

void firebaseTask(void *parameter) {
    while (true) {
        if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis >= sendDataInterval)) {
            sendDataPrevMillis = millis();

            FirebaseJson json;
            json.set("ultrasonic/value", distanceCm);
            json.set("button_status/value", digitalRead(buttonPin));
         
            json.set("tracking/latitude", latitude);
            json.set("tracking/longitude", longitude);
            json.set("tracking/speed", speed_kmh);
            json.set("tracking/satellites", satellites);
            json.set("ultrasonic/value", distanceCm);
            json.set("fuel_sensor/value", R);
            json.set("battery/value",vIn);

            // Send data to Firebase
            if (Firebase.RTDB.updateNode(&fbdo, DeviceId, &json)) {
                Serial.println("Data updated successfully!");
            } else {
                Serial.println("Data upload FAILED: " + fbdo.errorReason());
            }
        }

        // LED control from Firebase
        if (Firebase.RTDB.getInt(&fbdo, "/LED/digital")) {
            led_status = fbdo.to<int>();
            digitalWrite(led2, led_status ? HIGH : LOW);
        }

        vTaskDelay(500 / portTICK_PERIOD_MS);
    }
}
