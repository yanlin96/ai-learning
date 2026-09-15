import "server-only";

import type { NextAuthOptions } from "next-auth";
import OktaProvider from "next-auth/providers/okta";

const clientId = process.env.AUTH_OKTA_ID?.trim() || process.env.OKTA_CLIENT_ID?.trim() || "";
const clientSecret = process.env.AUTH_OKTA_SECRET?.trim() || process.env.OKTA_CLIENT_SECRET?.trim() || "";
const issuer = process.env.AUTH_OKTA_ISSUER?.trim() || process.env.OKTA_ISSUER?.trim() || "";
const sessionSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "";

export const isOktaConfigured = Boolean(clientId && clientSecret && issuer && sessionSecret);

export const authOptions: NextAuthOptions = {
  providers: isOktaConfigured
    ? [OktaProvider({ clientId, clientSecret, issuer })]
    : [],
  session: { strategy: "jwt" },
  secret: sessionSecret || "missing-okta-configuration",
  pages: { signIn: "/login" },
};
