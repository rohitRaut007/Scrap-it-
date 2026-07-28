import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { PortalShell } from "@/components/layout/portal-shell";

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

  // getUser() re-verifies the session against the Supabase Auth server —
  // unlike getSession(), which just reads the (unverified) JWT from cookies.
  // This is the app's sole authorization gate, so it must use the verified call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = user.app_metadata?.role;
  if (role !== "collector") {
    redirect("/login?reason=unauthorized");
  }

  return <PortalShell userEmail={user.email}>{children}</PortalShell>;
}
