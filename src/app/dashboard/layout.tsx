import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SessionProvider } from "@/components/admin/SessionProvider";
import PushNotificationsPrompt from "@/components/admin/PushNotificationsPrompt";
import { fontInter } from "@/config/fonts";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  const role = session.user?.role;
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/auth/login");

  const user = {
    name: session.user?.name ?? null,
    email: session.user?.email ?? null,
    role: role ?? null,
  };

  return (
    <SessionProvider session={session}>
      <div className={`${fontInter.className} flex min-h-screen bg-gray-50 text-gray-900`}>
        <AdminSidebar user={user} />
        {/* `overflow-x-clip` y no `overflow-hidden`: este ultimo convierte el
            elemento en contenedor de scroll y rompe el `position: sticky` de
            sus descendientes. */}
        <main className="min-h-screen min-w-0 flex-1 overflow-x-clip bg-gray-50 pt-14 lg:ml-64 lg:pt-0">
          <div className="mx-auto min-w-0 max-w-[96rem] px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
      <PushNotificationsPrompt />
    </SessionProvider>
  );
}
