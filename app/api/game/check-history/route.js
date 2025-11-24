// app/api/game/check-history/route.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🔍 CHECK-HISTORY - User:', userId);
    
    // کل تاریخچه رو ببینیم
    const allHistory = await sql`
      SELECT id, score, created_at, puzzle_title 
      FROM game_history 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log('🔍 CHECK-HISTORY - All records:', allHistory);
    
    return Response.json({
      success: true,
      history: allHistory,
      count: allHistory.length
    });
    
  } catch (error) {
    console.error('❌ CHECK-HISTORY Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}