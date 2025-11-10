#include "tamalib.h"
#include "rom.h"
#include "secrets.h"

#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

// screen
static bool pixelsChanged = false;
static bool_t matrix_buffer[LCD_HEIGHT][LCD_WIDTH] = {{0}};
static bool_t icon_buffer[ICON_NUM] = {0};

// webserver port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

/* WEBSOCKET STUFF */

void notifyClients()
{
  char buffer[2 + (LCD_HEIGHT * LCD_WIDTH)];
  int pos = 0;
  for (int y = 0; y < LCD_HEIGHT; y++) {
    for (int x = 0; x < LCD_WIDTH; x++) {
      buffer[pos++] = matrix_buffer[y][x] ? '1' : '0';
    }
  }
  buffer[pos] = '\0';
    
  ws.textAll(buffer); //TODO test
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    if (strcmp((char*)data, "a-press") == 0) {
      tamalib_set_button(BTN_LEFT, BTN_STATE_PRESSED);
    }
    if (strcmp((char*)data, "b-press") == 0) {
      tamalib_set_button(BTN_MIDDLE, BTN_STATE_PRESSED);
    }
    if (strcmp((char*)data, "c-press") == 0) {
      tamalib_set_button(BTN_RIGHT, BTN_STATE_PRESSED);
    }
    if (strcmp((char*)data, "a-release") == 0) {
      tamalib_set_button(BTN_LEFT, BTN_STATE_RELEASED);
    }
    if (strcmp((char*)data, "b-release") == 0) {
      tamalib_set_button(BTN_MIDDLE, BTN_STATE_RELEASED);
    }
    if (strcmp((char*)data, "c-release") == 0) {
      tamalib_set_button(BTN_RIGHT, BTN_STATE_RELEASED);
    }
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
      break;
    case WS_EVT_DISCONNECT:
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
      break;
    case WS_EVT_DATA:
      handleWebSocketMessage(arg, data, len);
      break;
    case WS_EVT_PONG:
    case WS_EVT_ERROR:
      break;
  }
}

void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

/*HAL T FUNCTIONS*/

static void * hal_malloc(u32_t size)
{
  return 0;  // not used as we don't use BP's
}

static void hal_free(void *ptr)
{
	// not used as we don't use BP's
}

static void hal_halt(void)
{
	// not yet implemented
}

static bool_t hal_is_log_enabled(log_level_t level)
{
  return false;
}

static void hal_log(log_level_t level, char *buff, ...)
{
  // not implemented
}

static timestamp_t hal_get_timestamp(void) //TODO test
{ 
  return micros();
}

static void hal_sleep_until(timestamp_t ts) //this makes the time be accurate
{
  while(micros() < ts) {}
}

static void hal_update_screen(void)
{
  /*
  // TODO: tell the system to redraw screen
  for (int y = 0; y < LCD_HEIGHT; y++) {
    for (int x = 0; x < LCD_WIDTH; x++) {
      if (matrix_buffer[y][x]) {
        Serial.print("█");
      } else {
        Serial.print("░");
      }
    }
    Serial.println(); // new line after each row
  }
  Serial.println("...");*/

  notifyClients();
  
  //TODO auto release after x frames instead of this
  //tamalib_set_button(BTN_LEFT, BTN_STATE_RELEASED);
  //tamalib_set_button(BTN_MIDDLE, BTN_STATE_RELEASED);
  //tamalib_set_button(BTN_RIGHT, BTN_STATE_RELEASED);
}

static void hal_set_lcd_matrix(u8_t x, u8_t y, bool_t val)
{
  matrix_buffer[y][x] = val;
  pixelsChanged = true;
}

static void hal_set_lcd_icon(u8_t icon, bool_t val)
{
  icon_buffer[icon] = val;
}

static void hal_set_frequency(u32_t freq)
{
  // TODO
}

static void hal_play_frequency(bool_t en)
{
  // TODO
}

static int hal_handler(void)
{
  if(Serial.available() > 0)
  {
    char incomingVal = Serial.read();
    Serial.print(incomingVal);
    if(incomingVal == 'a')
    {
      Serial.print("left");
      tamalib_set_button(BTN_LEFT, BTN_STATE_PRESSED);
    }
    if(incomingVal == 'b')
    {
      Serial.print("middle");
      tamalib_set_button(BTN_MIDDLE, BTN_STATE_PRESSED);
    }
    if(incomingVal == 'c')
    {
      Serial.print("right");
      tamalib_set_button(BTN_RIGHT, BTN_STATE_PRESSED);
    }
  }
  return 0; //TODO
}

static hal_t hal = {
  .malloc = &hal_malloc,
  .free = &hal_free,
  .halt = &hal_halt,
  .is_log_enabled = &hal_is_log_enabled,
  .log = &hal_log,
  .sleep_until = &hal_sleep_until,
  .get_timestamp = &hal_get_timestamp,
  .update_screen = &hal_update_screen,
  .set_lcd_matrix = &hal_set_lcd_matrix,
  .set_lcd_icon = &hal_set_lcd_icon,
  .set_frequency = &hal_set_frequency,
  .play_frequency = &hal_play_frequency,
  .handler = &hal_handler,
};

void setup() {
  Serial.begin(115200);

  //delay(2000);
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  initWebSocket();
  server.begin();

  // Print ESP Local IP Address
  Serial.println(WiFi.localIP());
  
  Serial.println("setup");
  tamalib_register_hal(&hal);
  tamalib_init(g_program, NULL, 1000000);
}

void loop() {
  ws.cleanupClients(); //TODO make it more efficient by running this only every second or so
  tamalib_frame();
}
