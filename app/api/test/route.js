import { createUsersTable } from '@/lib/db';

export async function GET() {
  try {
    await createUsersTable();
    return Response.json({ message: 'جدول کاربران ایجاد شد! ✅' });
  } catch (error) {
    return Response.json({ error: 'خطا: ' + error.message });
  }
}