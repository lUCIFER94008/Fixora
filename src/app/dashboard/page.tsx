import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const role = (session.user as any).role || "owner";
  if (role === "admin") {
    redirect("/admin/dashboard");
  } else if (role === "workshop") {
    redirect("/workshop/dashboard");
  } else {
    redirect("/owner/dashboard");
  }
}
