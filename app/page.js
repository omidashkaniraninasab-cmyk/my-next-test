// src/components/Hello.tsx

import UsersPage from "./users/page";


export default function Hello() {
  return (
    <div className="bg-blue-100 p-4 rounded-lg">
      <h1 className="text-2xl font-bold">سلام به Next.js!</h1>
      <p>پروژه شما با موفقیت راه اندازی شد</p>
      <UsersPage />
    </div>
  );
}