// Normalizes text across scripts (Hebrew, Arabic, Latin, ...) for comparison.
export function normalizeText(str: string): string {
    return str
        .normalize("NFKC")
        .replace(/־/g, "") // Hebrew maqaf
        .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics (tashkeel)
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// Apple Music appends "- Single"/"- EP" to collection names; Spotify albums never carry that
// suffix, and leaving it in the search query knocks the real match out of the results entirely.
export function stripReleaseTypeSuffix(name: string): string {
    return name.replace(/\s*-\s*(single|ep)$/i, "").trim();
}

// Picks the best candidate: title+artist+album match first (same release), then
// title+artist (any release - single/live/duet/cover may outrank the right one), then
// artist-only, then the top result. A song can exist in many releases (single, album,
// live, duet, covers by other acts) that all share the exact same title, so pinning to
// the source's own album is what tells the real release apart from the rest.
export function pickBestMatch<T>(
    results: T[],
    target: { title: string; artists: string[]; album?: string },
    getTitle: (r: T) => string,
    getArtist: (r: T) => string,
    getAlbum?: (r: T) => string
): T {
    const title = normalizeText(target.title);
    const artists = target.artists.map(normalizeText);
    const album = target.album ? normalizeText(target.album) : undefined;

    const artistMatches = (r: T) => {
        const rArtist = normalizeText(getArtist(r));
        return artists.some((a) => rArtist.includes(a) || a.includes(rArtist));
    };
    const titleMatches = (r: T) => {
        const rTitle = normalizeText(getTitle(r));
        return rTitle.includes(title) || title.includes(rTitle);
    };
    const albumMatches = (r: T) => {
        if (!album || !getAlbum) return false;
        const rAlbum = normalizeText(getAlbum(r));
        return rAlbum.includes(album) || album.includes(rAlbum);
    };

    return (
        results.find((r) => titleMatches(r) && artistMatches(r) && albumMatches(r)) ??
        results.find((r) => titleMatches(r) && artistMatches(r)) ??
        results.find((r) => artistMatches(r)) ??
        results[0]
    );
}
