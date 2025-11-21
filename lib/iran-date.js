// تابع gregorianToJalali
function gregorianToJalali(gy, gm, gd) {
  var g_d_m, jy, jm, jd, gy2, days;
  g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gy2 = (gm > 2) ? (gy + 1) : gy;
  days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  jy = -1595 + (33 * ~~(days / 12053));
  days %= 12053;
  jy += 4 * ~~(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += ~~((days - 1) / 365);
    days = (days - 1) % 365;
  }
  if (days < 186) {
    jm = 1 + ~~(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + ~~((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

// تابع گرفتن تاریخ امروز ایران
export const getTodayIranDate = () => {
  const now = new Date();
  const tehranTime = now.toLocaleString("en-US", {timeZone: "Asia/Tehran"});
  const date = new Date(tehranTime);
  
  // تبدیل به شمسی
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  const array = gregorianToJalali(gregorianYear, gregorianMonth, gregorianDay);
  const jalaliYear = array[0];
  const jalaliMonth = String(array[1]).padStart(2, '0');
  const jalaliDay = String(array[2]).padStart(2, '0');
  
  return `${jalaliYear}-${jalaliMonth}-${jalaliDay}`;
};

// تابع برای گرفتن تاریخ دیروز ایران (برای cron)
export const getYesterdayIranDate = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1); // دیروز
  const tehranTime = now.toLocaleString("en-US", {timeZone: "Asia/Tehran"});
  const date = new Date(tehranTime);
  
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  const array = gregorianToJalali(gregorianYear, gregorianMonth, gregorianDay);
  const jalaliYear = array[0];
  const jalaliMonth = String(array[1]).padStart(2, '0');
  const jalaliDay = String(array[2]).padStart(2, '0');
  
  return `${jalaliYear}-${jalaliMonth}-${jalaliDay}`;
};

// تابع برای گرفتن تاریخ فردا ایران
export const getTomorrowIranDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // فردا
  const tehranTime = tomorrow.toLocaleString("en-US", {timeZone: "Asia/Tehran"});
  const date = new Date(tehranTime);
  
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();
  
  const array = gregorianToJalali(gregorianYear, gregorianMonth, gregorianDay);
  const jalaliYear = array[0];
  const jalaliMonth = String(array[1]).padStart(2, '0');
  const jalaliDay = String(array[2]).padStart(2, '0');
  
  return `${jalaliYear}-${jalaliMonth}-${jalaliDay}`;
};