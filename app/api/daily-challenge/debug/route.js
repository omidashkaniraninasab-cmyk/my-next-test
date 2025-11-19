import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 شروع دیباگ سیستم چالش...');
    
    // بررسی وجود جداول
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'daily_challenge%'
    `;
    
    console.log('📊 جداول موجود:', tables);
    
    // بررسی سوالات
    const questions = await sql`
      SELECT * FROM daily_challenge_questions
    `;
    
    console.log('❓ سوالات موجود:', questions);
    
    // بررسی امتیازات
    const scores = await sql`
      SELECT * FROM daily_challenge_scores
    `;
    
    console.log('🎯 امتیازات موجود:', scores);
    
    return NextResponse.json({
      success: true,
      tables: tables.map(t => t.table_name),
      questionsCount: questions.length,
      questions: questions,
      scoresCount: scores.length
    });
    
  } catch (error) {
    console.error('❌ خطا در دیباگ:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}