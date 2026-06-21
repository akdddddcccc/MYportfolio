#include "FastLED.h"                       // 此示例程序需要使用FastLED库
#define NUM_LEDS 60                        // LED灯珠数量
#define LED_DT 5                           // Arduino输出控制信号引脚
#define LED_TYPE WS2812                    // LED灯带型号
#define COLOR_ORDER GRB                    // RGB灯珠中红色、绿色、蓝色LED的排列顺序
#include <SoftwareSerial.h>
float t1;
float t2 = 0;
int read5;                              //敲击端口为7
const int t3 = 300;
int yaliReading;
int yaliPin = 2;                           //压力开关
int qingxiePin = A5;

int qingxieval   ;                          //倾斜
int attachPin = 3;                         //触摸
int num = 0;
//int qiaojipin = 9;
// LED on arduino
int huoerdigitalPin = 6;                   // linear Hall magnetic sensor digital interface
// linear Hall magnetic sensor analog interface    霍尔传感器
bool huoerdigitalVal;                      // digital readings
//int huoeranalogVal;                        // analog readings
int qingxie;
//int x = 1;        //触摸传感器的int
int y = 1;
int mixflag = 0;

char B;
char C;
char D;
char E;
char F;
char G;
char H;
//char state ;
char mystate;
char hisstate;

char col;

//定义七种颜色状态

//int A[4][3]={{255,250,250},{255,69,0},{255,140,0},{135,206,255}};

volatile bool sta = false;     // 触摸状态
void use() {
  sta = true;
}

SoftwareSerial BT(10, 11);                 //Pin10为RX，接HC05的TX针脚  //Pin11为TX，接HC05的RX针脚
char val;
char mix;

uint8_t max_bright = 128;                  // LED亮度控制变量，可使用数值为 0 ～ 255， 数值越大则光带亮度越高
CRGB leds[NUM_LEDS];                          // 建立光带leds

