import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SessionProvider } from "@/components/admin/SessionProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <AdminSidebar />
        <main className="flex-1 w-full lg:ml-64 min-h-screen pt-14 lg:pt-0 overflow-x-hidden">{children}</main>
      </div>
    </SessionProvider>
  );
}