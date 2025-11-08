import { getUsers } from '@/lib/db';

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div style={{ padding: '20px' }}>
      <h1>لیست کاربران</h1>
      
      {users.length === 0 ? (
        <p>هنوز کاربری وجود ندارد. اولین کاربر را <a href="/add-user">اینجا</a> اضافه کن.</p>
      ) : (
        <div>
          <p>تعداد کاربران: {users.length}</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users.map(user => (
              <li key={user.id} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                margin: '10px 0',
                borderRadius: '5px'
              }}>
                <strong>👤 {user.name}</strong>
                <br />
                📧 {user.email}
                <br />
                <small>⏰ {new Date(user.created_at).toLocaleString('fa-IR')}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}