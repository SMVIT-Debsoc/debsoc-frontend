"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials, getProfilePhotoPath } from "@/lib/profilePhoto";

type ProfileAvatarProps = {
  name: string;
  seed?: string;
  className?: string;
  initialsClassName?: string;
  alt?: string;
  sizes?: string;
};

export default function ProfileAvatar({
  name,
  seed,
  className,
  initialsClassName,
  alt,
  sizes = "48px",
}: ProfileAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const src = useMemo(() => getProfilePhotoPath(name, seed), [name, seed]);

  if (hasImageError) {
    return (
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 font-semibold text-white",
          className,
          initialsClassName,
        )}
        aria-hidden
      >
        {getInitials(name)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt ?? `${name} profile photo`}
        fill
        sizes={sizes}
        loading="lazy"
        decoding="async"
        className="object-cover"
        onError={() => setHasImageError(true)}
      />
    </span>
  );
}