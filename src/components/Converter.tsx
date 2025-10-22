import "./Converter.css";
import copyIcon from "../assets/copy.svg";
import { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import type { ISongDetails, IStatuses } from "../interfaces/data.interface";

const Converter = () => {
    const [value, setValue] = useState<string>("");
    const [finalRes, setFinalRes] = useState<string>("");
    const [songDetails, setSongDetails] = useState<ISongDetails | null>(null);
    const [processStatus, setProcessStatus] = useState<IStatuses | null>(null);

    const findSong = () => {
        findAppleSong();
        // setFinalRes(value);
        // setProcessStatus({
        //     message: "your URL is ready!",
        //     type: "success"
        // })
    };

    const findAppleSong = async () => {
        const oEmbedUrl = "https://open.spotify.com/oembed?url=" + value;
        const res = await fetch(oEmbedUrl);
        const data = await res.json();
        setSongDetails({
            title: data.title,
            author: data.author_name,
            year: data.year
        })
    }

    const copyHandler = () => {
        navigator.clipboard.writeText(finalRes);
    };

    const onKeyHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            findSong();
        }
    };

    useEffect(() => {
        if(processStatus) {
            if(processStatus.type === "success") {
                toast.success(processStatus.message)
            } else if (processStatus.type === "error") {
                toast.error(processStatus.message)
            }
            setProcessStatus(null)
        }
    },[processStatus])

    return (
        <div className="card">
            <input
                type="text"
                name="urlInput"
                value={value}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setValue(e.target.value)
                }
                onKeyDown={onKeyHandler}
            />
            <button className="finderBtn" onClick={findSong}>
                Find This Song
            </button>

            {finalRes && (
                <div className="finalResultContainer">
                    <a className="finalRes" href={finalRes} target="_blank">{finalRes}</a>
                    <button className="copyBtn" onClick={copyHandler}>
                        Copy
                        <img
                            className="copyIcon"
                            src={copyIcon}
                            alt="copy button"
                        />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Converter;
