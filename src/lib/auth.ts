export async function logout() {
  try {
    // Call the logout API endpoint
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    // Clear any local storage data
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Error during logout:', error);
    // Still redirect to login page even if there's an error
    window.location.href = '/login';
  }
} 