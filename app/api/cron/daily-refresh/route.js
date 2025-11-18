import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // غیرفعال کردن پازل دیروز
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await sql`
      UPDATE monthly_puzzles 
      SET is_active = false 
      WHERE date = ${yesterdayStr}
    `;
    
    // فعال کردن پازل امروز
    await sql`
      UPDATE monthly_puzzles 
      SET is_active = true 
      WHERE date = ${today}
    `;
    
    console.log(`✅ Daily refresh: Activated ${today}, Deactivated ${yesterdayStr}`);
    
    return Response.json({
      success: true,
      activated: today,
      deactivated: yesterdayStr
    });
    
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}