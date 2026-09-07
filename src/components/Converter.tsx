import styles from "./Converter.module.scss";
import { Trash2 } from "lucide-react";
import copyIcon from "../assets/copy.svg";
// import shareIcon from "../assets/share.svg";
import useConverter from "../hooks/useConverter";
import Toast from "./Toast";

interface converterProps {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const Converter = ({ setIsLoading }: converterProps) => {
    const {
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
    } = useConverter({ setIsLoading });

    return (
        <div className={styles.card}>
            <Toast status={status} />
            <div className={styles.inputWrapper}>
                <input
                    id="inputURL"
                    type="text"
                    placeholder="Paste song or album's URL..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    type="button"
                    className={styles.clearInputBtn}
                    aria-label="Clear input"
                    disabled={!inputUrl}
                    onClick={clearInput}
                >
                    <Trash2 size={18} />
                </button>
            </div>
            <button className={styles.finderBtn} onClick={handleFindSong}>
                Find Song
            </button>

            {songDetails && (
                <div className={styles.songDetails}>
                    {songDetails.cover && (
                        <img
                            src={songDetails.cover}
                            alt="Song cover"
                            className={styles.cover}
                        />
                    )}
                    <div className={styles.info}>
                        <h3>{songDetails.title}</h3>
                        <p>{songDetails.artists}</p>
                        <p>
                            {songDetails.album && `${songDetails.album} • `}
                            {songDetails.year}
                        </p>
                    </div>
                </div>
            )}

            {finalUrl && (
                <div className={styles.finalResultContainer}>
                    <a
                        className={styles.finalRes}
                        href={finalUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {finalUrl}
                    </a>
                    <div className={styles.actionsContainer}>
                        <button className={styles.actionBtn} onClick={handleCopy}>
                            <span>Copy</span>
                            <img
                                className={styles.actionIcon}
                                src={copyIcon}
                                alt="copy button"
                            />
                        </button>
                        {/* <button className={styles.actionBtn}>
                            <span>Share</span>
                            <img
                                className={styles.actionIcon}
                                src={shareIcon}
                                alt="share button"
                            />
                        </button> */}
                    </div>

                    {convertingTo === "spotify" && foundResults && (
                        <button
                            className={styles.wrongSongBtn}
                            onClick={nextSongHandler}
                        >
                            <span>That's not it 😢</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Converter;
