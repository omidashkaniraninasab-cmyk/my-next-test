import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    console.log('🔄 Resetting today score for user:', userId);
    
    await sql`
      UPDATE user_profiles 
      SET 
        today_crossword_score = 0,
        today_game_completed = FALSE,
        instant_crossword_score = 0
      WHERE id = ${userId}
    `;

    console.log('✅ Today score reset to 0');
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error resetting today score:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}