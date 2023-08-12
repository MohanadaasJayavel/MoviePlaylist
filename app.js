const apiUrl = "https://api.themoviedb.org/3";
const apiKey = "04c35731a5ee918f014970082a0088b1";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("modalRegisterUsernameInput").value;
    const password = document.getElementById(
      "modalRegisterPasswordInput"
    ).value;

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.status == 201) {
        alert("User Registration Successful");
      } else if (data.status == 400) {
        alert("User Already exists");
      }
      closeRegisterModal();
    } catch (error) {
      console.error("Error:", error);
    }
  });
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("modalLoginUsernameInput").value;
    const password = document.getElementById("modalLoginPasswordInput").value;

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.status == 200) {
        localStorage.setItem("sessionToken", data.sessionToken);
        alert("Login Successful");
        document.getElementById("Logout").style.visibility = "visible";
        closeLoginModal();
      } else if (data.status == 404) {
        alert("Username not found");
        closeLoginModal();
      } else if (data.status == 401) {
        alert("Invalid Credentials");
      } else if (data.status == 500) {
        alert("Authentication failed");
        closeLoginModal();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  });
});

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

function openplaylistModal(movie) {
  openModal("playlistModal");
  localStorage.setItem("CurrentMovie", movie);
}
function closeplaylistModal() {
  closeModal("playlistModal");
}
document
  .getElementById("registerBtn")
  .addEventListener("click", openRegisterModal);

document
  .getElementById("createPlaylistBtn")
  .addEventListener("click", createplaylist);

document
  .getElementById("viewPlaylistBtn")
  .addEventListener("click", ViewPlaylist);

document
  .getElementById("registerClose")
  .addEventListener("click", closeRegisterModal);

document
  .getElementById("playlistClose")
  .addEventListener("click", closeplaylistModal);

document.getElementById("loginBtn").addEventListener("click", openLoginModal);
document.getElementById("Logout").addEventListener("click", logout);

document
  .getElementById("AddtoPlaylist")
  .addEventListener("click", openplaylistModal);
document
  .getElementById("loginClose")
  .addEventListener("click", closeLoginModal);

function openLoginModal() {
  openModal("loginModal");
}

function closeLoginModal() {
  closeModal("loginModal");
}
function closeviewmyplaylistModal() {
  closeModal("viewPlaylistModal");
}

function logout() {
  localStorage.removeItem("sessionToken");
  alert("LoggedOut Succefully");
}

async function searchMovies() {
  const searchInput = document.getElementById("searchInput").value;
  const serverUrl = "http://localhost:3000/search-movies";

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchInput }),
    });

    const data = await response.json();
    displayMovies(data.results);
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
    ratings.classList.add("ratings_alert");
  } else if (ratings.innerText > 9) {
    ratings.classList.add("ratings_good");
  } else {
    ratings.classList.add("ratings_average");
  }
  const addToPlaylistBtn = document.createElement("button");
  addToPlaylistBtn.innerText = "Add to Playlist";
  addToPlaylistBtn.id = "AddtoPlaylist";
  addToPlaylistBtn.addEventListener("click", () =>
    openplaylistModal(movie.title)
  );
  movieCard.appendChild(addToPlaylistBtn);
  return movieCard;
}

async function createplaylist(curentmovie) {
  const playlistName = document.getElementById("modalPlaylistNameInput").value;
  const isPrivate = document.getElementById("isPrivateCheckbox").checked;
  const sessionToken = localStorage.getItem("sessionToken");
  let currentselectedMovie = localStorage.getItem("CurrentMovie");

  try {
    const response = await fetch("http://localhost:3000/create-playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Session-Token": sessionToken,
      },
      body: JSON.stringify({
        playlistName,
        isPrivate,
        movies: [currentselectedMovie],
      }),
    });

    const data = await response.json();
    if (data.status === 201 || data.status === 200) {
      alert(data.message);
      closeplaylistModal();
    } else if (data.status == 111) {
      alert(data.message);
      closeplaylistModal();
    } else if (data.status == 401) {
    } else {
      alert("Please Login to continue");
      closeplaylistModal();
    }
  } catch (error) {
    console.error("Error adding movie to playlist:", error);
  }
}

async function ViewPlaylist() {
  try {
    const sessionToken = localStorage.getItem("sessionToken");
    if (!sessionToken) {
      alert("You need to log in to view your playlists.");
      return;
    }

    const response = await fetch("http://localhost:3000/view-playlists", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Session-Token": sessionToken,
      },
    });

    const data = await response.json();

    if (data.status === 200) {
      const publicPlaylists = data.playlists.filter(
        (playlist) => !playlist.isPrivate
      );
      const privatePlaylists = data.playlists.filter(
        (playlist) => playlist.isPrivate
      );

      displayPlaylists(publicPlaylists, privatePlaylists);
    } else {
      alert("Failed to fetch playlists.");
    }
  } catch (error) {
    console.error("Error fetching playlists:", error);
  }
}

function displayPlaylists(publicPlaylists, privatePlaylists) {
  const myPlaylistsDiv = document.getElementById("myPlaylists");
  myPlaylistsDiv.innerHTML = "";

  if (publicPlaylists.length > 0) {
    const publicPlaylistDiv = createPlaylistGroup(
      "Public Playlists",
      publicPlaylists
    );
    myPlaylistsDiv.appendChild(publicPlaylistDiv);
  }

  if (privatePlaylists.length > 0) {
    const privatePlaylistDiv = createPlaylistGroup(
      "Private Playlists",
      privatePlaylists
    );
    myPlaylistsDiv.appendChild(privatePlaylistDiv);
  }

  const viewPlaylistModal = document.getElementById("viewPlaylistModal");
  viewPlaylistModal.style.display = "block";
}

function createPlaylistGroup(groupName, playlists) {
  const groupDiv = document.createElement("div");
  groupDiv.classList.add("playlist-group");
  groupDiv.innerHTML = `<h2>${groupName}</h2>`;

  playlists.forEach((playlist) => {
    const playlistDiv = createPlaylistDiv(playlist);
    groupDiv.appendChild(playlistDiv);
  });

  return groupDiv;
}

function createPlaylistDiv(playlist) {
  const playlistDiv = document.createElement("div");
  playlistDiv.classList.add("playlist-item");
  playlistDiv.innerHTML = `
    <h3>${playlist.name}</h3>
    <p>URL: <a href="${playlist.url}" target="_blank">${playlist.url}</a></p>
    <ul>
      ${playlist.movies.map((movieName) => `<li>${movieName}</li>`).join("")}
    </ul>
  `;
  return playlistDiv;
}
