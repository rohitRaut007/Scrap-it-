/** Extract the role from a Supabase JWT without a server round-trip. */
export function getRoleFromJwt(accessToken: string): string | undefined {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    return (payload.app_metadata?.role as string | undefined) ?? (payload.role as string | undefined);
  } catch {
    return undefined;
  }
}
