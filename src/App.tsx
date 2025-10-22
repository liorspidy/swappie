import "./App.css";
import Converter from "./components/Converter";
import spotifyIcon from "./assets/spotify.svg";
import appleMusicIcon from "./assets/apple-music.svg";
import { Slide, ToastContainer } from "react-toastify";
import Lottie from "lottie-react";
import arrowLottie from "./assets/arrow.json";
import { useState } from "react";
import Loader from "./components/Loader";

function App() {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    return (
        <>
            {isLoading && <Loader />}
            <div className="titleContainer">
                <div className="icons">
                    <Lottie
                        className="lottieArrow top"
                        id="arrowOne"
                        animationData={arrowLottie}
                        loop={true}
                    />
                    <img
                        className="icon spotify"
                        src={spotifyIcon}
                        alt="spotify icon"
                    />
                    <h1>Swappie</h1>
                    <img
                        className="icon apple"
                        src={appleMusicIcon}
                        alt="apple music icon"
                    />
                    <Lottie
                        className="lottieArrow bottom"
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
            <ToastContainer
                position="top-center"
                autoClose={1000}
                hideProgressBar={true}
                newestOnTop={true}
                closeOnClick
                theme="light"
                transition={Slide}
            />

            <small className="small">
              This app is not affiliated with or endorsed by Spotify or Apple Music. 
              <br/>
              Created by Lior Fridman 2025.
            </small>
        </>
    );
}

export default App;
