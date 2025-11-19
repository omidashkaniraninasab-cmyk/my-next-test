import { NextResponse } from 'next/server';

// دیتابیس موقت برای چالش روزانه (کاملاً مستقل)
const dailyChallengeDB = {
  // سوالات چالش
  questions: [
    {
      id: 1,
      text: "با حرف 'ب' اسم دخترانه بسازید",
      letter: "ب",
      category: "اسم دخترانه",
      validAnswers: ["بیتا", "بهار", "باران", "بهناز", "بدری", "پریسا", "پگاه", "بنفشه", "بهشت", "بیدا"]
    },
    {
      id: 2, 
      text: "با حرف 'آ' اسم پسرانه بسازید",
      letter: "آ", 
      category: "اسم پسرانه",
      validAnswers: ["آرش", "آرمان", "آرین", "آبتین", "آذر", "آراد", "آرمین"]
    },
    {
      id: 3,
      text: "با حرف 'م' میوه نام ببرید",
      letter: "م",
      category: "میوه", 
      validAnswers: ["موز", "مشمش", "ملون", "مانگو", "میوه"]
    }
  ],
  
  // کاربران چالش (کاملاً مستقل)
  challengeUsers: new Map(),
  
  // پاسخ‌های چالش
  challengeAnswers: new Map(),
  
  // امتیازات چالش
  challengeScores: new Map()
};

// پاک کردن داده‌های قدیمی
function cleanupOldData() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  // پاک کردن پاسخ‌های قدیمی
  dailyChallengeDB.challengeAnswers.forEach((value, key) => {
    if (value.timestamp < oneDayAgo) {
      dailyChallengeDB.challengeAnswers.delete(key);
    }
  });
}

export async function GET() {
  try {
    cleanupOldData();
    
    // گرفتن سوال روز برای چالش
    const today = new Date().getDate();
    const questionIndex = today % dailyChallengeDB.questions.length;
    const dailyQuestion = dailyChallengeDB.questions[questionIndex];
    
    return NextResponse.json({
      success: true,
      question: dailyQuestion,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطا در دریافت سوال' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, answer, questionId } = await request.json();
    
    // اعتبارسنجی داده‌های ورودی
    if (!userId || !answer || !questionId) {
      return NextResponse.json({ success: false, error: 'داده‌های ناقص' }, { status: 400 });
    }
    
    // پیدا کردن سوال چالش
    const question = dailyChallengeDB.questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({ success: false, error: 'سوال چالش پیدا نشد' }, { status: 404 });
    }
    
    // اعتبارسنجی پاسخ در چالش
    const isValid = question.validAnswers.includes(answer.trim());
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'پاسخ معتبر نیست' }, { status: 400 });
    }
    
    // ثبت کاربر در سیستم چالش (اگر وجود ندارد)
    if (!dailyChallengeDB.challengeUsers.has(userId)) {
      dailyChallengeDB.challengeUsers.set(userId, {
        userId,
        totalScore: 0,
        todayScore: 0,
        gamesPlayed: 0,
        createdAt: new Date()
      });
    }
    
    // ذخیره پاسخ کاربر در چالش
    const answerKey = `${userId}-${questionId}-${Date.now()}`;
    dailyChallengeDB.challengeAnswers.set(answerKey, {
      userId,
      questionId,
      answer: answer.trim(),
      timestamp: new Date()
    });
    
    // محاسبه آمار پاسخ‌ها در چالش
    const stats = {};
    dailyChallengeDB.challengeAnswers.forEach((value) => {
      if (value.questionId === questionId) {
        stats[value.answer] = (stats[value.answer] || 0) + 1;
      }
    });
    
    // محاسبه امتیاز در چالش
    const userCount = stats[answer.trim()] || 1;
    let score = 100;
    if (userCount === 1) score = 1000;
    else if (userCount <= 10) score = 750;
    else if (userCount <= 100) score = 500;
    else if (userCount <= 1000) score = 250;
    
    // آپدیت امتیاز کاربر در سیستم چالش
    const userData = dailyChallengeDB.challengeUsers.get(userId);
    userData.totalScore += score;
    userData.todayScore += score;
    userData.gamesPlayed += 1;
    
    // ذخیره امتیاز این بازی در چالش
    dailyChallengeDB.challengeScores.set(answerKey, score);
    
    return NextResponse.json({
      success: true,
      score,
      userCount,
      totalScore: userData.totalScore,
      todayScore: userData.todayScore,
      gamesPlayed: userData.gamesPlayed,
      message: 'پاسخ در چالش ثبت شد'
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}