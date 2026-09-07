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

// Picks the best candidate: title+artist match first, then artist-only, then the top result.
export function pickBestMatch<T>(
    results: T[],
    target: { title: string; artists: string[] },
    getTitle: (r: T) => string,
    getArtist: (r: T) => string
): T {
    const title = normalizeText(target.title);
    const artists = target.artists.map(normalizeText);
    const artistMatches = (r: T) => {
        const rArtist = normalizeText(getArtist(r));
        return artists.some((a) => rArtist.includes(a) || a.includes(rArtist));
    };
    const titleMatches = (r: T) => {
        const rTitle = normalizeText(getTitle(r));
        return rTitle.includes(title) || title.includes(rTitle);
    };

    return (
        results.find((r) => titleMatches(r) && artistMatches(r)) ??
        results.find((r) => artistMatches(r)) ??
        results[0]
    );
}
