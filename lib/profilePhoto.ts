const PROFILE_PHOTO_COUNT = 40;

function normalizeSeed(value: string): string {
    return value.trim().toLowerCase();
}

function hashSeed(seed: string): number {
    // djb2 hash for stable, fast distribution across fixed profile photos.
    let hash = 5381;
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 33) ^ seed.charCodeAt(index);
    }
    return Math.abs(hash >>> 0);
}

export function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getProfilePhotoPath(name: string, seed?: string): string {
    const resolvedSeed = normalizeSeed(
        seed && seed.trim().length > 0 ? seed : name,
    );
    const hash = hashSeed(resolvedSeed);
    const index = (hash % PROFILE_PHOTO_COUNT) + 1;
    return `/profilePhoto/p${index}.png`;
}