void setup() {

  //pinMode(qiaojipin, INPUT);
  pinMode(9, INPUT);

  pinMode(7, INPUT);
  pinMode(yaliPin, INPUT);                                       //压力
  pinMode (huoerdigitalPin, INPUT);                              //霍尔
  pinMode(attachPin, INPUT);                                     //触摸
  attachInterrupt(1, use, RISING);

  LEDS.addLeds<LED_TYPE, LED_DT, COLOR_ORDER>(leds, NUM_LEDS);       // 初始化光带
  FastLED.setBrightness(max_bright);                                 // 设置光带亮度
  Serial.begin(38400);                                               //蓝牙
  Serial.println("Bluetooth is ready!");
  BT.begin(38400);
  co(y);// HC-05默认，38400

}
void co(int x) {

  if (x == 1) {

    fill_solid(leds, 60, CRGB::Black);
    FastLED.show();
    mystate = 'A';
    delay(50);
  }              // 更新LED色彩
else if (x == 2) {
  fill_solid(leds, 60, CRGB (238, 99, 99));
  FastLED.show();
  mystate = 'B';
  delay(50);
}
else if (x == 3) {
  fill_solid(leds, 60, CRGB (139, 101, 8)) ;
  FastLED.show();
  mystate = 'C';
  delay(50);
}
else if (x == 4) {
  fill_solid(leds, 60,  CRGB (135, 206, 255));
  FastLED.show();
  mystate = 'D';
  delay(50);
}
else if (x == 5) {
  fill_solid(leds, 60, CRGB (0, 255, 127)) ;
  FastLED.show();
  mystate = 'E';
  delay(50);
}
else if (x == 6) {
  fill_solid(leds, 60, CRGB (147, 112, 219)) ;
  FastLED.show();
  mystate = 'F';
  delay(50);
}
else if (x == 7) {
  fill_solid(leds, 60, CRGB (255, 255, 255)) ;
  FastLED.show();
  mystate = 'G';
  delay(50);
}
else if (x == 8) {
  fill_solid(leds, 60, CRGB (255, 69, 0)) ;
  FastLED.show();
  mystate = 'H';
  delay(50);
}
}
void color()
{ int c;
  if (mystate == 'B') {
    c = 2;
    co(c);
    delay(50);
  }
else if (mystate == 'C') {
  c = 3;
  co(c);
  delay(50);
}
else if (mystate == 'D') {
  c = 4;
  co(c);
  delay(50);
}
else if (mystate == 'E') {
  c = 5;
  co(c);
  delay(50);
}
else if (mystate == 'F') {
  c = 6;
  co(c);
  delay(50);
}
else if (mystate == 'G') {
  c = 7;
  co(c);
  delay(50);
}
else if (mystate == 'H') {
  c = 8;
  co(c);
  delay(50);
}

/* else if (mystate == 'A') {
fill_solid(leds, 60, CRGB::Black);
FastLED.show();
y = 9;
}*/

}
void mixcolor()
{ if ((hisstate == 'C') && (mystate == 'B'))
  { fill_solid(leds, 30, CRGB (139, 101, 8) );
    FastLED.show();

    fill_solid(leds + 30, 30, CRGB (238, 99, 99) );
    FastLED.show();
    mix = 'H';
    delay(50);
  }
else if (((hisstate == 'B') && (mystate == 'C')))
{ fill_solid(leds , 30, CRGB (238, 99, 99) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (139, 101, 8) );
  FastLED.show();
  mix = 'H';
  delay(50);
}

else if ((hisstate == 'D') && (mystate == 'C'))
{ fill_solid(leds, 30, CRGB (135, 206, 255) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (139, 101, 8) );
  FastLED.show();
  mix = 'E';
  delay(50);
}
else if  ((hisstate == 'C') && (mystate == 'D'))
{ fill_solid(leds , 30, CRGB (139, 101, 8) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (135, 206, 255) );
  FastLED.show();
  mix = 'E';
  delay(50);
}

else if ((hisstate == 'D') && (mystate == 'B'))
{ fill_solid(leds, 30, CRGB (135, 206, 255) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (238, 99, 99) );
  FastLED.show();
  mix = 'E';
  delay(50);
}
else if ((hisstate == 'B') && (mystate == 'D'))
{ fill_solid(leds , 30, CRGB (238, 99, 99) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (135, 206, 255) );
  FastLED.show();
  mix = 'E';
  delay(50);
}

else if ((hisstate == 'B') && (mystate == 'E'))
{ fill_solid(leds, 30, CRGB (238, 99, 99));
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (0, 255, 127) );
  FastLED.show();
  mix = 'F';
  delay(50);
}
else if ((hisstate == 'E') && (mystate == 'B'))
{ fill_solid(leds, 30, CRGB (0, 255, 127));
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (238, 99, 99) );
  FastLED.show();
  mix = 'F';
  delay(50);
}

else if ((hisstate == 'B') && (mystate == 'F'))
{ fill_solid(leds, 30, CRGB (238, 99, 99) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (147, 112, 219) );
  FastLED.show();
  mix = 'G';
  delay(50);
}
else if ((hisstate == 'F') && (mystate == 'B'))
{ fill_solid(leds, 30, CRGB (147, 112, 219));
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (238, 99, 99));
  FastLED.show();
  mix = 'G';
  delay(50);
}

else if ((hisstate == 'B') && (mystate == 'H'))
{ fill_solid(leds, 30, CRGB (238, 99, 99) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (255, 69, 0) );
  FastLED.show();
  mix = 'F';
  delay(50);
}
else if ((hisstate == 'H') && (mystate == 'B'))
{ fill_solid(leds, 30, CRGB  (255, 69, 0) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB(238, 99, 99) );
  FastLED.show();
  mix = 'F';
  delay(50);
}

else if  ((hisstate == 'E') && (mystate == 'C'))
{ fill_solid(leds, 30, CRGB (0, 255, 127) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (139, 101, 8) );
  FastLED.show();
  mix = 'F';
  delay(50);
}
else if ((hisstate == 'C') && (mystate == 'E'))
{ fill_solid(leds, 30, CRGB (139, 101, 8) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (0, 255, 127) );
  FastLED.show();
  mix = 'F';
  delay(50);
}

