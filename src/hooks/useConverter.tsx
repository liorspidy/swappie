import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import type {
    ISongDetails,
    IStatuses,
} from "../interfaces/data.interface";
import useSpotify from "./useSpotify";
import useApple from "./useApple";

interface useConverterProps {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const useConverter = ({ setIsLoading }: useConverterProps) => {
    const [inputUrl, setInputUrl] = useState("");
    const [finalUrl, setFinalUrl] = useState("");
    const [songDetails, setSongDetails] = useState<ISongDetails | null>(null);
    const [foundResults, setFoundResults] = useState<any>(null);
    const [currentShownIndex, setCurrentShownIndex] = useState<number>(0);
    const [convertingTo, setConvertingTo] = useState<"spotify" | "apple" | null>(null);
    const [spotifyToken, setSpotifyToken] = useState<string>("");
    const [status, setStatus] = useState<IStatuses | null>(null);

    // spotify hook
    const {
        getSpotifyToken,
        extractSpotifyTrackId,
        fetchSpotifySongDetailsById,
    } = useSpotify({
        spotifyToken,
        setSpotifyToken,
        setStatus,
        setIsLoading,
        setFoundResults,
        currentShownIndex,
        setSongDetails,
        setFinalUrl,
    });

    // apple music hook
    const { extractAppleTrackId, fetchAppleSongDetailsById } = useApple({
        setFinalUrl,
        setStatus,
        setIsLoading,
        setSongDetails,
        spotifyToken,
    });

    // Handle user action
    const handleFindSong = useCallback(async () => {
        setFinalUrl("")
        if (!inputUrl.trim()) return;

        setCurrentShownIndex(0);
        setIsLoading(true);
        const platform = inputUrl.includes("spotify") ? "spotify" : "apple";
        setConvertingTo(platform);

        switch (platform) {
            case "spotify": {
                const trackId = await extractSpotifyTrackId(inputUrl);

                if (!trackId) {
                    setStatus({
                        message: "Invalid Spotify URL",
                        type: "error",
                    });
                    setIsLoading(false);
                    return;
                }

                if (!spotifyToken) {
                    const token = await getSpotifyToken();
                    if (token) fetchSpotifySongDetailsById(trackId, token);
                } else {
                    fetchSpotifySongDetailsById(trackId);
                }
                break;
            }
            case "apple": {
                const extracted = await extractAppleTrackId(inputUrl);
                if (!extracted) {
                    setStatus({
                        message: "Invalid Apple Music URL",
                        type: "error",
                    });
                    setIsLoading(false);
                    return;
                }

                fetchAppleSongDetailsById(extracted.id, extracted.isAlbum);
                break;
            }
            default:
                setStatus({ message: "Invalid platform", type: "error" });
        }
    }, [
        extractSpotifyTrackId,
        extractAppleTrackId,
        fetchSpotifySongDetailsById,
        fetchAppleSongDetailsById,
        getSpotifyToken,
        inputUrl,
        spotifyToken,
        setIsLoading,
    ]);

    const handleCopy = () => {
        if (!finalUrl) return;
        navigator.clipboard.writeText(finalUrl);
        toast.info("Link copied!");
    };

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleFindSong();
        },
        [handleFindSong]
    );

    const nextSongHandler = useCallback(() => {
        setCurrentShownIndex((prev) =>
            prev === foundResults.length - 1 ? 0 : prev + 1
        );
        setFinalUrl(
            foundResults[
                currentShownIndex === foundResults.length - 1
                    ? 0
                    : currentShownIndex + 1
            ].trackViewUrl
        );
    }, [setCurrentShownIndex, foundResults, currentShownIndex]);

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
        nextSongHandler,
        convertingTo
    };
};

export default useConverter;
