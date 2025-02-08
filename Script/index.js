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
    try {
        let response = await fetch(`https://spotify-clone-qcq2.onrender.com/songs/${folder}/`);
        if (!response.ok) throw new Error(`Failed to fetch songs for folder ${folder}`);
        
        let div = document.createElement("div");
        let text = await response.text();
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/songs/${folder}/`)[1]); 
            }
        }

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

        Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });

        return songs;
    } catch (error) {
        console.error(error);
    }
}

const playMusic = (track, pause = false) => {
    if (!track) {
        console.error('Track not found!');
        return;
    }

    console.log("Playing track:", track);

    const songPath = `https://spotify-clone-qcq2.onrender.com/songs/${currFolder}/${track}`;
    currentSong.src = songPath;

    currentSong.addEventListener('error', (e) => {
        console.error('Error loading track:', songPath);
    });

    currentSong.load();

    if (!pause && currentSong.paused) {
        currentSong.play().catch(err => {
            console.error('Failed to play the track:', err);
        });
        document.querySelector(".play").src = "../img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums");

    try {
        let a = await fetch(`https://spotify-clone-qcq2.onrender.com/songs/`);
        if (!a.ok) throw new Error('Failed to fetch albums');
        
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
                    let response = await fetch(`https://spotify-clone-qcq2.onrender.com/songs/${folder}/info.json`);
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
            }
        }

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                const folder = card.dataset.folder;
                songs = await getSongs(folder);
                playMusic(songs[0]);
            });
        });

    } catch (error) {
        console.error(error);
    }
}

async function main() {
    let folder = "ncs";
    try {
        songs = await getSongs(folder);
        if (songs.length > 0) {
            playMusic(songs[0], true);
        }

        await displayAlbums();

        const playButton = document.querySelector(".play");
        if (playButton) {
            playButton.addEventListener("click", () => {
                if (currentSong.paused) {
                    currentSong.play().catch(err => {
                        console.error('Error playing the song:', err);
                    });
                    playButton.src = "../img/pause.svg";
                } else {
                    currentSong.pause();
                    playButton.src = "../img/play.svg";
                }
            });
        } else {
            console.error(".play button not found!");
        }

        currentSong.addEventListener("timeupdate", () => {
            document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            const leftMenu = document.querySelector(".left");
            if (leftMenu) {
                leftMenu.style.left = "0";
            } else {
                console.error(".left menu not found!");
            }
        });

        document.querySelector(".close").addEventListener("click", () => {
            const leftMenu = document.querySelector(".left");
            if (leftMenu) {
                leftMenu.style.left = "-120%";
            } else {
                console.error(".left menu not found!");
            }
        });

        const previousButton = document.querySelector(".previous");
        if (previousButton) {
            previousButton.addEventListener("click", () => {
                currentSong.pause();
                let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
                if ((index - 1) >= 0) {
                    playMusic(songs[index - 1]);
                }
            });
        }

        const nextButton = document.querySelector(".next");
        if (nextButton) {
            nextButton.addEventListener("click", () => {
                currentSong.pause();
                let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
                if ((index + 1) < songs.length) {
                    playMusic(songs[index + 1]);
                }
            });
        }

        const volumeSlider = document.querySelector(".range input");
        if (volumeSlider) {
            volumeSlider.addEventListener("change", (e) => {
                currentSong.volume = parseInt(e.target.value) / 100;
                if (currentSong.volume > 0) {
                    document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
                }
            });
        }

        const volumeButton = document.querySelector(".volume>img");
        if (volumeButton) {
            volumeButton.addEventListener("click", (e) => {
                if (e.target.src.includes("volume.svg")) {
                    e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                    currentSong.volume = 0;
                    if (volumeSlider) volumeSlider.value = 0;
                } else {
                    e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                    currentSong.volume = .10;
                    if (volumeSlider) volumeSlider.value = 10;
                }
            });
        }

    } catch (error) {
        console.error(error);
    }
}

main();
