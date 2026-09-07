import { useCallback, type Dispatch, type SetStateAction } from "react";
import type {
    IAppleResponse,
    IArtist,
    ISongDetails,
    IStatuses,
} from "../interfaces/data.interface";
import { normalizeText, pickBestMatch } from "../utils/textMatch";

interface useSpotifyProps {
    setStatus: Dispatch<SetStateAction<IStatuses | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setFoundResults: Dispatch<SetStateAction<any>>;
    currentShownIndex: number;
    setSongDetails: Dispatch<SetStateAction<ISongDetails | null>>;
    setFinalUrl: Dispatch<SetStateAction<string>>;
}

const useSpotify = ({
    setStatus,
    setIsLoading,
    setFoundResults,
    currentShownIndex,
    setSongDetails,
    setFinalUrl,
}: useSpotifyProps) => {
    // Extract track/album ID from a Spotify URL (canonical open.spotify.com only)
    const extractSpotifyId = useCallback(async (url: string) => {
        url = url.trim().split("?")[0]; // clean params

        const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
        if (trackMatch) return { id: trackMatch[1], isAlbum: false };

        const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
        if (albumMatch) return { id: albumMatch[1], isAlbum: true };

        return null;
    }, []);

    const fetchAppleUrlBySongDetails = useCallback(
        async (artists: IArtist[], title: string) => {
            const normalizedTitle = normalizeText(title);
            const normalizedArtistNames = artists
                .map((a) => normalizeText(a.name))
                .join(" ");

            // primary: artist + title
            const primaryTerm = encodeURI(
                `${normalizedArtistNames} ${normalizedTitle}`
            );
            // fallback: title only
            const fallbackTerm = encodeURI(normalizedTitle);

            let res = await fetch(
                `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/apple/search?entity=song&term=${primaryTerm}`
            );
            let data = await res.json();

            if (!data.results || data.results.length === 0) {
                console.warn("[Apple Search] No result for artist+title, trying fallback title only");
                res = await fetch(
                    `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/apple/search?entity=song&term=${fallbackTerm}`
                );
                data = await res.json();
            }

            if (!data.results || data.results.length === 0) {
                throw new Error("Song not found on Apple Music");
            }

            setFoundResults(data.results);

            const found =
                pickBestMatch(
                    data.results,
                    { title, artists: artists.map((a) => a.name) },
                    (r: IAppleResponse) => r.trackName,
                    (r: IAppleResponse) => r.artistName
                ) || data.results[currentShownIndex];

            return {
                appleUrl: found.trackViewUrl,
            };
        },
        [currentShownIndex, setFoundResults]
    );

    const fetchAppleAlbumUrlByDetails = useCallback(
        async (artists: IArtist[], albumName: string) => {
            const normalizedAlbum = normalizeText(albumName);
            const normalizedArtistNames = artists
                .map((a) => normalizeText(a.name))
                .join(" ");

            const primaryTerm = encodeURI(
                `${normalizedArtistNames} ${normalizedAlbum}`
            );
            const fallbackTerm = encodeURI(normalizedAlbum);

            let res = await fetch(
                `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/apple/search?entity=album&term=${primaryTerm}`
            );
            let data = await res.json();

            if (!data.results || data.results.length === 0) {
                res = await fetch(
                    `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/apple/search?entity=album&term=${fallbackTerm}`
                );
                data = await res.json();
            }

            if (!data.results || data.results.length === 0) {
                throw new Error("Album not found on Apple Music");
            }

            const found = pickBestMatch(
                data.results,
                { title: albumName, artists: artists.map((a) => a.name) },
                (r: IAppleResponse) => r.collectionName,
                (r: IAppleResponse) => r.artistName
            );

            return { appleUrl: found.collectionViewUrl };
        },
        []
    );

    // Fetch track details from Spotify (via BE proxy — BE holds the Spotify token)
    const fetchSpotifySongDetailsById = useCallback(
        async (trackId: string) => {
            try {
                const trackRes = await fetch(
                    `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/track/${trackId}`
                );

                if (!trackRes.ok) {
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

                // fetch Apple URL
                fetchAppleUrlBySongDetails(track.artists, track.name)
                    .then((res) => {
                        setFinalUrl(res.appleUrl);
                        setStatus({
                            message: "Apple Music URL found!",
                            type: "success",
                        });
                    })
                    .catch((err) => {
                        console.error("Apple lookup error:", err);
                        setStatus({
                            message: "Failed to fetch song details",
                            type: "error",
                        });
                    });
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
            setIsLoading,
            setStatus,
            setSongDetails,
            setFinalUrl,
        ]
    );

    // Fetch album details from Spotify (via BE proxy — BE holds the Spotify token)
    const fetchSpotifyAlbumDetailsById = useCallback(
        async (albumId: string) => {
            try {
                const albumRes = await fetch(
                    `${import.meta.env.VITE_BACKEND_ENDPOINT}/api/spotify/album/${albumId}`
                );

                if (!albumRes.ok) {
                    throw new Error(`Spotify error ${albumRes.status}`);
                }

                const album = await albumRes.json();
                setSongDetails({
                    title: album.name,
                    artists: album.artists
                        .map((a: IArtist) => a.name)
                        .join(", "),
                    year: album.release_date.split("-")[0],
                    cover: album.images?.[0]?.url,
                    url: album.external_urls.spotify,
                    isAlbum: true,
                });

                fetchAppleAlbumUrlByDetails(album.artists, album.name)
                    .then((res) => {
                        setFinalUrl(res.appleUrl);
                        setStatus({
                            message: "Apple Music album found!",
                            type: "success",
                        });
                    })
                    .catch((err) => {
                        console.error("Apple album lookup error:", err);
                        setStatus({
                            message: "Failed to fetch album details",
                            type: "error",
                        });
                    });
            } catch (err) {
                console.error("Album fetch error:", err);
                setStatus({
                    message: "Failed to fetch album details",
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [
            fetchAppleAlbumUrlByDetails,
            setIsLoading,
            setStatus,
            setSongDetails,
            setFinalUrl,
        ]
    );

    return {
        extractSpotifyId,
        fetchSpotifySongDetailsById,
        fetchSpotifyAlbumDetailsById,
    };
};

export default useSpotify;
