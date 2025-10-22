import "./Converter.css";
import copyIcon from "../assets/copy.svg";
import shareIcon from "../assets/share.svg";
import useConverter from "./useConverter";

const Converter = () => {
    const {
        inputUrl,
        setInputUrl,
        finalUrl,
        handleFindSong,
        songDetails,
        handleCopy,
        handleKeyPress,
        nextSongHandler
    } = useConverter();

    return (
        <div className="card">
                <input
                    id="inputURL"
                    type="text"
                    placeholder="Paste Spotify URL..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
            <button className="finderBtn" onClick={handleFindSong}>
                Find Song
            </button>

            {songDetails && (
                <div className="songDetails">
                    {songDetails.cover && (
                        <img
                            src={songDetails.cover}
                            alt="Song cover"
                            className="cover"
                        />
                    )}
                    <div className="info">
                        <h3>{songDetails.title}</h3>
                        <p>{songDetails.artists}</p>
                        <p>
                            {songDetails.album} • {songDetails.year}
                        </p>
                    </div>
                </div>
            )}

            {finalUrl && (
                <div className="finalResultContainer">
                    <a
                        className="finalRes"
                        href={finalUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {finalUrl}
                    </a>
                    <div className="actionsContainer">
                        <button className="actionBtn" onClick={handleCopy}>
                            <span>Copy</span>
                            <img
                                className="actionIcon"
                                src={copyIcon}
                                alt="copy button"
                            />
                        </button>
                        <button className="actionBtn">
                            <span>Share</span>
                            <img
                                className="actionIcon"
                                src={shareIcon}
                                alt="share button"
                            />
                        </button>
                    </div>

                    <button className="wrongSongBtn" onClick={nextSongHandler}>
                        <span>That's not it 😢</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Converter;
