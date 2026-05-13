import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
        </p>

        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Email
            </p>
            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {user.email}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              User ID
            </p>
            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {user.id}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Created at
            </p>
            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <form action="/auth/signout" method="POST" className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
