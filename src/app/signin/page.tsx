import { AuthShell } from "@/app/components/auth-shell";
import { SignInPanel } from "@/app/components/sign-in-panel";

const ERROR_MESSAGES: Record<string, string> = {
  account_not_linked: "Your login exists, but it is not linked to an active employee profile.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell>
      <SignInPanel initialError={error ? ERROR_MESSAGES[error] : null} />
    </AuthShell>
  );
}
