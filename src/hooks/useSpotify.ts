import {
    useCallback,
    useEffect,
    type Dispatch,
    type SetStateAction,
} from "react";
import type {
    IAppleResponse,
    IArtist,
    ISongDetails,
    IStatuses,
} from "../interfaces/data.interface";

interface useSpotifyProps {
    spotifyToken: string;
    setSpotifyToken: Dispatch<SetStateAction<string>>;
    setStatus: Dispatch<SetStateAction<IStatuses | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setFoundResults: Dispatch<SetStateAction<any>>;
    currentShownIndex: number;
    setSongDetails: Dispatch<SetStateAction<ISongDetails | null>>;
    setFinalUrl: Dispatch<SetStateAction<string>>;
}

const useSpotify = ({
    spotifyToken,
    setSpotifyToken,
    setStatus,
    setIsLoading,
    setFoundResults,
    currentShownIndex,
    setSongDetails,
    setFinalUrl,
}: useSpotifyProps) => {
    // Fetch a new token if needed
    const getSpotifyToken = useCallback(async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/token`
            );
            const data = await res.json();
            if (data.token) {
                setSpotifyToken(data.token);
                return data.token;
            } else {
                throw new Error("Missing token in response");
            }
        } catch (err) {
            console.error("Token error:", err);
            setStatus({
                message: "Failed to get Spotify token",
                type: "error",
            });
            setIsLoading(false);
        }
    }, [setIsLoading, setSpotifyToken, setStatus]);

    useEffect(() => {
        if (!spotifyToken) {
            getSpotifyToken();
        }
    }, [spotifyToken, getSpotifyToken]);

    // Extract track ID from URL for spotify
    const extractSpotifyTrackId = useCallback(async (url: string) => {
        if (url.includes("spotify.link")) {
            try {
                const res = await fetch(
                    `${
                        import.meta.env.VITE_BACKEND_ENDPOINT
                    }/api/spotify/resolve?url=${encodeURIComponent(url)}`
                );
                const data = await res.json();

                if (data.resolvedUrl) {
                    url = data.resolvedUrl;
                }
            } catch (err) {
                console.error("Failed to resolve shortened URL", err);
                return null;
            }
        }

        url = url.trim().split("?")[0]; // clean params
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }, []);

    const normalizeHebrew = useCallback((str: string) => {
        return str
            .normalize("NFKC") // normalize Unicode
            .replace(/\u05BE/g, "") // remove maqaf
            .replace(/\s+/g, " ") // normalize spaces
            .trim()
            .toLowerCase();
    },[]);

    const fetchAppleUrlBySongDetails = useCallback(
        async (artists: IArtist[], title: string) => {
            // Join all artist names for the search term
            const normalizedTitle = normalizeHebrew(title);
            const normalizedArtistNames = artists.map((a) => normalizeHebrew(a.name)).join(" ");
            const searchTerm = encodeURIComponent(`${normalizedArtistNames} ${normalizedTitle}`);

            const res = await fetch(
                `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=5`
            );
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                throw new Error("Song not found on Apple Music");
            }

            setFoundResults(data.results);

            // Basic matching — can be improved with fuzzy matching
            const found =
                data.results.find((r: IAppleResponse) => {
                    const resultArtist = r.artistName.toLowerCase();
                    const resultTitle = r.trackName.toLowerCase();
                    return (
                        artists.some((a) =>
                            resultArtist.includes(a.name.toLowerCase())
                        ) && resultTitle.includes(title.toLowerCase())
                    );
                }) || data.results[currentShownIndex];

            return {
                appleUrl: found.trackViewUrl,
            };
        },
        [currentShownIndex, setFoundResults]
    );

    // Fetch track details from Spotify API
    const fetchSpotifySongDetailsById = useCallback(
        async (trackId: string, token?: string) => {
            try {
                const activeToken = token ?? spotifyToken;
                const trackRes = await fetch(
                    `https://api.spotify.com/v1/tracks/${trackId}`,
                    { headers: { Authorization: `Bearer ${activeToken}` } }
                );

                if (!trackRes.ok) {
                    // Token might be expired — retry after fetching new one
                    if (trackRes.status === 401) {
                        const newToken = await getSpotifyToken();
                        if (newToken)
                            return fetchSpotifySongDetailsById(
                                trackId,
                                newToken
                            );
                    }
                    throw new Error(`Spotify error ${trackRes.status}`);
                }

                const track = await trackRes.json();
                setSongDetails({
                    title: track.name,
                    artists: track.artists
                        .map((a: IArtist) => a.name)
                        .join(", "),
                    year: track.album.release_date.split("-")[0],
                    album: track.album.name,
                    cover: track.album.images?.[0]?.url,
                    url: track.external_urls.spotify,
                });

                // fetches the apple's song url and keeps it in the state
                fetchAppleUrlBySongDetails(track.artists, track.name).then(
                    (res) => {
                        setFinalUrl(res.appleUrl);
                        setStatus({
                            message: "Apple Music URL found!",
                            type: "success",
                        });
                    }
                );
            } catch (err) {
                console.error("Track fetch error:", err);
                setStatus({
                    message: "Failed to fetch song details",
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [
            fetchAppleUrlBySongDetails,
            getSpotifyToken,
            spotifyToken,
            setIsLoading,
            setStatus,
            setSongDetails,
            setFinalUrl,
        ]
    );

    return {
        getSpotifyToken,
        extractSpotifyTrackId,
        fetchSpotifySongDetailsById,
    };
};

export default useSpotify;
