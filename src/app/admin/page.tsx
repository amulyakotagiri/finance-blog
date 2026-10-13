import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Admin Panel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
