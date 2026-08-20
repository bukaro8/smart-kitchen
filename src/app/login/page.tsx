import { redirect } from "next/navigation";
import Image from "next/image";

import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/auth/auth-actions";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import { contentCard } from "@/lib/ui-styles";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  const locale = await getLocale();
  const messages = getMessages(locale).login;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fff8ef] px-5 py-8 text-stone-950">
      <section className={`w-full max-w-md ${contentCard} shadow-sm`}>
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
            {messages.title}
          </h1>
          <p className="mt-3 text-balance text-lg leading-7 text-stone-700">
            {messages.description}
          </p>
        </div>

        <GoogleSignInButton locale={locale} />
      </section>
    </main>
  );
}
