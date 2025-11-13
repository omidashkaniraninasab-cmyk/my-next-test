// app/api/admin/create-daily-puzzle/route.js
import { neon } from '@neondatabase/serverless';
import { dailyPuzzleData } from '@/lib/dailyPuzzleData';

const neonSql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // ایجاد پازل امروز - بدون updated_at
    const result = await neonSql`
      INSERT INTO daily_puzzles (date, puzzle_data, is_active)
      VALUES (${today}, ${JSON.stringify(dailyPuzzleData)}, true)
      ON CONFLICT (date) DO UPDATE SET
        puzzle_data = EXCLUDED.puzzle_data,
        is_active = EXCLUDED.is_active
      RETURNING *
    `;
    
    return Response.json({ 
      success: true, 
      message: 'Daily puzzle created/updated',
      puzzle: result[0]
    });
    
  } catch (error) {
    console.error('Error creating daily puzzle:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}