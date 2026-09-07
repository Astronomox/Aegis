// Single shared logout call. Every page that needs a logout button uses
// this instead of re-implementing the fetch call, so behavior never drifts
// between pages.
export async function performLogout(router: { push: (path: string) => void }) {
  await fetch('/api/auth/logout', { method: 'POST' });
  router.push('/login');
}
