const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = 8888;

app.use(cors());

const playlistMap = new Map();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

let currentAccessToken = "";
let currentSong = null;
let tokenExpirationTime = 0;

async function getNewAccessToken() {
  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    currentAccessToken = response.data.access_token;
    tokenExpirationTime = Date.now() + response.data.expires_in * 1000;
  } catch (error) {
    console.error("Error getting access token:", error);
  }
}

async function getUserProfile(userId) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
      },
    });

    return {
      displayName: response.data.display_name,
      profileImage: response.data.images.length > 0 ? response.data.images[0].url : null,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

async function getCurrentlyPlayingSong() {
  if (!currentAccessToken || Date.now() > tokenExpirationTime) {
    await getNewAccessToken();
  }

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      }
    );

    if (response.data && response.data.is_playing) {
      const trackId = response.data.item.id;
      const playlistInfo = playlistMap.get(trackId);

      if (playlistInfo) {
        const userProfile = await getUserProfile(playlistInfo.currentUserToDisplay);

        currentSong = {
          currentUserToDisplay: userProfile ? userProfile.displayName : playlistInfo.currentUserToDisplay,
          currentlyPlayingSongArtist: response.data.item.artists[0].name,
          currentlyPlayingSongTitle: response.data.item.name,
          currentlyPlayingSongImage: response.data.item.album.images[0].url,
          userProfileImage: userProfile ? userProfile.profileImage : null,
        };
      } else {
        currentSong = null;
      }
    } else {
      currentSong = null;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      await getNewAccessToken();
      await getCurrentlyPlayingSong();
    } else {
      console.error("Error fetching currently playing song:", error);
    }
    currentSong = null;
  }
}

async function getPlaylistInfo() {
  if (!currentAccessToken) {
    await getNewAccessToken();
  }

  let offset = 0;
  let limit = 100;
  let total = 0;

  try {
    do {
      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/7obIQowJclO9XABTSH0v9b/tracks?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${currentAccessToken}`,
          },
        }
      );

      const tracks = response.data.items;
      total = response.data.total;

      tracks.forEach((track) => {
        const trackId = track.track.id;
        if (!playlistMap.has(trackId)) {
          playlistMap.set(trackId, {
            currentUserToDisplay: track.added_by.id || "Unknown",
            currentlyPlayingSongArtist: track.track.artists[0].name,
            currentlyPlayingSongTitle: track.track.name,
            currentlyPlayingSongImage: track.track.album.images[0].url,
          });
        }
      });

      offset += limit;
    } while (offset < total);
  } catch (error) {
    console.error("Error fetching playlist info:", error);
  }
}

setInterval(async () => {
  await getCurrentlyPlayingSong();
  console.log("Currently playing song updated:", currentSong);
}, 2500);

setInterval(async () => {
  await getPlaylistInfo();
}, 10000);

app.get("/partyPlaylist", (req, res) => {
  if (!currentSong) {
    return res.status(500).json({ error: "Failed to fetch data." });
  }
  res.json(currentSong);
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await getPlaylistInfo();
});