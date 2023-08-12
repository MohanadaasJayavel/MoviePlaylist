const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const shortid = require("shortid");
const apiUrl = "https://api.themoviedb.org/3";
const apiKey = "04c35731a5ee918f014970082a0088b1";
const serviceAccount = require("./ServiceAccountkey/movieplaylist-e43bc-firebase-adminsdk-xbkgr-7c1c806847.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "movieplaylist-e43bc.firebaseapp.com",
});
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  })
);
app.use(bodyParser.json());
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const db = admin.firestore();
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRef = db.collection("MoviePlaylist").doc(email);
    const snapshot = await userRef.get();
    console.log({ snapshot });
    if (snapshot.exists) {
      return res
        .status(400)
        .json({ message: "User already exists", status: 400 });
    }
    await userRef.set({
      email,
      password,
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", status: 201 });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Registration failed", status: 500 });
  }
});

const sessionTokens = {};
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRef = db.collection("MoviePlaylist").doc(email);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ meaasge: "User not found", status: 404 });
    }
    const userData = snapshot.data();
    if (userData.password !== password) {
      return res
        .status(401)
        .json({ message: "Authentication failed", status: 401 });
    }
    const sessionToken = Math.random().toString(36).substr(2);
    sessionTokens[sessionToken] = email;
    res.status(200).json({
      message: "Login successful",
      status: 200,
      sessionToken,
      email: userData.email,
    });
  } catch (error) {
    res.status(500).json({ message: "Authentication failed", status: 500 });
  }
});

function validateSession(req, res, next) {
  const sessionToken = req.headers["session-token"];
  if (!sessionToken || !sessionTokens[sessionToken]) {
    return res.status(401).json({ message: "Unauthorized", status: 401 });
  }
  req.email = sessionTokens[sessionToken];
  next();
}

app.get("/dashboard", validateSession, (req, res) => {
  const userEmail = req.email;
});

app.post("/search-movies", async (req, res) => {
  const searchInput = req.body.searchInput;
  const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${searchInput}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ message: "Error fetching movies", status: 500 });
  }
});

app.post("/create-playlist", validateSession, async (req, res) => {
  try {
    const { playlistName, isPrivate, movies } = req.body;
    const userEmail = req.email;
    const userRef = db.collection("MoviePlaylist").doc(userEmail);
    const username = userEmail;
    const playlistDocRef = userRef
      .collection("Playlists")
      .doc(`${username}_${playlistName}`);
    const existingPlaylistDoc = await playlistDocRef.get();

    if (existingPlaylistDoc.exists) {
      const existingPlaylistData = existingPlaylistDoc.data();
      const moviesToAdd = movies.filter(
        (newMovie) => !existingPlaylistData.movies.includes(newMovie)
      );

      if (moviesToAdd.length === 0) {
        return res.status(200).json({
          message: "Movie already added to the playlist",
          status: 111,
        });
      }

      const updatedMovies = [...existingPlaylistData.movies, ...moviesToAdd];
      await playlistDocRef.update({ movies: updatedMovies });

      return res
        .status(200)
        .json({ message: "Playlist updated successfully", status: 200 });
    } else {
      const uniqueId = shortid.generate();
      const devBaseUrl = "http://127.0.0.1:5500";
      const playlistUrl = `${devBaseUrl}/playlist/${uniqueId}`;
      const playlistData = {
        name: playlistName,
        isPrivate,
        movies,
        url: playlistUrl,
      };

      await playlistDocRef.set(playlistData);

      return res
        .status(201)
        .json({ message: "Playlist created successfully", status: 201 });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Playlist creation/update failed", status: 500 });
  }
});

app.get("/view-playlists", validateSession, async (req, res) => {
  try {
    const userEmail = req.email;
    const userRef = db.collection("MoviePlaylist").doc(userEmail);
    const playlistsSnapshot = await userRef.collection("Playlists").get();

    const playlists = [];
    for (const doc of playlistsSnapshot.docs) {
      const playlistData = doc.data();

      playlists.push({
        id: doc.id,
        name: playlistData.name,
        isPrivate: playlistData.isPrivate,
        movies: playlistData.movies,
        url: playlistData.url,
      });
    }

    return res.status(200).json({ status: 200, playlists });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching playlists", status: 500 });
  }
});
