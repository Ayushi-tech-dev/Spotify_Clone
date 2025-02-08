console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`https://spotify-clone-qcq2.onrender.com/songs/${folder}/`);  // Use absolute URL
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/songs/${folder}/`)[1]);
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li>
            <img class="invert" width="34" src="../img/music.svg" alt="Music Icon">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Artist</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="../img/play.svg" alt="Play Icon">
            </div>
        </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    return songs;  // Return songs so they can be used elsewhere
}

const playMusic = (track, pause = false) => {
    console.log("Playing track:", track);  // Debugging line
    currentSong.src = `../songs/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "../img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums");

    let a = await fetch(`https://spotify-clone-qcq2.onrender.com/songs/${folder}/`);

    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = Array.from(div.getElementsByTagName("a"));
    let cardContainer = document.querySelector(".cardContainer");

    if (!cardContainer) {
        console.error("Card container not found in the DOM");
        return;
    }

    for (let e of anchors) {
        const relativePath = e.href.replace(window.location.origin, "");
        const folderMatch = relativePath.match(/^\/songs\/([^\/]+)/);
        const folder = folderMatch ? folderMatch[1] : null;

        if (folder && relativePath.includes(`songs/${folder}`) && !relativePath.includes(".htaccess")) {
            try {
                let response = await fetch(`../songs/${folder}/info.json`);
                if (!response.ok) throw new Error(`Failed to load info.json for folder ${folder}`);

                let data = await response.json();
                if (!data.title || !data.description) throw new Error(`Missing title or description for folder ${folder}`);

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play"><img src="../img/play.svg" alt="Play Icon" width="24" height="24"></div>
                        <img src="../songs/${folder}/cover.jpg" alt="Album Cover">
                        <h2>${data.title}</h2>
                        <p>${data.description}</p>
                    </div>`;
            } catch (error) {
                console.error(error);
            }
        } else {
            console.log("No valid folder found for href:", e.href);
        }
    }

    // Attach event listeners to album cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            songs = await getSongs(folder);
            playMusic(songs[0]);
        });
    });
}






async function main() {
    let folder = "ncs";  // Set the folder name (you can dynamically set this based on your app logic)
    // Get the list of all the songs
    songs = await getSongs(folder);
    playMusic(songs[0], true);

    // Display all the albums on the page
    await displayAlbums();

    // Attach an event listener to play, next, and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "../img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "../img/play.svg";
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();
