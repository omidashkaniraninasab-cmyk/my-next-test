import { createUser } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, email } = await request.json();
    
    // کاربر را در دیتابیس ذخیره می‌کنیم
    const newUser = await createUser(name, email);
    
    return Response.json({ 
      success: true, 
      user: newUser,
      message: 'کاربر ذخیره شد' 
    });
    
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}