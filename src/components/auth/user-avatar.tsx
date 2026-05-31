"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_AVATAR = "/images/dinosaur-avatar.svg";

type UserAvatarProps = {
  src?: string | null;
};

export function UserAvatar({ src }: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src && src !== failedSrc ? src : FALLBACK_AVATAR;

  return (
    <Image
      src={imageSrc}
      alt="Foto de perfil"
      width={44}
      height={44}
      className="size-11 rounded-full object-cover ring-2 ring-white"
      onError={() => {
        if (src) {
          setFailedSrc(src);
        }
      }}
    />
  );
}
