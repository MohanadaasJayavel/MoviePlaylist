const apiUrl = "https://api.themoviedb.org/3";
const apiKey = "04c35731a5ee918f014970082a0088b1";

const userLocalStorageKey = "moviePlaylistAppUser";
const playlistsLocalStorageKey = "moviePlaylistAppPlaylists";

let currentUser = null;
let playlists = [];

function isLoggedIn() {
  return currentUser !== null;
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function openRegisterModal() {
  openModal("registerModal");
}

function closeRegisterModal() {
  closeModal("registerModal");
}

function openLoginModal() {
  openModal("loginModal");
}

function closeLoginModal() {
  closeModal("loginModal");
}

function openPlaylistModal() {
  openModal("playlistModal");
}

function closePlaylistModal() {
  closeModal("playlistModal");
}

function openViewPlaylistModal() {
  openModal("viewPlaylistModal");
}

function closeViewPlaylistModal() {
  closeModal("viewPlaylistModal");
}

function hashPassword(password) {
  return password.split("").reverse().join("");
}

function registerUser() {
  const username = document.getElementById("modalRegisterUsernameInput").value;
  const password = document.getElementById("modalRegisterPasswordInput").value;

  if (!username || !password) {
    alert("Please enter a valid username and password.");
    return;
  }

  const existingUser = JSON.parse(localStorage.getItem(userLocalStorageKey));
  if (existingUser && existingUser.username === username) {
    alert("User already exists. Please login.");
    return;
  }

  const user = { username, password: hashPassword(password) };
  localStorage.setItem(userLocalStorageKey, JSON.stringify(user));

  alert("User registered successfully. Please login.");
  closeRegisterModal();
}

function loginUser() {
  const username = document.getElementById("modalLoginUsernameInput").value;
  const password = document.getElementById("modalLoginPasswordInput").value;
  if (!username || !password) {
    alert("Please enter a valid username and password.");
    return;
  }
  const user = JSON.parse(localStorage.getItem(userLocalStorageKey));
  if (
    !user ||
    user.username !== username ||
    user.password !== hashPassword(password)
  ) {
    alert("Invalid credentials. Please try again.");
    return;
  }
  currentUser = user;
  document.getElementById("authSection").style.display = "none";
  document.getElementById("playlistSection").style.display = "block";
  loadPlaylists();
  alert("Login successful.");
  closeLoginModal();
}

function createPlaylist() {
  if (!isLoggedIn()) {
    alert("Please login first.");
    return;
  }
  openPlaylistModal();
}

function addMovieToPlaylist(movie) {
  if (!isLoggedIn()) {
    alert("Please login first.");
    return;
  }
  openPlaylistModal();
  document
    .getElementById("modalCreatePlaylistBtn")
    .addEventListener("click", () => {
      const playlistName = document.getElementById(
        "modalPlaylistNameInput"
      ).value;
      const isPrivate = document.getElementById(
        "modalIsPrivateCheckbox"
      ).checked;
      addMovieToSelectedPlaylist(movie, playlistName, isPrivate);
    });

  document
    .getElementById("modalCreatePlaylistBtn")
    .addEventListener("click", () => {
      const playlistName = document.getElementById(
        "modalPlaylistNameInput"
      ).value;
      const isPrivate = document.getElementById(
        "modalIsPrivateCheckbox"
      ).checked;
      addMovieToSelectedPlaylist(movie, playlistName, isPrivate);
    });
}

function addMovieToSelectedPlaylist(movie, playlistName, isPrivate) {
  if (!isLoggedIn()) {
    alert("Please login first.");
    return;
  }

  if (!playlistName) {
    alert("Please enter a valid playlist name.");
    return;
  }

  let playlist = playlists.find(
    (p) => p.name === playlistName && p.owner === currentUser.username
  );

  if (!playlist) {
    playlist = {
      name: playlistName,
      isPrivate,
      owner: currentUser.username,
      movies: [],
    };
    playlists.push(playlist);
  }

  if (movie) {
    playlist.movies.push(movie);
    alert("Movie added to the playlist successfully.");
  } else {
    alert("Playlist created successfully.");
  }

  savePlaylists();
  closePlaylistModal();
  updatePlaylistView();
}

function loadPlaylists() {
  const savedPlaylists = JSON.parse(
    localStorage.getItem(playlistsLocalStorageKey)
  );
  if (savedPlaylists) {
    playlists = savedPlaylists;
  }
  updatePlaylistView();
}

function savePlaylists() {
  localStorage.setItem(playlistsLocalStorageKey, JSON.stringify(playlists));
}

async function searchMovies() {
  const searchInput = document.getElementById("searchInput").value;
  const url = `${apiUrl}/search/movie?api_key=${apiKey}&query=${searchInput}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    displayMovies(data.results);
    console.log(data.results);
  } catch (error) {
    console.error("Error fetching movies:", error);
  }
}

function displayMovies(movies) {
  const moviesList = document.getElementById("moviesList");
  moviesList.innerHTML = "";

  if (movies.length === 0) {
    moviesList.innerHTML = "<p>No movies found.</p>";
    return;
  }

  movies.forEach((movie) => {
    const movieCard = createMovieCard(movie);
    moviesList.appendChild(movieCard);
  });
}

function createMovieCard(movie) {
  const movieCard = document.createElement("div");
  movieCard.classList.add("movie-card");

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/300x450";

  const posterImg = document.createElement("img");
  posterImg.src = posterUrl;
  posterImg.alt = movie.title;
  posterImg.classList.add("poster-img");

  const title_div = document.createElement("div");
  const title = document.createElement("h2");
  title.innerText = movie.title;
  title.classList.add("title");
  movieCard.appendChild(posterImg);
  movieCard.append(title_div);
  title_div.appendChild(title);

  const ratings = document.createElement("div");
  movieCard.appendChild(ratings);
  ratings.innerText = movie.vote_average;

  if (ratings.innerText < 5) {
    console.log(ratings.innerText, "worst");
    ratings.classList.add("ratings_alert");
  } else if (ratings.innerText > 9) {
    console.log(ratings.innerText, "good");
    ratings.classList.add("ratings_good");
  } else {
    console.log(ratings.innerText, "averag");
    ratings.classList.add("ratings_average");
  }
  const addToPlaylistBtn = document.createElement("button");
  addToPlaylistBtn.innerText = "Add to Playlist";
  addToPlaylistBtn.addEventListener("click", () => addMovieToPlaylist(movie));
  movieCard.appendChild(addToPlaylistBtn);

  return movieCard;
}

function updatePlaylistView() {
  const myPlaylistsContainer = document.getElementById("myPlaylists");
  myPlaylistsContainer.innerHTML = "";

  playlists.forEach((playlist) => {
    if (playlist.owner === currentUser.username) {
      const playlistCard = document.createElement("div");
      playlistCard.classList.add("playlist-card");

      const playlistName = document.createElement("h2");
      playlistName.innerText = playlist.name;
      playlistCard.appendChild(playlistName);

      const playlistDetails = document.createElement("p");
      playlistDetails.innerText = playlist.isPrivate ? "Private" : "Public";
      playlistCard.appendChild(playlistDetails);

      const movieList = document.createElement("ul");
      playlist.movies.forEach((movie) => {
        const movieItem = document.createElement("li");
        movieItem.innerText = movie.title;
        movieList.appendChild(movieItem);
      });
      playlistCard.appendChild(movieList);

      myPlaylistsContainer.appendChild(playlistCard);
    }
  });
}

function showMyPlaylists() {
  if (!isLoggedIn()) {
    alert("Please login first.");
    return;
  }

  document.getElementById("authSection").style.display = "none";
  document.getElementById("playlistSection").style.display = "none";
  document.getElementById("viewPlaylistModal").style.display = "block";
  updatePlaylistView();
}

document
  .getElementById("registerBtn")
  .addEventListener("click", openRegisterModal);
document.getElementById("loginBtn").addEventListener("click", openLoginModal);
document
  .getElementById("loginClose")
  .addEventListener("click", closeLoginModal);
document
  .getElementById("registerClose")
  .addEventListener("click", closeRegisterModal);
document
  .getElementById("playlistClose")
  .addEventListener("click", closePlaylistModal);
document
  .getElementById("viewPlaylistClose")
  .addEventListener("click", closeViewPlaylistModal);
document
  .getElementById("createPlaylistBtn")
  .addEventListener("click", createPlaylist);
document
  .getElementById("modalRegisterBtn")
  .addEventListener("click", registerUser);
document.getElementById("modalLoginBtn").addEventListener("click", loginUser);
document
  .getElementById("modalCreatePlaylistBtn")
  .addEventListener("click", () => {
    const playlistName = document.getElementById(
      "modalPlaylistNameInput"
    ).value;
    const isPrivate = document.getElementById("modalIsPrivateCheckbox").checked;
    addMovieToSelectedPlaylist(null, playlistName, isPrivate);
  });
document
  .getElementById("viewPlaylistBtn")
  .addEventListener("click", showMyPlaylists);
loadPlaylists();
