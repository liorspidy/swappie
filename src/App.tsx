import styles from "./App.module.scss";
import Converter from "./components/Converter";
import spotifyIcon from "./assets/spotify.svg";
import appleMusicIcon from "./assets/apple-music.svg";
import Lottie from "lottie-react";
import arrowLottie from "./assets/arrow.json";
import { useState } from "react";
import Loader from "./components/Loader";

function App() {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    return (
        <>
            {isLoading && <Loader />}
            <div className={styles.titleContainer}>
                <div className={styles.icons}>
                    <Lottie
                        className={`${styles.lottieArrow} ${styles.top}`}
                        id="arrowOne"
                        animationData={arrowLottie}
                        loop={true}
                    />
                    <img
                        className={`${styles.icon} ${styles.spotify}`}
                        src={spotifyIcon}
                        alt="spotify icon"
                    />
                    <h1>Swappie</h1>
                    <img
                        className={`${styles.icon} ${styles.apple}`}
                        src={appleMusicIcon}
                        alt="apple music icon"
                    />
                    <Lottie
                        className={`${styles.lottieArrow} ${styles.bottom}`}
                        id="arrowTwo"
                        animationData={arrowLottie}
                        loop={true}
                    />
                </div>
            </div>
            <p>
                Paste a Spotify or Apple Music song <br/>
                We’ll find its twin link ✨
            </p>

            <Converter setIsLoading={setIsLoading}/>

            <small className={styles.small}>
              This app is not affiliated with or endorsed by Spotify or Apple Music. 
              <br/>
              Created by Lior Fridman 2025.
            </small>
        </>
    );
}

export default App;
