import { dailyPuzzleData } from '@/lib/dailyPuzzleData';

export async function GET() {
  try {
    console.log('📦 Serving daily puzzle from lib/dailyPuzzleData.js');
    
    // همیشه فایل dailyPuzzleData.js رو برگردون
    return Response.json(dailyPuzzleData);
    
  } catch (error) {
    console.error('❌ Error serving daily puzzle:', error);
    return Response.json({ error: 'Failed to load puzzle' }, { status: 500 });
  }
}