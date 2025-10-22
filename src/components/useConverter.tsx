import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import type {
    IAppleResponse,
    IArtist,
    ISongDetails,
    IStatuses,
} from "../interfaces/data.interface";

const TOKEN_KEY = "spotify_token";

const useConverter = () => {
    const [inputUrl, setInputUrl] = useState("");
    const [finalUrl, setFinalUrl] = useState("");
    const [songDetails, setSongDetails] = useState<ISongDetails | null>(null);
    const [foundResults, setFoundResults] = useState<any>(null);
    const [currentShownIndex, setCurrentShownIndex] = useState<number>(0);
    const [spotifyToken, setSpotifyToken] = useState<string>(
        () => sessionStorage.getItem(TOKEN_KEY) || ""
    );
    const [status, setStatus] = useState<IStatuses | null>(null);

    // Fetch a new token if needed
    const getSpotifyToken = useCallback(async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/token`
            );
            const data = await res.json();
            if (data.token) {
                // Save to both state and sessionStorage
                sessionStorage.setItem(TOKEN_KEY, data.token);
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
        }
    }, []);

    // Extract track ID from URL
    const extractTrackId = useCallback((url: string) => {
        const match = url.match(/track\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }, []);

    const fetchAppleUrlBySong = useCallback(
        async (artists: IArtist[], title: string) => {
            // Join all artist names for the search term
            const artistNames = artists.map((a) => a.name).join(" ");
            const searchTerm = encodeURIComponent(`${artistNames} ${title}`);

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
        [currentShownIndex]
    );

    // Fetch track details from Spotify API
    const fetchTrackDetails = useCallback(
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
                            return fetchTrackDetails(trackId, newToken);
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
                    spotifyUrl: track.external_urls.spotify,
                });

                // fetches the apple's song url and keeps it in the state
                fetchAppleUrlBySong(track.artists, track.name).then((res) => {
                    setFinalUrl(res.appleUrl);
                });

                setStatus({
                    message: "Song details found!",
                    type: "success",
                });
            } catch (err) {
                console.error("Track fetch error:", err);
                setStatus({
                    message: "Failed to fetch song details",
                    type: "error",
                });
            }
        },
        [fetchAppleUrlBySong, getSpotifyToken, spotifyToken]
    );

    // Handle user action
    const handleFindSong = useCallback(async () => {
        setCurrentShownIndex(0);
        if (!inputUrl.trim()) return;

        const platform = inputUrl.includes("spotify") ? "spotify" : "apple";

        switch (platform) {
            case "spotify": {
                const trackId = extractTrackId(inputUrl);
                if (!trackId) {
                    setStatus({
                        message: "Invalid Spotify URL",
                        type: "error",
                    });
                    return;
                }

                if (!spotifyToken) {
                    const token = await getSpotifyToken();
                    if (token) fetchTrackDetails(trackId, token);
                } else {
                    fetchTrackDetails(trackId);
                }
                break;
            }
            case "apple":
                // TODO: Apple flow
                break;
            default:
                setStatus({ message: "Invalid platform", type: "error" });
        }
    }, [extractTrackId, fetchTrackDetails, getSpotifyToken, inputUrl, spotifyToken]);

    const handleCopy = () => {
        if (!finalUrl) return;
        navigator.clipboard.writeText(finalUrl);
        toast.info("Link copied!");
    };

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleFindSong();
    }, [handleFindSong]);

    const nextSongHandler = useCallback(() => {
        setCurrentShownIndex((prev) => prev === foundResults.length - 1 ? 0 : prev + 1)
        setFinalUrl(foundResults[currentShownIndex === foundResults.length - 1 ? 0 : currentShownIndex + 1].trackViewUrl);
    },[setCurrentShownIndex, foundResults, currentShownIndex])


    useEffect(() => {
        if (status) {
            if (status.type === "success") toast.success(status.message);
            else toast.error(status.message);
            setStatus(null);
        }
    }, [status]);

    return {
        inputUrl,
        setInputUrl,
        finalUrl,
        handleFindSong,
        songDetails,
        handleCopy,
        handleKeyPress,
        nextSongHandler
    };
};

export default useConverter;
