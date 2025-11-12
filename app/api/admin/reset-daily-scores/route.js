// app/api/admin/reset-daily-scores/route.js
import { resetDailyScores } from '@/lib/db';

export async function POST(request) {
  try {
    const resetCount = await resetDailyScores();
    
    return Response.json({ 
      success: true, 
      message: `Daily scores reset for ${resetCount} users` 
    });
    
  } catch (error) {
    console.error('Error resetting daily scores:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}