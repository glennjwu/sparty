import React, { useState, useEffect, useRef } from "react";
import Aaron from "./imgs/aaron.png";
import Glenn from "./imgs/Glenn.png";
import Terry from "./imgs/terry.png";
import Christy from "./imgs/christy2.jpeg";

// import "./index.scss";
import styles from "./Home.module.css";

const size = 250;
const unknownURL =
  "https://media.istockphoto.com/id/1334419989/photo/3d-red-question-mark.jpg?s=612x612&w=0&k=20&c=bpaGVuyt_ACui3xK8CvkeoVQC-jczxANZTMXGKAE11E=";

const App = () => {
  const [isExpanded, setIsExpanded] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentUserToDisplay, setCurrentUserToDisplay] =
    useState("Unknown User");
  const [currentlyPlayingSongArtist, setCurrentlyPlayingSongArtist] =
    useState("Unknown Artist");
  const [currentlyPlayingSongTitle, setCurrentlyPlayingSongTitle] =
    useState("Unknown Title");
  const [currentyPlayingSongImage, setCurrentyPlayingSongImage] =
    useState(unknownURL);
  const [imageURL, setImageURL] = useState(unknownURL);
  const [recognized, setRecognized] = useState(false);

  async function getServerSideProps() {
    try {
      const res = await fetch("http://localhost:8888/partyPlaylist");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  }

  const container = useRef();
  const [box, setBox] = useState({
    color: 0,
    top: 0,
    left: 0,
    topDir: 1,
    leftDir: 1,
  });
  const { color, top, left, topDir, leftDir } = box;

  useEffect(() => {
    const getCurrentlyPlayingSong = async () => {
      try {
        const currentSong = await getServerSideProps();

        if (
          !currentSong ||
          !currentSong.currentlyPlayingSongTitle ||
          currentSong.currentUserToDisplay === "Unknown User" ||
          currentSong.currentlyPlayingSongArtist === "Unknown Artist" ||
          currentSong.currentUserToDisplay === "No user"
        ) {
          setRecognized(false);
        } else {
          setRecognized(true);
        }

        const songTitle = currentSong?.currentlyPlayingSongTitle
          ? currentSong.currentlyPlayingSongTitle.replace(
            /\s+-\s+|\(\s*.*?\s*\)/g,
            " "
          )
          : "loading...";

        setCurrentUserToDisplay(
          currentSong?.currentUserToDisplay || "updating..."
        );
        setCurrentlyPlayingSongArtist(
          currentSong?.currentlyPlayingSongArtist || "updating..."
        );
        setCurrentlyPlayingSongTitle(songTitle);
        setCurrentyPlayingSongImage(
          currentSong?.currentlyPlayingSongImage || unknownURL
        );

        // Handle user-specific image logic
        switch (currentSong?.currentUserToDisplay) {
          case "aaronw4ng":
            setImageURL(Aaron);
            setCurrentUserToDisplay("aaron");
            break;
          case "glenn.wu2000":
            setImageURL(Glenn);
            setCurrentUserToDisplay("glenn");
            break;
          case "cleanbar7":
            setImageURL(Terry);
            setCurrentUserToDisplay("terry");
            break;
          case "christymooon":
            setImageURL(Christy);
            setCurrentUserToDisplay("christymooon");
            break;
          default:
            setImageURL(currentSong.userProfileImage || unknownURL);
            setCurrentUserToDisplay(
              currentSong?.currentUserToDisplay || "updating..."
            ); // Display the actual username from the data
            break;
        }
      } catch (error) {
        console.error("Error fetching currently playing song:", error);
        setRecognized(false);
      }
    };

    getCurrentlyPlayingSong();

    if (!container.current) return;

    window.requestAnimationFrame(() => {
      const width = container.current.offsetWidth;
      const height = container.current.offsetHeight;

      if (
        (leftDir === 1 && left + size >= width) ||
        (leftDir === -1 && left <= 0)
      ) {
        setBox((val) => ({ ...val, color: color + 1, leftDir: leftDir * -1 }));
      } else if (
        (topDir === 1 && top + size >= height) ||
        (topDir === -1 && top <= 0)
      ) {
        setBox((val) => ({ ...val, color: color + 1, topDir: topDir * -1 }));
      } else {
        setBox((val) => ({ ...val, top: top + topDir, left: left + leftDir }));
      }
    });
  }, [color, top, left, topDir, leftDir]);

  const root = document.querySelector(":root");
  root.style.setProperty("--bg-color", "beige");

  return (
    <main>
      <div
        className={styles.container}
        ref={container}
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div
          className={styles.textContainerHeading}
          style={{ textAlign: "center" }}
        >
          <h1>Happy New Years 🎉</h1>
        </div>
        <div
          style={{
            position: "absolute",
            top: `${top}px`,
            left: `${left}px`,
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          {recognized ? (
            <img
              src={imageURL}
              alt="new"
              style={{ height: "100%", width: "100%", borderRadius: "50%" }}
            />
          ) : (
            <div></div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
            paddingBottom: "15rem",
          }}
        >
          <div className={styles.musicContainer}>
            {recognized ? (
              <div className={styles.textContainer}>
                <h2>
                  {currentUserToDisplay} is responsible for{" "}
                  <br></br>
                  <i>{currentlyPlayingSongTitle}</i> <br></br>
                  by {currentlyPlayingSongArtist}
                </h2>
              </div>
            ) : (
              <div className={styles.textContainer}>
                <h2>updating...</h2>
              </div>
            )}
            <div className={styles.albumContainer}>
              {recognized ? (
                <img
                  src={currentyPlayingSongImage}
                  alt="albumCover"
                  style={{
                    width: "300px",
                    height: "300px",
                    display: "block",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;