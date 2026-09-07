import { useEffect, useState, useCallback } from "react";
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
    const [status, setStatus] = useState<IStatuses | null>(null);

    // spotify hook
    const {
        extractSpotifyId,
        fetchSpotifySongDetailsById,
        fetchSpotifyAlbumDetailsById,
    } = useSpotify({
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
    });

    // Handle user action
    const handleFindSong = useCallback(async () => {
        setFinalUrl("");
        setFoundResults(null);
        if (!inputUrl.trim()) return;

        setCurrentShownIndex(0);
        setIsLoading(true);
        const platform = inputUrl.includes("spotify") ? "spotify" : "apple";
        setConvertingTo(platform);

        switch (platform) {
            case "spotify": {
                const extracted = await extractSpotifyId(inputUrl);

                if (!extracted) {
                    setStatus({
                        message: "Invalid Spotify URL",
                        type: "error",
                    });
                    setIsLoading(false);
                    return;
                }

                const fetchDetails = extracted.isAlbum
                    ? fetchSpotifyAlbumDetailsById
                    : fetchSpotifySongDetailsById;

                fetchDetails(extracted.id);
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
        extractSpotifyId,
        extractAppleTrackId,
        fetchSpotifySongDetailsById,
        fetchSpotifyAlbumDetailsById,
        fetchAppleSongDetailsById,
        inputUrl,
        setIsLoading,
    ]);

    const clearInput = useCallback(() => {
        setInputUrl("");
        setFinalUrl("");
        setSongDetails(null);
        setFoundResults(null);
        setConvertingTo(null);
    }, []);

    const handleCopy = () => {
        if (!finalUrl) return;
        navigator.clipboard.writeText(finalUrl);
        setStatus({ message: "Link copied!", type: "success" });
    };

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleFindSong();
        },
        [handleFindSong]
    );

    const nextSongHandler = useCallback(() => {
        if (!foundResults) return;
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

    // single status slot: a new one replaces the last instead of stacking
    useEffect(() => {
        if (!status) return;
        const timer = setTimeout(() => setStatus(null), 2500);
        return () => clearTimeout(timer);
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
        convertingTo,
        clearInput,
        foundResults,
        status,
    };
};

export default useConverter;
