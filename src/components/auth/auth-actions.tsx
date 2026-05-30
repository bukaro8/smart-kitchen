import { signIn, signOut } from "@/auth";

export function GoogleSignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="min-h-16 w-full rounded-2xl bg-stone-950 px-6 text-lg font-semibold text-white shadow-sm transition hover:bg-stone-800"
      >
        Entrar con Google
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="min-h-12 rounded-2xl border border-stone-200 bg-white/80 px-5 text-sm font-semibold text-stone-700 transition hover:bg-white hover:text-stone-950"
      >
        Salir
      </button>
    </form>
  );
}
