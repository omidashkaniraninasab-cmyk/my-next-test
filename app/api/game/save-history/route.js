import { neon } from '@neondatabase/serverless';
import { saveGameToHistory } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId, gameId, puzzleData, mistakes } = await request.json();
    
    if (!userId || !gameId) {
      return Response.json({ error: 'User ID and Game ID required' }, { status: 400 });
    }

    // 🎯 امتیاز رو از today_crossword_score کاربر بگیر
    const user = await sql`
      SELECT today_crossword_score 
      FROM user_profiles 
      WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const score = user[0].today_crossword_score;
    const completionTime = null;

    await saveGameToHistory(userId, gameId, puzzleData, score, mistakes, completionTime);

    return Response.json({ 
      success: true,
      message: 'بازی در تاریخچه ذخیره شد',
      score: score // امتیاز ذخیره شده
    });
    
  } catch (error) {
    console.error('Save history error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}