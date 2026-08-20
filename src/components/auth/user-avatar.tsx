"use client";

import { useState } from "react";

const FALLBACK_AVATAR = "/images/dinosaur-avatar.svg";

type UserAvatarProps = {
  alt: string;
  src?: string | null;
};

export function UserAvatar({ alt, src }: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src && src !== failedSrc ? src : FALLBACK_AVATAR;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
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
