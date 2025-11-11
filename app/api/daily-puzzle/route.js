import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const puzzles = await sql`
      SELECT puzzle_data FROM daily_puzzles 
      WHERE date = ${date} AND is_active = TRUE
    `;

    if (puzzles.length > 0) {
      return Response.json(puzzles[0].puzzle_data);
    } else {
      return Response.json({ 
        error: 'جدول امروز یافت نشد' 
      }, { status: 404 });
    }

  } catch (error) {
    return Response.json({ 
      error: 'خطا در دریافت جدول' 
    }, { status: 500 });
  }
}