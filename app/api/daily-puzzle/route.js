import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    console.log('🔍 Fetching puzzle for date:', date);
    
    const puzzles = await sql`
      SELECT puzzle_data FROM daily_puzzles 
      WHERE date = ${date} AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (puzzles.length > 0) {
      console.log('✅ Puzzle found in database');
      return Response.json(puzzles[0].puzzle_data);
    } else {
      console.log('❌ No puzzle found for date:', date);
      return Response.json({ 
        error: 'جدول برای تاریخ مورد نظر یافت نشد' 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('💥 Error fetching puzzle:', error);
    return Response.json({ 
      error: 'خطا در دریافت جدول' 
    }, { status: 500 });
  }
}