import { signIn, signOut } from "@/auth";
import { buttonPrimary, buttonSecondary } from "@/lib/ui-styles";

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
        className={`${buttonPrimary} w-full text-lg`}
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
        className={`${buttonSecondary} min-h-12 px-5 text-sm`}
      >
        Salir
      </button>
    </form>
  );
}
