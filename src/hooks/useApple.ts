import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { IArtist, IStatuses } from "../interfaces/data.interface";

interface useAppleProps {
    setFinalUrl: Dispatch<SetStateAction<string>>;
    setStatus: Dispatch<SetStateAction<IStatuses | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setSongDetails: Dispatch<SetStateAction<any>>;
    spotifyToken: string;
}

const useApple = ({
    setFinalUrl,
    setStatus,
    setIsLoading,
    setSongDetails,
    spotifyToken,
}: useAppleProps) => {
    // Extract track ID from URL for apple music
    const extractAppleTrackId = useCallback(async (url: string) => {
        // If there's ?i= — it's a track inside album
        const trackMatch = url.match(/i=(\d+)/);
        if (trackMatch) return { id: trackMatch[1], isAlbum: false };

        // If it's a /song/ URL
        const songMatch = url.match(/\/song\/[^/]+\/(\d+)/);
        if (songMatch) return { id: songMatch[1], isAlbum: false };

        // Otherwise, fallback to album URL
        const albumMatch = url.match(/\/album\/[^/]+\/(\d+)/);
        if (albumMatch) return { id: albumMatch[1], isAlbum: true };

        return null;
    }, []);

    // fetches the spotify url from the apple music data
    const fetchSpotifyUrlBySongDetails = useCallback(
        async (artist: IArtist, title: string, token?: string) => {
            try {
                const query = encodeURIComponent(`${title} ${artist}`);
                const res = await fetch(
                    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const data = await res.json();
                setFinalUrl(data.tracks.items[0]?.external_urls.spotify);
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

    // fetches the data of the song from apple music
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

                const songData = isAlbum ? data.results[1] : data.results[0];

                setSongDetails({
                    title: songData.trackName,
                    artists: songData.artistName,
                    year: songData.releaseDate.split("-")[0],
                    album: songData.collectionName,
                    cover: songData.artworkUrl100.replace("100x100", "600x600"),
                    url: songData.trackViewUrl,
                });

                fetchSpotifyUrlBySongDetails(
                    songData.artistName,
                    songData.trackName,
                    spotifyToken
                );
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
            spotifyToken,
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
