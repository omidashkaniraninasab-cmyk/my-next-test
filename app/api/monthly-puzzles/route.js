import { neon } from '@neondatabase/serverless';
import { createMonthlyPuzzlesTable } from '@/lib/db';

const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
  try {
    await createMonthlyPuzzlesTable();
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const puzzle = await sql`
      SELECT * FROM monthly_puzzles 
      WHERE date = ${targetDate} AND is_active = true
      LIMIT 1
    `;
    
    if (puzzle.length > 0) {
      return Response.json(puzzle[0]);
    } else {
      return Response.json({ 
        error: 'No puzzle found for this date',
        date: targetDate 
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Monthly puzzles error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await createMonthlyPuzzlesTable();
    
    const { date, puzzle_data } = await request.json();
    
    if (!date || !puzzle_data) {
      return Response.json({ error: 'Date and puzzle_data are required' }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO monthly_puzzles (date, puzzle_data, is_active)
      VALUES (${date}, ${JSON.stringify(puzzle_data)}, true)
      ON CONFLICT (date) 
      DO UPDATE SET puzzle_data = EXCLUDED.puzzle_data
      RETURNING *
    `;
    
    console.log('✅ Monthly puzzle saved:', result[0].date);
    return Response.json(result[0]);
    
  } catch (error) {
    console.error('Monthly puzzles POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 🆕 اضافه کردن PUT برای آپدیت پازل
export async function PUT(request) {
  try {
    const { date, is_active } = await request.json();
    
    if (!date) {
      return Response.json({ error: 'Date is required' }, { status: 400 });
    }
    
    const result = await sql`
      UPDATE monthly_puzzles 
      SET is_active = ${is_active}
      WHERE date = ${date}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return Response.json({ error: 'Puzzle not found' }, { status: 404 });
    }
    
    console.log('✅ Monthly puzzle updated:', result[0].date);
    return Response.json(result[0]);
    
  } catch (error) {
    console.error('Monthly puzzles PUT error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}