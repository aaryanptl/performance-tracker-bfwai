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
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-primary px-4 py-12">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_10%,white_0,transparent_28%),radial-gradient(circle_at_80%_90%,white_0,transparent_24%)]" />
      <div className="relative z-10 w-full">
        <SignInPanel initialError={error ? ERROR_MESSAGES[error] : null} />
      </div>
    </main>
  );
}
