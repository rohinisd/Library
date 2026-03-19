import { requireSession } from "@/lib/auth";
import DashboardNav from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav
        username={session.displayName || session.username}
      />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
