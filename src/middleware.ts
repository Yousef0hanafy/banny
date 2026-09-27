/**
 * Release A middleware — first layer of the three-layer admin guard (docs/DECISIONS.md D-12).
 * Cheap session-cookie check + redirect; role verification happens again in the admin
 * layout (server) and in every Server Action / query helper.
 */
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    return undefined;
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
