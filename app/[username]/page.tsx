export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {username}{"\u0027"}s Profile
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This is the public profile page for {username}.
        </p>
      </div>
    </div>
  );
}
