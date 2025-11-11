import { neon } from '@neondatabase/serverless';
import { createDailyPuzzlesTable } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    // ایمپورت داینامیک فایل dailyPuzzleData
    const puzzleModule = await import('@/lib/dailyPuzzleData');
    const puzzleData = puzzleModule.dailyPuzzleData;

    console.log('📦 Publishing puzzle from file:', {
      title: puzzleData.title,
      date: puzzleData.date
    });

    // ایجاد جدول اگر وجود ندارد
    await createDailyPuzzlesTable();

    // تاریخ امروز
    const today = new Date().toISOString().split('T')[0];

    // ذخیره در دیتابیس
    await sql`
      INSERT INTO daily_puzzles (date, puzzle_data, created_at, is_active)
      VALUES (${today}, ${JSON.stringify(puzzleData)}, NOW(), true)
      ON CONFLICT (date) 
      DO UPDATE SET 
        puzzle_data = EXCLUDED.puzzle_data,
        created_at = NOW(),
        is_active = true
    `;

    console.log('✅ Puzzle published successfully for date:', today);

    return Response.json({ 
      success: true, 
      message: 'جدول با موفقیت منتشر شد',
      puzzle: {
        title: puzzleData.title,
        date: puzzleData.date
      }
    });

  } catch (error) {
    console.error('❌ Error publishing puzzle:', error);
    return Response.json({ 
      success: false, 
      error: 'خطا در انتشار جدول: ' + error.message
    }, { status: 500 });
  }
}