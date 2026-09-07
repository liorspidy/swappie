import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { ISpotifyItem, IStatuses } from "../interfaces/data.interface";
import { normalizeText, pickBestMatch, stripReleaseTypeSuffix } from "../utils/textMatch";

interface useAppleProps {
    setFinalUrl: Dispatch<SetStateAction<string>>;
    setStatus: Dispatch<SetStateAction<IStatuses | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setSongDetails: Dispatch<SetStateAction<any>>;
}

const useApple = ({
    setFinalUrl,
    setStatus,
    setIsLoading,
    setSongDetails,
}: useAppleProps) => {
    // Extract track/album ID from URL for apple music
    const extractAppleTrackId = useCallback(async (url: string) => {
        // If there's ?i= — it's a track inside album
        const trackMatch = url.match(/i=(\d+)/);
        if (trackMatch) return { id: trackMatch[1], isAlbum: false };

        // If it's a /song/ URL
        const songMatch = url.match(/\/song\/(?:[^/]+\/)?(\d+)/);
        if (songMatch) return { id: songMatch[1], isAlbum: false };

        // Otherwise, fallback to album URL (the slug segment is optional)
        const albumMatch = url.match(/\/album\/(?:[^/]+\/)?(\d+)/);
        if (albumMatch) return { id: albumMatch[1], isAlbum: true };

        return null;
    }, []);

    // finds the best-matching Spotify track for a given title/artist (via BE proxy)
    const fetchSpotifyUrlBySongDetails = useCallback(
        async (artist: string, title: string) => {
            try {
                const normalizedTitle = normalizeText(title);
                const normalizedArtist = normalizeText(artist);

                const primaryQuery = encodeURIComponent(
                    `${normalizedArtist} ${normalizedTitle}`
                );
                let res = await fetch(
                    `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/search?q=${primaryQuery}&type=track&limit=5`
                );
                let data = await res.json();
                let items: ISpotifyItem[] = data.tracks?.items ?? [];

                if (items.length === 0) {
                    const fallbackQuery = encodeURIComponent(normalizedTitle);
                    res = await fetch(
                        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/search?q=${fallbackQuery}&type=track&limit=5`
                    );
                    data = await res.json();
                    items = data.tracks?.items ?? [];
                }

                if (items.length === 0) {
                    throw new Error("Song not found on Spotify");
                }

                const found = pickBestMatch(
                    items,
                    { title, artists: [artist] },
                    (r: ISpotifyItem) => r.name,
                    (r: ISpotifyItem) => r.artists.map((a) => a.name).join(" ")
                );

                setFinalUrl(found.external_urls.spotify);
                setStatus({
                    message: "Spotify URL found!",
                    type: "success",
                });
            } catch (err) {
                console.error("Spotify fetch error:", err);
                setStatus({
                    message: "Failed to fetch Spotify URL",
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [setStatus, setIsLoading, setFinalUrl]
    );

    // finds the best-matching Spotify album for a given album/artist (via BE proxy)
    const fetchSpotifyAlbumUrlByDetails = useCallback(
        async (artist: string, albumName: string) => {
            try {
                const cleanAlbumName = stripReleaseTypeSuffix(albumName);
                const normalizedAlbum = normalizeText(cleanAlbumName);
                const normalizedArtist = normalizeText(artist);

                const primaryQuery = encodeURIComponent(
                    `${normalizedArtist} ${normalizedAlbum}`
                );
                let res = await fetch(
                    `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/search?q=${primaryQuery}&type=album&limit=5`
                );
                let data = await res.json();
                let items: ISpotifyItem[] = data.albums?.items ?? [];

                if (items.length === 0) {
                    const fallbackQuery = encodeURIComponent(normalizedAlbum);
                    res = await fetch(
                        `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/search?q=${fallbackQuery}&type=album&limit=5`
                    );
                    data = await res.json();
                    items = data.albums?.items ?? [];
                }

                if (items.length === 0) {
                    throw new Error("Album not found on Spotify");
                }

                const found = pickBestMatch(
                    items,
                    { title: cleanAlbumName, artists: [artist] },
                    (r: ISpotifyItem) => r.name,
                    (r: ISpotifyItem) => r.artists.map((a) => a.name).join(" ")
                );

                setFinalUrl(found.external_urls.spotify);
                setStatus({
                    message: "Spotify album found!",
                    type: "success",
                });
            } catch (err) {
                console.error("Spotify album fetch error:", err);
                setStatus({
                    message: "Failed to fetch Spotify album",
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [setStatus, setIsLoading, setFinalUrl]
    );

    // fetches the data of the song/album from apple music
    const fetchAppleSongDetailsById = useCallback(
        async (id: string, isAlbum: boolean) => {
            try {
                const url = isAlbum
                    ? `https://itunes.apple.com/lookup?id=${id}&entity=song`
                    : `https://itunes.apple.com/lookup?id=${id}`;

                const res = await fetch(url);
                if (!res.ok) throw new Error(`Apple Music error ${res.status}`);

                const data = await res.json();
                if (!data.results || data.results.length === 0) {
                    throw new Error("Song not found on Apple Music");
                }

                // for an album, results[0] is the collection itself; for a track, results[0] is the track
                const songData = data.results[0];

                if (isAlbum) {
                    setSongDetails({
                        title: songData.collectionName,
                        artists: songData.artistName,
                        year: songData.releaseDate.split("-")[0],
                        cover: songData.artworkUrl100?.replace("100x100", "600x600"),
                        url: songData.collectionViewUrl,
                        isAlbum: true,
                    });

                    fetchSpotifyAlbumUrlByDetails(
                        songData.artistName,
                        songData.collectionName
                    );
                } else {
                    setSongDetails({
                        title: songData.trackName,
                        artists: songData.artistName,
                        year: songData.releaseDate.split("-")[0],
                        album: songData.collectionName,
                        cover: songData.artworkUrl100?.replace("100x100", "600x600"),
                        url: songData.trackViewUrl,
                    });

                    fetchSpotifyUrlBySongDetails(
                        songData.artistName,
                        songData.trackName
                    );
                }
            } catch (err) {
                console.error("Apple track fetch error:", err);
                setStatus({
                    message: "Failed to fetch Apple song",
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [
            fetchSpotifyUrlBySongDetails,
            fetchSpotifyAlbumUrlByDetails,
            setIsLoading,
            setSongDetails,
            setStatus,
        ]
    );

    return {
        extractAppleTrackId,
        fetchAppleSongDetailsById,
    };
};

export default useApple;
