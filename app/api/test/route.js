import { createUserProfileTable } from '@/lib/db';

export async function GET() {
  try {
    await createUserProfileTable();
    return Response.json({ message: '✅ جدول پروفایل کاربر ایجاد شد' });
  } catch (error) {
    return Response.json({ error: error.message });
  }
}