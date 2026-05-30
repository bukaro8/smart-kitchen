import { redirect } from "next/navigation";
import Image from "next/image";

import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/auth-actions";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fff8ef] px-5 py-8 text-stone-950">
      <section className="w-full max-w-md rounded-[2rem] bg-white/80 p-5 shadow-sm ring-1 ring-orange-100 sm:p-7">
        <div className="mb-5 text-center">
          <Image
            src="/images/logo.svg"
            alt="MesaMate"
            width={172}
            height={172}
            className="mx-auto size-36 sm:size-[172px]"
            priority
          />
          <p className="mt-2 text-4xl font-bold tracking-normal">
            <span className="text-sky-700">Mesa</span>
            <span className="text-orange-500">Mate</span>
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            ¿Qué cocinamos hoy?
          </h1>
          <p className="mt-3 text-balance text-lg leading-7 text-stone-700">
            Entra para ver tus comidas, despensa e historial separados de otros
            usuarios.
          </p>
        </div>

        <GoogleSignInButton />
      </section>
    </main>
  );
}
