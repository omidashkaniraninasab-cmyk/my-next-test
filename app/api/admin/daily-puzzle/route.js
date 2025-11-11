import { neon } from '@neondatabase/serverless';
import { createDailyPuzzlesTable } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const puzzleData = await request.json();
    await createDailyPuzzlesTable();
    
    // ذخیره جدول در دیتابیس
    await sql`
      INSERT INTO daily_puzzles (date, puzzle_data, created_at)
      VALUES (${puzzleData.date}, ${JSON.stringify(puzzleData)}, NOW())
    `;

    return Response.json({ 
      success: true, 
      message: 'جدول با موفقیت ذخیره شد' 
    });

  } catch (error) {
    console.error('Error saving puzzle:', error);
    return Response.json({ 
      success: false, 
      error: 'خطا در ذخیره جدول' 
    }, { status: 500 });
  }
}