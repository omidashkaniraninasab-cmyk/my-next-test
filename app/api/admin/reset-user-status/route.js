// app/api/admin/reset-user-status/route.js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 });
    }

    await sql`
      UPDATE user_profiles 
      SET 
        today_game_completed = FALSE
      WHERE id = ${userId}
    `;

    console.log(`✅ User ${userId} game status reset to FALSE`);
    
    return Response.json({ 
      success: true,
      message: `User ${userId} game status reset successfully`
    });
    
  } catch (error) {
    console.error('Error resetting user status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}