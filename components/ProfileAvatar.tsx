"use client";

import {useMemo, useState} from "react";
import {cn} from "@/lib/utils";
import {getInitials, getProfilePhotoPath} from "@/lib/profilePhoto";

type ProfileAvatarProps = {
    name: string;
    seed?: string;
    className?: string;
    initialsClassName?: string;
    alt?: string;
};

export default function ProfileAvatar({
    name,
    seed,
    className,
    initialsClassName,
    alt,
}: ProfileAvatarProps) {
    const [hasImageError, setHasImageError] = useState(false);
    const src = useMemo(() => getProfilePhotoPath(name, seed), [name, seed]);

    if (hasImageError) {
        return (
            <span
                className={cn(
                    "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 font-semibold text-white",
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
        <img
            src={src}
            alt={alt ?? `${name} profile photo`}
            loading="lazy"
            onError={() => setHasImageError(true)}
            className={cn("shrink-0 rounded-full object-cover", className)}
        />
    );
}
