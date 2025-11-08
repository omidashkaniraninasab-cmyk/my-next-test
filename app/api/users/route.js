import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ایجاد کاربر جدید در جدول user_profiles
export async function POST(request) {
  try {
    const { username, email, password, firstName, lastName, bankCardNumber } = await request.json();
    
    // بررسی فیلدهای ضروری
    if (!username || !email || !password || !firstName || !lastName) {
      return Response.json({ 
        error: 'همه فیلدهای ضروری را پر کنید' 
      }, { status: 400 });
    }

    // ذخیره کاربر در جدول جدید
    const result = await sql`
      INSERT INTO user_profiles (
        username, email, password, first_name, last_name, bank_card_number
      ) 
      VALUES (
        ${username}, ${email}, ${password}, ${firstName}, ${lastName}, ${bankCardNumber}
      )
      RETURNING *
    `;

    return Response.json({ 
      success: true,
      user: result[0]
    }, { status: 201 });
    
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

// گرفتن کاربران از جدول جدید
export async function GET() {
  try {
    const users = await sql`
      SELECT * FROM user_profiles 
      ORDER BY registration_date DESC
    `;
    
    return Response.json(users);
    
  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
}