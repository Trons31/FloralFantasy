import { cookies } from "next/headers";
import OperacionesClient from "@/components/operations/OperacionesClient";
import { OPERATIONS_SESSION_COOKIE, getOperationsUserFromCookieValue } from "@/lib/route-auth";

export default async function OperacionesPage() {
  const sessionCookie = cookies().get(OPERATIONS_SESSION_COOKIE)?.value;
  const initialUser = await getOperationsUserFromCookieValue(sessionCookie);

  return <OperacionesClient initialUser={initialUser} />;
}
