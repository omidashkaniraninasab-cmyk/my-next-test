import { PuzzleGenerator } from './puzzleGenerator';

export class DailyPuzzle {
  // تولید جدول روزانه بر اساس تاریخ
  static getDailyPuzzle() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // سایز جدول رو می‌تونی اینجا تنظیم کنی
    // مثلاً: روزهای زوج 5x5، روزهای فرد 6x6
    const dayOfMonth = today.getDate();
    const size = dayOfMonth % 2 === 0 ? 5 : 6; // یا هر سایز ثابتی که می‌خواهی
    
    // ایجاد جدول روزانه
    const puzzle = PuzzleGenerator.generatePuzzle(size, `جدول روزانه ${this.getPersianDate()}`);
    
    return {
      ...puzzle,
      date: dateString,
      isDaily: true
    };
  }

  // تاریخ شمسی برای عنوان
  static getPersianDate() {
    const today = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      calendar: 'persian'
    };
    
    try {
      return today.toLocaleDateString('fa-IR', options);
    } catch (error) {
      // Fallback اگر پشتیبانی نکرد
      return today.toLocaleDateString('fa-IR');
    }
  }

  // بررسی اینکه آیا جدول امروز موجوده
  static shouldGenerateNewPuzzle(lastPuzzleDate) {
    if (!lastPuzzleDate) return true;
    
    const today = new Date().toISOString().split('T')[0];
    return lastPuzzleDate !== today;
  }
}