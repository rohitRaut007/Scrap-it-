import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { PortalShell } from "@/components/layout/portal-shell";
import { getRoleFromJwt } from "@/lib/auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only in server components; session refresh handled by middleware.
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const role = getRoleFromJwt(session.access_token);
  if (role !== "collector") {
    redirect("/login?reason=unauthorized");
  }

  return <PortalShell userEmail={session.user.email}>{children}</PortalShell>;
}