else if ((hisstate == 'C') && (mystate == 'F'))
{ fill_solid(leds, 30, CRGB (139, 101, 8) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (147, 112, 219));
  FastLED.show();
  mix = 'G';
  delay(50);
}
else if ((hisstate == 'F') && (mystate == 'C'))
{ fill_solid(leds, 30, CRGB (147, 112, 219) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (139, 101, 8));
  FastLED.show();
  mix = 'G';
  delay(50);
}

else if ((hisstate == 'C') && (mystate == 'H'))
{ fill_solid(leds, 30, CRGB (139, 101, 8) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (255, 69, 0) );
  FastLED.show();
  mix = 'F';
  delay(50);
}

else if  ((hisstate == 'H') && (mystate == 'C'))
{ fill_solid(leds, 30, CRGB (255, 69, 0) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (139, 101, 8) );
  FastLED.show();
  mix = 'F';
  delay(50);
}

else if ((hisstate == 'D') && (mystate == 'E'))
{ fill_solid(leds, 30, CRGB (135, 206, 255) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB(0, 255, 127) );
  FastLED.show();
  mix = 'F';
  delay(50);
}
else if ((hisstate == 'E') && (mystate == 'D'))
{ fill_solid(leds, 30, CRGB (0, 255, 127) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB(135, 206, 255) );
  FastLED.show();
  mix = 'F';
  delay(50);
}

else if ((hisstate == 'F') && (mystate == 'D'))
{ fill_solid(leds, 30, CRGB (147, 112, 219) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB(135, 206, 255) );
  FastLED.show();
  mix = 'G';
  delay(50);
}
else if ((hisstate == 'D') && (mystate == 'F'))
{ fill_solid(leds, 30, CRGB (135, 206, 255) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB(147, 112, 219) );
  FastLED.show();
  mix = 'G';
  delay(50);
}

else if ((hisstate == 'F') && (mystate == 'E'))
{ fill_solid(leds, 30, CRGB (147, 112, 219) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (0, 255, 127) );
  FastLED.show();
  mix = 'G';
  delay(50);
}
else if  ((hisstate == 'E') && (mystate == 'F'))
{ fill_solid(leds, 30, CRGB (0, 255, 127) );
  FastLED.show();

  fill_solid(leds + 30, 30, CRGB (147, 112, 219) );
  FastLED.show();
  mix = 'G';
  delay(50);
}
delay(5000);
/*read9 = digitalRead(9);
if (read9 != 1)*/
mystate = mix;
color();
mixflag = 1;
}

void loop() {
  t1 = millis() - t2;
  if (t1 >= t3)
  {
    t2 = t2 + t3;
    //触摸
    sta = digitalRead(3);
    if (sta != 0) { //触摸信号在哪里读取？
      sta = 0;
      y++;
      if (y > 4) {
        y = 1; //点四次以后再变暗无法实现，第四次短暂变暗再次变为桃色

      }
    co(y);
    delay(100);

  }

//压力
yaliReading = digitalRead(yaliPin);
Serial.print("yali:");
Serial.println(yaliReading);

//霍尔
huoerdigitalVal = digitalRead(huoerdigitalPin) ;
//倾斜
{ qingxie = analogRead(qingxiePin);
  Serial.print("qingxie:");
  Serial.println(qingxie);
  delay(1000);
}

if (y != 1 )
{
  if ( (huoerdigitalVal != 1 ) )         // 同化中上面的   下传上(接收）同化中上面的酒
  {

    if (BT.available())
    {
      hisstate = BT.read();
      Serial.print("同化上");
      Serial.println( hisstate);
    }
  mystate = hisstate;
  color();
}
else {
  if ((yaliReading == HIGH))
  {
    if (qingxie > 600)
    {
      if (mixflag == 0)
      {
        if (BT.available())
        { hisstate = BT.read(); //上面的瓶子
          Serial.print("混色上");
          Serial.println(mystate);
          mixcolor();
        }
    }
}
else
{
  BT.write(mystate);
  Serial.print("下");
  Serial.println(mystate);
  //下面的瓶子
}
}
else {
  mixflag = 0;
}

read5 = digitalRead(7);
Serial.println(read5);
if ( read5 != 1)
{ y = 1;
  co(y);
}
}
}
}
}
