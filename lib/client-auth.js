export async function getSessionFromCookie() {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}