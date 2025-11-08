#include "tamalib.h"
#include "rom.h"

// screen
static bool pixelsChanged = false;
static bool_t matrix_buffer[LCD_HEIGHT][LCD_WIDTH] = {{0}};
static bool_t icon_buffer[ICON_NUM] = {0};

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
  delayMicroseconds(ts - hal_get_timestamp()); //TODO test
  //while((int) (ts - hal_get_timestamp()) > 0);
}

static void hal_update_screen(void)
{
  // TODO: tell the system to redraw screen
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
  return 0;
  //Not implemented as we're not using the tamalib_mainloop()
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
  tamalib_register_hal(&hal);
  tamalib_init(g_program, NULL, 1000000);
}

void loop() {
  // put your main code here, to run repeatedly:
  tamalib_mainloop();
}
