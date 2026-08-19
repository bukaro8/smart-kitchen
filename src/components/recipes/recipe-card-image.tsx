import Image from "next/image";

type RecipeCardImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  variant?: "card" | "compact";
};

function isLocalRecipeIllustration(src: string) {
  return src.startsWith("/images/meals/");
}

export function RecipeCardImage({
  src,
  alt,
  sizes,
  priority = false,
  variant = "card",
}: RecipeCardImageProps) {
  const isIllustration = isLocalRecipeIllustration(src);
  const isCompact = variant === "compact";

  return (
    <div
      className={`relative overflow-hidden ${
        isCompact
          ? "size-16 shrink-0 rounded-2xl sm:size-[4.5rem]"
          : "aspect-[4/3] w-full"
      } ${
        isIllustration ? "bg-[#f5efe6]" : "bg-stone-100"
      }`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={
          isIllustration
            ? `object-contain ${isCompact ? "p-2" : "p-4"}`
            : "object-cover"
        }
        priority={priority}
      />
    </div>
  );
}
