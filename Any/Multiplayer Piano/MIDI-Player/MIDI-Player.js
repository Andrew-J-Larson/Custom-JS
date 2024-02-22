// ==JavaScript==
const NAME = "Multiplayer Piano - MIDI Player";
const NAMESPACE = "https://andrew-larson.dev/";
const VERSION = "3.9.996";
const DESCRIPTION = "Plays MIDI files!";
const AUTHOR = "Andrew Larson";
const LICENSE = "GPL-3.0-or-later";
const INCLUDE = [/^https?:\/\/([^/.]+\.)?multiplayerpiano\.(net|org|dev|com).*/g,
    /^https?:\/\/([^/.]+\.)?singleplayerpiano\.com.*/g,
    /^https?:\/\/mpp(clone)?\.hri7566\.info.*/g,
    /^https?:\/\/mpp\.autoplayer\.xyz.*/g,
    /^https?:\/\/mpp\.lapishusky\.dev.*/g,
    /^https?:\/\/mpp\.yourfriend\.lv.*/g,
    /^https?:\/\/mpp\.l3m0ncao\.wtf.*/g,
    /^https?:\/\/mpp\.terrium\.net.*/g,
    /^https?:\/\/mpp\.hyye\.tk.*/g,
    /^https?:\/\/mpp\.totalh\.net.*/g,
    /^https?:\/\/mpp\.meowbin\.com.*/g,
    /^https?:\/\/mppfork\.netlify\.app.*/g,
    /^https?:\/\/better\.mppclone\.me.*/g,
    /^https?:\/\/([^/.]+\.)?openmpp\.tk.*/g,
    /^https?:\/\/([^/.]+\.)?mppkinda\.com.*/g,
    /^https?:\/\/([^/.]+\.)?augustberchelmann\.com\/piano\/.*/g,
    /^https?:\/\/piano\.ourworldofpixels\.com.*/g,
    /^https?:\/\/beta\-mpp\.csys64\.com.*/g,
    /^https?:\/\/fleetway-mpp\.glitch\.me.*/g,
    /^https?:\/\/([^/.]+\.)?mppclone\.com.*/g];
const SUPPORT_URL = "https://github.com/Andrew-J-Larson/Custom-JS/tree/main/!-User-Scripts/Multiplayer%20Piano/MIDI-Player";
const UPDATE_URL = "https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/MIDI-Player.user.js";
const LatestMIDIPlayerJS_URL = "https://api.github.com/repos/grimmdude/MidiPlayerJS/releases/latest";
// ==/JavaScript==

/* Copyright (C) 2024  Andrew Larson (github@andrew-larson.dev)

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

let MPP = window.MPP;

// =============================================== CHECK WEBSITE MATCH REGEX

let currentURL = window.location.href;
let checkingURL;
let validWebsite = false;
for (checkingURL = 0; checkingURL < INCLUDE.length; checkingURL++) {
    if (currentURL.match(INCLUDE[checkingURL])) {
        validWebsite = true;
    }
}
if (!validWebsite) {
    throw "Not on the Multiplayer Piano website, or compatible clone.";
}

// should be global: $, MPP, EventEmitter, mixin, MidiPlayer */

// =============================================== SCRIPT CONSTANTS

/* HANDLED AT TOP */

// =============================================== VERSION CHECK

// midiplayer.js via https://github.com/grimmdude/MidiPlayerJS
// (but I should maybe switch to https://github.com/mudcube/MIDI.js OR https://github.com/Tonejs/Midi)
let stringLatestMIDIPlayerJS = "";
let requestLatestMPJS = new XMLHttpRequest();
requestLatestMPJS.open('GET', LatestMIDIPlayerJS_URL, false);
requestLatestMPJS.send(null);
if (requestLatestMPJS.status === 200) {
    let type = requestLatestMPJS.getResponseHeader('Content-Type');
    if (type.indexOf("text") !== 1) {
        stringLatestMIDIPlayerJS = requestLatestMPJS.responseText;
    }
} else {
    throw new Error('[' + NAME + "] failed to find latest MidiPlayerJS release from " + LatestMIDIPlayerJS_URL);
}
let jsonLatestMIDIPlayerJS = JSON.parse(stringLatestMIDIPlayerJS);
let LatestMIDIPlayerJS_VERSION = jsonLatestMIDIPlayerJS.name;
let MIDIPlayerJS_URL = "https://raw.githubusercontent.com/grimmdude/MidiPlayerJS/" + LatestMIDIPlayerJS_VERSION + "/browser/midiplayer.js"
let requestMPJS = new XMLHttpRequest();
requestMPJS.open('GET', MIDIPlayerJS_URL, false);
requestMPJS.send(null);
if (requestMPJS.status === 200) {
    let type = requestMPJS.getResponseHeader('Content-Type');
    if (type.indexOf("text") !== 1) {
        let stringMIDIPlayerJS = requestMPJS.responseText;
        let scriptMIDIPlayerJS = document.createElement("script");
        scriptMIDIPlayerJS.type = 'text/javascript';
        scriptMIDIPlayerJS.appendChild(document.createTextNode(stringMIDIPlayerJS));
        (document.body || document.head || document.documentElement).appendChild(scriptMIDIPlayerJS);
    }
} else {
    throw new Error('[' + NAME + "] failed to load MidiPlayerJS from " + MIDIPlayerJS_URL);
}
let latestVersion = null;
let updateURL = UPDATE_URL + '?' + Date.now();
let requestVersion = new XMLHttpRequest();
requestVersion.open('GET', updateURL, false);
requestVersion.send(null);
if (requestVersion.status === 200) {
    let type = requestVersion.getResponseHeader('Content-Type');
    if (type.indexOf("text") !== 1) {
        let responseTextVersion = requestVersion.responseText;
        let textLineVersion = responseTextVersion.split('\n');
        let currentTextLineVersion = 0;
        let findLatestVersion = setInterval(function () {
            if (latestVersion) clearInterval(findLatestVersion);
            else {
                let line = textLineVersion[currentTextLineVersion];
                if (line.startsWith("// @version")) {
                    let lineSplitSpaces = line.split(' ');
                    latestVersion = lineSplitSpaces[lineSplitSpaces.length - 1];
                }
                currentTextLineVersion++;
            }
        }, 1);
    }
} else {
    latestVersion = -1;
    console.warning('[' + NAME + "] failed to find latest script version from " + UPDATE_URL);
    console.warning('[' + NAME + "] skipping version check");
}

// =============================================== CONSTANTS

// NOTE: User script version code is the same from here down

// Time constants (in milliseconds)
const SECOND = 1000;
const HALF_SECOND = SECOND / 2;
const TENTH_OF_SECOND = SECOND / 10; // mainly for repeating loops
const CHAT_DELAY = HALF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = SECOND * 2; // when you are not the owner, your chat quota is lowered
const REPEAT_DELAY = HALF_SECOND; // makes transitioning songs in repeat feel better
const SLOW_DELAY = HALF_SECOND; // keeps midi playing in background, preventing scrambled notes
const SONG_NAME_TIMEOUT = SECOND * 10; // if a file doesn't play, then forget about showing the song name it after this time
const NOTIFICATION_DURATION = SECOND * 15; // how long it takes for notifications to disappear

// URLs
const GITHUB_REPO = 'https://github.com/Andrew-J-Larson/Custom-JS/';
const GITHUB_ISSUE_TITLE = '[Feedback] ' + NAME + ' ' + VERSION;
const GITHUB_ISSUE_BODY = '<!-- Please write your feedback below this line. -->';
const FEEDBACK_URL = GITHUB_REPO + 'issues/new?title=' + encodeURIComponent(GITHUB_ISSUE_TITLE) + '&body=' + encodeURIComponent(GITHUB_ISSUE_BODY);

// Mod constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const PERCUSSION_CHANNELS = [10/*, 11*/]; // (DON'T CHANGE) TODO: figure out how General MIDI Level 2 works with channel 11
//const QUOTA_SIZE_STANDARD_MAX_LOBBY = 240;
//const QUOTA_SIZE_STANDARD_MAX_ROOM_UNOWNED = 1200;
const QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED = 1800; // used to determine users that can play black midi
//const QUOTA_SIZE_PRIVILEGED_MAX_LOBBY = 10 * QUOTA_SIZE_STANDARD_MAX_LOBBY;
//const QUOTA_SIZE_PRIVILEGED_MAX_ROOM_UNOWNED = 10 * QUOTA_SIZE_STANDARD_MAX_ROOM_UNOWNED;
//const QUOTA_SIZE_PRIVILEGED_MAX_ROOM_OWNED = 10 * QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED;
const MIDI_FILE_SIZE_LIMIT_BYTES = 5242880 // 5 MB, most files beyond this size are black midi's which don't work well with standard quota size
const MIDI_FILE_SIZE_MAX_LIMIT_BYTES = 10 * MIDI_FILE_SIZE_LIMIT_BYTES; // 50 MB, roughly somewhere around 150 MB, but depends on how much memory is available to browser tab

// Mod constant settings
const MOD_SOLO_PLAY = true; // sets what play mode when the mod boots up on an owned room

// Mod custom constants
const PREFIX = "mp!";
const PREFIX_LENGTH = PREFIX.length;
const MOD_DISPLAYNAME = "MIDI Player";
const MOD_USERNAME = MOD_DISPLAYNAME + " (`" + PREFIX + "help`)";
const MOD_NAMESPACE = '( ' + NAMESPACE + ' )';
const MOD_DESCRIPTION = "[v" + VERSION + "] " + DESCRIPTION + " Made by a nerd in javascript. Special thanks to grimmdude for https://github.com/grimmdude/MidiPlayerJS " + ((MidiPlayer && MidiPlayer.Constants && MidiPlayer.Constants.VERSION) ? ('(v' + MidiPlayer.Constants.VERSION + ') ') : '') + "library."
const MOD_AUTHOR = "Created by " + AUTHOR + '.';
const BASE_COMMANDS = [
    ["help [command]", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this mod"],
    ["link", "get the download link for this mod"],
    ["feedback", "shows link to send feedback about the mod to the developer"],
    ["ping", "gets the milliseconds response time"]
];
const ROOM_OWNER_COMMANDS = [
    ["consent [user id]", "toggles permission for this modded user to allow their mod to run in the current room"]
];
const MOD_COMMANDS = [
    ["play [MIDI URL]", "plays a specific song (URL must be a direct link to a MIDI file)"],
    ["stop", "stops all music from playing"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat", "toggles repeating current song on or off"],
    ["sustain", "toggles how sustain is controlled via either MIDI or by MPP"],
    ["percussion", "toggles the percussion instruments on or off (off by default since it makes most MIDIs sound bad)"]
];
const MOD_OWNER_COMMANDS = [
    ["loading", "toggles the MIDI loading progress audio, or text, on or off"],
    ["public", "toggles the public mod commands on or off"]
];
const PRE_MSG = MOD_USERNAME;
const PRE_HELP = PRE_MSG + " [Help]";
const PRE_ABOUT = PRE_MSG + " [About]";
const PRE_LINK = PRE_MSG + " [Link]";
const PRE_FEEDBACK = PRE_MSG + " [Feedback]";
const PRE_PING = PRE_MSG + " Pong!";
const PRE_CONSENT = PRE_MSG + " [Consent]";
const PRE_SETTINGS = PRE_MSG + " [Settings]";
const PRE_DOWNLOADING = PRE_MSG + " [Downloading]";
const PRE_ERROR = PRE_MSG + " Error!";
const BAR_LEFT = '「';
const BAR_RIGHT = '」';
const BAR_BLOCK_FILL = '▩';
const BAR_BLOCK_EMPTY = '▢';
const BAR_ARROW_RIGHT = '—➤';
const BAR_NOW_PLAYING = BAR_LEFT + "  Now playing  " + BAR_RIGHT;
const BAR_PLAYING = BAR_LEFT + "    Playing    " + BAR_RIGHT;
const BAR_DONE_PLAYING = BAR_LEFT + " Done playing  " + BAR_RIGHT;
const BAR_PAUSED = BAR_LEFT + "    Paused     " + BAR_RIGHT;
const BAR_STILL_PAUSED = BAR_LEFT + " Still paused  " + BAR_RIGHT;
const BAR_RESUMED = BAR_LEFT + "    Resumed    " + BAR_RIGHT;
const BAR_STILL_RESUMED = BAR_LEFT + " Still resumed " + BAR_RIGHT;
const BAR_STOPPED = BAR_LEFT + "    Stopped    " + BAR_RIGHT;
const ABORTED_DOWNLOAD = "Stopped download.";
const WHERE_TO_FIND_MIDIS = "You can find some good MIDIs to upload from https://bitmidi.com/ , https://midiworld.com/ , https://www.midis101.com/ , https://www.midishrine.com/ , https://www.vgmusic.com/ , https://moviethemes.net/ , https://hamienet.com/ , and supports even more sites now, or you can use your own MIDI files via Google Drive/Dropbox/etc. with a direct download link";
const NOT_OWNER = "The mod isn't the owner of the room";
const NO_SONG = "Not currently playing anything";
const PROGRESS_BAR_BLOCK_SIZE = 26;
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";

// Element constants
const MPP_DYNAMIC_BUTTONS_SELECTOR = '#bottom > div.relative > #buttons';
const CSS_VARIABLE_X_DISPLACEMENT = "--xDisplacement";
const CSS_VARIABLE_Y_DISPLACEMENT = "--yDisplacement";
const CSS_VARIABLE_X_INITIAL = "--xInitial";
const CSS_VARIABLE_Y_INITIAL = "--yInitial";
const CSS_VARIABLE_Y_TOGGLE_INITIAL = "--yToggleInitial"; // helps special case of determining toggle button placement
const PRE_ELEMENT_ID = ([AUTHOR, MOD_DISPLAYNAME].join(' ')).toLowerCase().replace(/[^a-z0-9 ]/gi, '').replaceAll(' ', '-') + '-mod';
const TOGGLER_ELEMENT_ID = PRE_ELEMENT_ID + "-toggler";
const QUERY_BOTTOM_UGLY_BTNS = `#bottom > div > .ugly-button:not([id^=${PRE_ELEMENT_ID}])`;
// buttons have some constant styles/classes
const ELEM_ON = "display:block;";
const ELEM_OFF = "display:none;";
const ELEM_POS = "position:absolute;";
const BTN_STYLE = ELEM_POS + ELEM_OFF;

// =============================================== VARIABLES

let consentOption = true; // allows room owners to turn off the mod in their rooms
let publicOption = false; // turn off the public mod commands if needed
let pinging = false; // helps aid in getting response time
let pingTime = 0; // changes after each ping
let fileSizeLimitBytes = MIDI_FILE_SIZE_LIMIT_BYTES; // updates if user has more than the highest standard quota, to allow playing black midi
MPP.currentRoom = { // added to MPP? if you know, you know...
    id: null, // updates when it connects to room
    authorized: true // disallows use to mod when room owner denies it
};
let chatDelay = CHAT_DELAY; // for how long to wait until posting another message
let endDelay; // used in multiline chats send commands

let mppPianoNotes = null; // will eventually become an array of the available notes, once MPP loads
let mppNoteBank = null; // this will be an array of integers tracking note presses/releases to fix overlapping notes on the same key
let sustainState = { // needed for sustain tracking
    on: false,
    turnBackOn: false
};
let mppDynamicButtons = null; // newer versions of MPP can place the buttons dynamically, if this exists

let loadingOption = false; // controls if loading music should be on or not
let loadingProgress = 0; // updates when loading files
let loadingMusicLoop = null; // this is to play notes while a song is (down)loading
let loadingMusicPrematureStop = false; // this is used when we need to stop the music after errors
let finishedSongName = null; // only checked when not on repeat, for end/done playing message
let ended = true;
let stopped = false;
let paused = false;
let uploadButton = null; // this gets an element after it's loaded
let currentSongProgress = -1; // gets updated while a song plays
let currentSongEventsPlayed = 0; // gets updated while a song plays
let currentSongTotalEvents = 0; // gets updated as soon as a song is loaded
let currentSongData = null; // this contains the song as a data URI
let currentFileLocation = null; // this leads to the MIDI location (local or by URL)
let currentSongName = null; // extracted from the file name/end of URL
let previousSongData = null; // grabs current when changing successfully
let previousSongName = null; // grabs current when changing successfully
let repeatOption = false; // allows for repeat of one song
let sustainOption = true; // makes notes end according to the midi file
let percussionOption = false; // turning on percussion makes a lot of MIDIs sound bad

let loadingProgressNotification = null; // used for closing loading notification sooner
let elapsingProgressNotification = null; // used for closing elapsing notification sooner

let fetchAbortController = new AbortController();
let fetchAbortSignal = fetchAbortController.signal;
let downloading = null; // used to check for and abort fetch

let debouncer = 0; // helps to fix drag & drop

// =============================================== PAGE VISIBILITY

let pageVisible = true;
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        pageVisible = false;
    } else {
        pageVisible = true;
    }
});

// =============================================== OBJECTS

// The MIDIPlayer
const Player = new MidiPlayer.Player();

// =============================================== FUNCTIONS

// CORS Proxy (allows downloading files where JS can't)
let useCorsUrl = function (url, useAlt = false) {
    let newUrl = null; // send null back if it's already a cors url
    let cors_api_url = 'https://corsproxy.io/?';
    let cors_api_url_alt = 'https://api.allorigins.win/get?url=';
    if (useAlt) cors_api_url = cors_api_url_alt;
    // prevents proxying an already corsproxy link
    if (url.indexOf(cors_api_url) == -1) newUrl = cors_api_url + encodeURIComponent(url);
    return newUrl;
};

// When using CORS proxies, sometimes a filename isn't available as content-disposition
// will return URL if it has redirects it needs to go through
let getContentDispositionFilename = function (url, blob, callback) {
    // can't do anything without the URL
    if (!url) {
        callback(blob, null);
        return null;
    }

    fetch("https://api.httpstatus.io/v1/status", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json; charset=utf-8"
        },
        "body": "{\"requestUrl\":\"" + url + "\",\"responseHeaders\":true}"
    })
        .then((res) => res.json())
        .then((data) => {
            let attachmentFilename = null;
            let responseHeaders = null;
            try {
                responseHeaders = data.response.chain[0].responseHeaders;
            } catch {
                responseHeaders = null;
            }
            if (responseHeaders) {
                let locationURL = responseHeaders.location;
                let contentDisposition = responseHeaders['content-disposition'];
                if (contentDisposition) {
                    attachmentFilename = contentDisposition.substring(contentDisposition.indexOf('filename=') + 9);
                    // if there's additional metadata, that also needs to be taken care of
                    let moreMetadata = attachmentFilename.indexOf('; filename*=');
                    if (moreMetadata != -1) {
                        attachmentFilename = attachmentFilename.substring(0, moreMetadata)
                    }
                    let lastCharacter = attachmentFilename.length - 1;
                    // if filename was encased in double quotes, they need to be removed
                    if (attachmentFilename[0] == attachmentFilename[lastCharacter] && attachmentFilename[0] == '"') {
                        attachmentFilename = attachmentFilename.substring(1, lastCharacter);
                    }
                }

                // sometimes it has a redirect it needs to go through to get the right URL with the filename metadata
                if (!attachmentFilename && locationURL && locationURL != '') {
                    attachmentFilename = locationURL;
                }
            }
            return attachmentFilename;
        })
        .then((serverFileName) => {
            callback(blob, serverFileName);
        });
};

// Get visual loading progress (e.g. numBlocks = size of loading bar, think of it like pong bouncing back and forth)
let getLoadingProgress = function (numBlocks, intProgress) {
    let modulusTotal = (2 * numBlocks) - 2;
    let modulusProgress = (intProgress % modulusTotal) || modulusTotal;
    let flipDirection = modulusProgress > numBlocks;
    let blockFillPosition = ((flipDirection ? -1 : 1) * (modulusProgress + (flipDirection ? (-2 * numBlocks) : 0))) - 1;
    let progressMade = "";
    for (let i = 0; i < numBlocks; i++) {
        if (i == blockFillPosition) progressMade += BAR_BLOCK_FILL;
        else progressMade += BAR_BLOCK_EMPTY;
    }
    return progressMade;
};

// Get visual elapsing progress (e.g. numBlocks = size of loading bar, think of it like a loading screen bar)
let getElapsedProgressInt = function (numBlocks, intElapsed, intTotal) {
    return Math.round((intElapsed / intTotal) * numBlocks);
};
let getElapsingProgress = function (numBlocks, intElapsed, intTotal) {
    let elapsedProgress = getElapsedProgressInt(numBlocks, intElapsed, intTotal);
    let progressMade = "";
    for (let i = 0; i < elapsedProgress; i++) {
        progressMade += BAR_BLOCK_FILL;
    }
    for (let j = 0; j < (numBlocks - elapsedProgress); j++) {
        progressMade += BAR_BLOCK_EMPTY;
    }
    return progressMade;
};

// Checks if loading music should play
let preventsLoadingMusic = function () {
    return !loadingMusicPrematureStop && !Player.isPlaying() && !MPP.client.preventsPlaying();
};

// This is used when loading a song in the midi player, if it's been turned on
let humanMusic = function () {
    setTimeout(function () {
        if (preventsLoadingMusic()) MPP.press("c5", 1);
        if (preventsLoadingMusic()) MPP.release("c5");
    }, 200);
    setTimeout(function () {
        if (preventsLoadingMusic()) MPP.press("d5", 1);
        if (preventsLoadingMusic()) MPP.release("d5");
    }, 700);
    setTimeout(function () {
        if (preventsLoadingMusic()) MPP.press("c5", 1);
        if (preventsLoadingMusic()) MPP.release("c5");
        loadingMusicPrematureStop = false;
    }, 1200);
};

// Starts the loading music
let startLoadingMusic = function () {
    if (loadingMusicLoop == null) {
        humanMusic();
        loadingMusicLoop = setInterval(function () {
            humanMusic();
        }, 2200);
    }
};

// Stops the loading music
let stopLoadingMusic = function () {
    if (loadingMusicLoop != null) {
        loadingMusicPrematureStop = true;
        clearInterval(loadingMusicLoop);
        loadingMusicLoop = null;
    }
};

// Check to make sure variable is initialized with something
let exists = function (element) {
    if (typeof (element) != "undefined" && element != null) return true;
    return false;
};

// Format time to HH:MM:SS from seconds
/* let secondsToHms = function(d) {
    d = Number(d);

    let h, m, s;
    let hDisplay = "00";
    let mDisplay = hDisplay;
    let sDisplay = hDisplay;

    if (d != null && d > 0) {
        h = Math.floor(d / 3600);
        m = Math.floor((d % 3600) / 60);
        s = Math.floor((d % 3600) % 60);

        hDisplay = (h < 10 ? "0" : "") + h;
        mDisplay = (m < 10 ? "0" : "") + m;
        sDisplay = (s < 10 ? "0" : "") + s;
    }

    return hDisplay + ':' + mDisplay + ':' + sDisplay;
}; */

// Takes formatted time and removed preceeding zeros (only before minutes)
/* let timeClearZeros = function(formattedHms) {
    let newTime = formattedHms;
    while (newTime.length > 5 && newTime.indexOf("00:") == 0) {
        newTime = newTime.substring(3);
    }
    return newTime;
}; */

// Resizes a formatted HH:MM:SS time to the second formatted time
/* let timeSizeFormat = function(timeCurrent, timeEnd) {
    let newTimeFormat = timeCurrent;
    let timeCurrentLength = timeCurrent.length;
    let timeEndLength = timeEnd.length;
    // lose or add 00's
    if (timeCurrentLength > timeEndLength) newTimeFormat = timeCurrent.substring(timeCurrentLength - timeEndLength);
    while (newTimeFormat.length < timeEndLength) {
        newTimeFormat = "00:" + newTimeFormat;
    }
    return newTimeFormat;
}; */

// Generate a random number
let randomNumber = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Puts quotes around string
let quoteString = function (string) {
    let newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
};

// Converts base64 data URIs to blob
// code modified (removed comments) via https://stackoverflow.com/a/12300351/7312536
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], { type: mimeString });
    return blob;
};

// Gets file as a blob (data URI)
let urlToBlob = function (url, callback) {
    let urlLowerCase = url.toLowerCase();
    let isHTTP = urlLowerCase.indexOf('http://') == 0;
    let isHTTPS = urlLowerCase.indexOf('https://') == 0;

    let invalidProtocol = !isHTTP && !isHTTPS && url.indexOf('://') != -1;
    if (invalidProtocol) {
        callback(null);
        return null;
    }

    let noProtocol = !isHTTP && !isHTTPS;
    let urlNoProtocol = url;
    let urlBasicProtocol = url;
    let urlSecureProtocol = url;
    if (isHTTP) {
        urlNoProtocol = urlNoProtocol.substring(7);
        urlSecureProtocol = 'https://' + urlNoProtocol;
    } else if (isHTTPS) {
        urlNoProtocol = urlNoProtocol.substring(8);
        urlBasicProtocol = 'http://' + urlNoProtocol;;
    } else {
        urlBasicProtocol = 'http://' + urlBasicProtocol;
        urlSecureProtocol = 'https://' + urlSecureProtocol;
    }

    // show file download progress
    mppChatSend(PRE_DOWNLOADING + ' ' + url);
    if (loadingOption) startLoadingMusic();
    else {
        let progress = 0;
        downloading = setInterval(function () {
            if (loadingProgressNotification) {
                loadingProgressNotification.close();
                loadingProgressNotification = null;
            }
            let textColor = (MPP.client.user.color) ? MPP.client.user.color : '#0F0'; // fall back color just in case
            let textStyle = 'style="color: ' + textColor + ' !important"'
            let barProgress = getLoadingProgress(PROGRESS_BAR_BLOCK_SIZE, progress);
            let loadingProgressNotificationSetup = {
                html: '<div class="title" style="display: block !important">' +
                    '<code class="markdown">「<span ' + textStyle + '>' + barProgress + '</span>」</code><span>  </span>' +
                    '</div>' +
                    '<div class="text">' +
                    'Downloading: <code class="markdown" ' + textStyle + '>' + url + '</code>' +
                    '</div>',
                duration: HALF_SECOND,
                class: 'short'
            };
            loadingProgressNotification = mppNotificationSend(loadingProgressNotificationSetup);
            progress++;
        }, 200);
    }

    // can't have "mixed content", so must start off secure
    fetch(urlSecureProtocol, {
        signal: fetchAbortSignal
    }).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.blob();
    }).then(blob => {
        if (blob) {
            stopLoadingMusic();
            clearInterval(downloading);
            downloading = null;
            callback(blob);
        } else {
            throw new Error("BLOB wasn't retrieved");
        }
    }).catch(error => {
        console.error("Normal fetch (secure URL) couldn't get the file:", error.message);

        let corsBasicUrl = useCorsUrl(urlBasicProtocol);

        // try and single proxy fetch (insecure URL), as it's faster
        fetch(corsBasicUrl, {
            signal: fetchAbortSignal
        }).then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.blob();
        }).then(blob => {
            if (blob) {
                stopLoadingMusic();
                clearInterval(downloading);
                downloading = null;
                callback(blob);
            } else {
                throw new Error("BLOB wasn't retrieved");
            }
        }).catch(error => {
            console.error("Single proxy fetch (insecure URL) couldn't get the file:", error.message);

            let corsSecureUrl = useCorsUrl(urlSecureProtocol);

            // try and single proxy fetch (secure URL), as it's faster
            fetch(corsSecureUrl, {
                signal: fetchAbortSignal
            }).then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.blob();
            }).then(blob => {
                if (blob) {
                    stopLoadingMusic();
                    clearInterval(downloading);
                    downloading = null;
                    callback(blob);
                } else {
                    throw new Error("BLOB wasn't retrieved");
                }
            }).catch(error => {
                console.error("Single proxy fetch (secure URL) couldn't get the file:", error.message);

                let corsBasicUrlAlt = useCorsUrl(useCorsUrl(urlBasicProtocol, true));

                // try and double proxy fetch (insecure URL), but it's slower
                fetch(corsBasicUrlAlt, {
                    signal: fetchAbortSignal
                }).then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                }).then(blob => {
                    if (blob) {
                        if (blob.contents || blob.contents == '') {
                            if (blob.contents.indexOf('base64') == -1) {
                                throw new Error("Content wasn't base64");
                            } else {
                                let newBlob = dataURItoBlob(blob.contents);
                                stopLoadingMusic();
                                clearInterval(downloading);
                                downloading = null;
                                callback(newBlob);
                            }
                        } else {
                            throw new Error("JSON content was empty");
                        }
                    } else {
                        throw new Error("BLOB wasn't retrieved");
                    }
                }).catch(error => {
                    console.error("Double proxy fetch (insecure URL) couldn't get the file:", error.message);

                    let corsSecureUrlAlt = useCorsUrl(useCorsUrl(urlSecureProtocol, true));

                    // try and double proxy fetch (secure URL), but it's slower
                    fetch(corsSecureUrlAlt, {
                        signal: fetchAbortSignal
                    }).then(response => {
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
                        return response.json();
                    }).then(blob => {
                        if (blob) {
                            if (blob.contents || blob.contents == '') {
                                if (blob.contents.indexOf('base64') == -1) {
                                    throw new Error("Content wasn't base64");
                                } else {
                                    let newBlob = dataURItoBlob(blob.contents);
                                    stopLoadingMusic();
                                    clearInterval(downloading);
                                    downloading = null;
                                    callback(newBlob);
                                }
                            } else {
                                throw new Error("JSON content was empty");
                            }
                        } else {
                            throw new Error("BLOB wasn't retrieved");
                        }
                    }).catch(error => {
                        console.error("Double proxy fetch (secure URL) couldn't get the file:", error.message);
                        stopLoadingMusic();
                        clearInterval(downloading);
                        downloading = null;
                        callback(error);
                    });
                });
            });
        });
    });
};

// Converts files/blobs to base64 (data URI)
let fileOrBlobToBase64 = function (raw, callback) {
    if (raw == null) {
        stopLoadingMusic();
        callback(null);
    }

    // continue if we have a blob
    let reader = new FileReader();
    reader.readAsDataURL(raw);
    reader.onloadend = function () {
        let base64data = reader.result;
        callback(base64data);
    }
};

// Returns the max file size you can have
let getMaxFileSize = function (lowestSizeBytes, maxSizeBytes) {
    // if noteQuota is undefined, assume we have infinite quota
    let getQuotaMax = MPP && (MPP.noteQuota ? (MPP.noteQuota.max ? MPP.noteQuota.max : 0) : QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED + 1);
    return ((getQuotaMax > QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED) ? maxSizeBytes : lowestSizeBytes);
};

// Validates file or blob is a MIDI
let isMidi = function (raw) {
    if (exists(raw)) {
        let mimetype = raw.type;
        // acceptable mimetypes for midi files
        switch (mimetype) {
            case "@file/mid": case "@file/midi":
            case "application/mid": case "application/midi":
            case "application/x-mid": case "application/x-midi":
            case "audio/mid": case "audio/midi":
            case "audio/x-mid": case "audio/x-midi":
            case "audio/sp-mid": case "audio/sp-midi":
            case "music/crescendo":
            case "x-music/mid": case "x-music/midi":
            case "x-music/x-mid": case "x-music/x-midi": return true; break;
            // no need for default, is caught at end of function
        }
    }
    return false;
};

// Validates file or blob is application/octet-stream ... when using CORS
let isOctetStream = function (raw) {
    if (exists(raw) && raw.type == "application/octet-stream") return true;
    else return false;
};

// Makes all commands into one string
let formattedCommands = function (commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    let commands = '';
    for (let i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' `' : '`') + prefix + commandsArray[i][0] + '`' + (i < (commandsArray.length - 1) ? ',' : '');
    }
    return commands;
};

// Gets 1 command and info about it into a string
let formatCommandInfo = function (commandsArray, commandIndex) {
    return '`' + PREFIX + commandsArray[commandIndex][0] + '`' + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
};

// Send messages without worrying about timing
let mppChatSend = function (str, delay) {
    setTimeout(function () { MPP.chat.send(str) }, (exists(delay) ? delay : 0));
};

// Send multiline chats, and return final delay to make things easier for timings
let mppChatMultiSend = function (strArray, optionalPrefix, initialDelay) {
    if (!exists(optionalPrefix)) optionalPrefix = '';
    let newDelay = 0;
    for (let i = 0; i < strArray.length; ++i) {
        let currentString = strArray[i];
        if (currentString != "") {
            ++newDelay;
            mppChatSend(optionalPrefix + strArray[i], chatDelay * newDelay);
        }
    }
    return chatDelay * newDelay;
};

// Sends MPP a notification
let mppNotificationSend = function (notificationObject) {
    // Contents of a notification
    /*
      let notificationObject = {
          id: "Notification-" + Math.random(),
          title: "",
          text: "",
          html: "",
          target: "#piano",
          duration: 30000, // ms, or 30 seconds
          class: "classic"
      };
    */
    // Behaviors of a notification
    /*
     - the text property (if present) overrides the html property
     - the "short" class value shows only the text/html (removes title line separator too)
     - using a value of "-1" on duration causes the notification to be sticky (never disappears)
     - all notification ids are prefixed with "Notification-" even if you give it one
     - it's better to use single quotes around entire html
     - all properties are technically optional
    */

    // send notification
    if (exists(MPP.Notification)) {
        return new MPP.Notification(notificationObject);
    }
    if (notificationObject.title) console.log(notificationObject.title);
    if (notificationObject.text) console.log(notificationObject.text);
    else if (notificationObject.html) {
        // TODO: need a better way to convert HTML to console output
        let htmlObject = document.createElement("div");
        htmlObject.innerHTML = notificationObject.html ? (notificationObject.html).replaceAll('<br>', '\n') : '';
        let htmlToText = (htmlObject.textContent || htmlObject.innerText);
        if (htmlToText) console.log(htmlToText);
        // else, no text in html to display???
    }
    return null;
};

let playerStop = function (manualStop = false) {
    ended = true; // TODO: temporary, until a real play button is implemented
    paused = false;
    stopped = manualStop ? manualStop : stopped;
    if (!stopped) finishedSongName = currentSongName;
    if (!repeatOption) {
        currentSongData = null;
        currentSongName = null;
    }
    currentSongEventsPlayed = 0;
    currentSongProgress = -1;
    // don't forget to reset the note key bank
    for (let i = 0; i < mppNoteBank.length; i++) {
        mppNoteBank[i] = 0;
    }
};

let playerPlay = function (loop = false) {
    if (loop) {
        // Need to do something???
    }
    ended = stopped = paused = false;
};

let playerPause = function () {
    if (ended || stopped) {
        // Need to do something???
        return;
    }
    paused = true;
};

// Stops song in player, or at least stops all notes
let stopSong = function (fullStop) {
    if (fullStop) {
        if (elapsingProgressNotification) {
            elapsingProgressNotification.close();
            elapsingProgressNotification = null;
        }
        Player.stop();
        playerStop(true);
    }
    // need to first release sustain, if it's on
    if (sustainState.on) {
        MPP.releaseSustain();
        sustainState.on = false;
        if (fullStop) sustainState.turnBackOn = false;
        else sustainState.turnBackOn = true;
    }
    // need to release all keys that are playing at the moment
    Object.values(mppPianoNotes).forEach(note => {
        MPP.release(note);
    });
};

// Opens song in player
let openSong = function (songData) {
    if (!ended) stopSong(true); // MUST STAY HERE, or else can cause browser to crash
    try {
        Player.loadDataUri(songData);
    } catch (error) {
        // reload the previous working file if there is one
        if (previousSongData != null) Player.loadDataUri(previousSongData);
        mppChatSend(PRE_ERROR + " (open) " + error);
        return false;
    }
    return true;
};

// Plays song in player
let playSong = function (songFileName, songData) {
    if (openSong(songData)) {
        // play song
        Player.play();
        playerPlay();
        let timeoutRecorder = 0;
        let showSongName = setInterval(function () {
            if (Player.isPlaying()) {
                clearInterval(showSongName);

                // changes song
                //let hasExtension = songFileName.lastIndexOf('.');
                previousSongData = currentSongData;
                previousSongName = currentSongName;
                currentSongData = songData;
                currentSongName = /*(hasExtension > 0) ? songFileName.substring(0, hasExtension) :*/ songFileName;
                currentSongEventsPlayed = Player.eventsPlayed();
                currentSongTotalEvents = Player.getTotalEvents();

                mppChatSend(PRE_MSG + ' `' + BAR_NOW_PLAYING + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
            } else if (timeoutRecorder == SONG_NAME_TIMEOUT) {
                clearInterval(showSongName);
            } else timeoutRecorder++;
        }, 1);
    }
};

// Plays the song from a URL if it's a MIDI
let playURL = function (songUrl, songData) {
    currentFileLocation = songUrl;
    let songFileName = decodeURIComponent(currentFileLocation.substring(currentFileLocation.lastIndexOf('/') + 1));
    playSong(songFileName, songData);
};

// Plays the song from an uploaded file if it's a MIDI
let playFile = function (songFiles) {
    // for now, only checking for first file in array, may update this later to support a queue of midi files to play
    let songFile = null;
    if (songFiles && songFiles.length >= 1) songFile = songFiles[0];

    let songFileName = null;

    let error = PRE_ERROR + " (play)";
    // load in the file
    if (exists(songFile)) {
        // check and limit file size, mainly to prevent browser tab crashing (not enough RAM to load) and deter black midi
        songFileName = songFile.name.split(/(\\|\/)/g).pop();
        fileSizeLimitBytes = getMaxFileSize(MIDI_FILE_SIZE_LIMIT_BYTES, MIDI_FILE_SIZE_MAX_LIMIT_BYTES);
        if (songFile.size <= fileSizeLimitBytes) {
            if (isMidi(songFile)) {
                fileOrBlobToBase64(songFile, function (base64data) {
                    // play song only if we got data
                    if (exists(base64data)) {
                        currentFileLocation = songFile.name;
                        playSong(songFileName, base64data);
                    } else mppChatSend(error + " Unexpected result, MIDI file couldn't load");
                });
            } else mppChatSend(error + " The file choosen, \"" + songFileName + "\", is either corrupted, or it's not really a MIDI file");
        } else mppChatSend(error + " The file choosen, \"" + songFileName + "\",  is too big (larger than " + fileSizeLimitBytes + " bytes), please choose a file with a smaller size");
    } else mppChatSend(error + " MIDI file not found");
    uploadButton.value = ""; // reset file input
};

// Creates the drag & drop area, and the following buttons: open, pause, stop, resume, repeat, sustain, song, & public
let createWebpageElements = function () {
    // need to create an element that only shows up when dragging midi files into the window
    let modelElement = document.getElementById("modal");
    let zIndexTop = parseInt(getComputedStyle(modelElement).zIndex) + 1;
    let dragAndDropMIDI = document.createElement("div");
    dragAndDropMIDI.id = PRE_ELEMENT_ID + "-dragAndDropMIDI";
    dragAndDropMIDI.style = `position: absolute; width: 100%; height: 100%; top: 0; display: none; place-items: center center; font-size: 2.2vw; color: white; background: rgba(0,0,0,0.75); z-index: ${zIndexTop}`;
    dragAndDropMIDI.innerText = "Drop MIDI file here to start playing";
    document.addEventListener(
        "dragenter",
        (e) => {
            if (debouncer === 0) { if (dragAndDropMIDI.style.display != "grid") dragAndDropMIDI.style.display = "grid" }
            debouncer++;
        },
        false
    );

    document.addEventListener(
        "dragleave",
        (e) => {
            debouncer--;
            if (debouncer === 0) { if (dragAndDropMIDI.style.display != "none") dragAndDropMIDI.style.display = "none" }
        },
        false
    );

    document.addEventListener(
        "dragover",
        (e) => {
            e.preventDefault();
        },
        false
    );
    document.addEventListener(
        "drop",
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            debouncer = 0;
            if (dragAndDropMIDI.style.display != "none") dragAndDropMIDI.style.display = "none";
            let draggedData = e.dataTransfer;
            let droppedFiles = draggedData.files;
            let oneOrMoreFilesInvalid = false;
            Array.prototype.forEach.call(droppedFiles, function (file) {
                if (!file.type || !isMidi(file)) oneOrMoreFilesInvalid = true;
            });
            if (oneOrMoreFilesInvalid) {
                let error = PRE_ERROR + " (play)";
                if (droppedFiles.length > 1) {
                    mppChatSend(error + " One or more files choosen aren't MIDI");
                } else {
                    let songFileName = (droppedFiles[0]).name.split(/(\\|\/)/g).pop();
                    mppChatSend(error + " The file choosen, \"" + songFileName + "\", is either corrupted, or it's not really a MIDI file");
                }
            }
            else playFile(droppedFiles);
        },
        false
    );
    document.body.prepend(dragAndDropMIDI);

    // initialize button(s)
    let buttonContainer = mppDynamicButtons || document.querySelector("#bottom div");

    // need the first button to setup upload button style correctly
    let buttonStyle = window.getComputedStyle(document.querySelector('.ugly-button'));
    let buttonPadding = parseInt(buttonStyle.padding); // px
    let buttonWidth = `calc(100% + ${buttonPadding*2}px)`;
    let buttonHeight = `calc(100% + ${buttonPadding*2}px)`;
    let buttonTop = `${-buttonPadding}px`;
    let buttonLeft = buttonTop;
    let buttonBorderRadius = parseInt(buttonStyle.borderRadius) + 1;

    // button to toggle the visibility of the other buttons
    let buttonsOn = false;
    let togglerDiv = document.createElement("div");
    togglerDiv.title = 'Use `' + PREFIX + 'help` for more commands'
    togglerDiv.id = TOGGLER_ELEMENT_ID;
    togglerDiv.classList.add("ugly-button");
    togglerDiv.onclick = function () {
        if (buttonsOn) { // if on, then turn off, else turn on
            openDiv.style.display =
                stopDiv.style.display =
                repeatDiv.style.display =
                songDiv.style.display =
                pauseDiv.style.display =
                resumeDiv.style.display =
                sustainDiv.style.display =
                publicDiv.style.display = "none";
            buttonsOn = false;
        } else {
            openDiv.style.display =
                stopDiv.style.display =
                repeatDiv.style.display =
                songDiv.style.display =
                pauseDiv.style.display =
                resumeDiv.style.display =
                sustainDiv.style.display =
                publicDiv.style.display = "block";
            buttonsOn = true;
        }
    }
    let togglerTxt = document.createTextNode(MOD_DISPLAYNAME);
    togglerDiv.appendChild(togglerTxt);
    buttonContainer.appendChild(togglerDiv);

    // OPEN
    // has special elements needed to work button positioning
    let openDiv = document.createElement("div");
    openDiv.id = PRE_ELEMENT_ID + "-open";
    openDiv.classList.add("ugly-button");
    buttonContainer.appendChild(openDiv);
    // inner div required to position elements inside of it
    let openInnerDiv = document.createElement("div");
    openInnerDiv.style = "position:relative;";
    openDiv.appendChild(openInnerDiv);
    // need the text to appear as would normally
    let openSpan = document.createElement("span");
    openSpan.innerHTML = "Open"
    openInnerDiv.appendChild(openSpan);
    // since we need to upload files, it needs to be infront of the span element to work properly
    let uploadBtn = document.createElement("input");
    let uploadBtnId = PRE_ELEMENT_ID + "-upload";
    uploadBtn.id = uploadBtnId;
    uploadBtn.style = "opacity:0;filter:alpha(opacity=0);position:absolute;top:" + buttonTop + ";left:" + buttonLeft + ";width:" + buttonWidth + ";height:" + buttonHeight + ";border-radius:" + buttonBorderRadius + "px;-webkit-border-radius:" + buttonBorderRadius + "px;-moz-border-radius:" + buttonBorderRadius + "px;";
    uploadBtn.title = " "; // removes the "No file choosen" tooltip
    uploadBtn.type = "file";
    uploadBtn.accept = ".mid,.midi";
    uploadBtn.onchange = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;
        
        if ((MPP.currentRoom).authorized) {
            if (uploadBtn.files.length > 0) playFile(uploadBtn.files);
            else console.log("No MIDI file selected");
        } else requestConsent(yourId);
    }
    // fix cursor on upload file button
    let head = document.getElementsByTagName('HEAD')[0];
    let uploadFileBtnFix = this.document.createElement('link');
    uploadFileBtnFix.setAttribute('rel', 'stylesheet');
    uploadFileBtnFix.setAttribute('type', 'text/css');
    uploadFileBtnFix.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent('#' + uploadBtnId + ", #" + uploadBtnId + "::-webkit-file-upload-button {cursor:pointer}"));
    head.appendChild(uploadFileBtnFix);
    openInnerDiv.appendChild(uploadBtn);
    // then we need to let the rest of the script know it so it can reset it after loading files
    uploadButton = uploadBtn;
    // STOP
    let stopDiv = document.createElement("div");
    stopDiv.id = PRE_ELEMENT_ID + "-stop";
    stopDiv.classList.add("ugly-button");
    stopDiv.onclick = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) stop();
        else requestConsent(yourId);
    }
    let stopTxt = document.createTextNode("Stop");
    stopDiv.appendChild(stopTxt);
    buttonContainer.appendChild(stopDiv);
    // REPEAT
    let repeatDiv = document.createElement("div");
    repeatDiv.id = PRE_ELEMENT_ID + "-repeat";
    repeatDiv.classList.add("ugly-button");
    repeatDiv.onclick = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) repeat();
        else requestConsent(yourId);
    }
    let repeatTxt = document.createTextNode("Repeat");
    repeatDiv.appendChild(repeatTxt);
    buttonContainer.appendChild(repeatDiv);
    // SONG
    let songDiv = document.createElement("div");
    songDiv.id = PRE_ELEMENT_ID + "-song";
    songDiv.classList.add("ugly-button");
    songDiv.onclick = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) song();
        else requestConsent(yourId);
    }
    let songTxt = document.createTextNode("Song");
    songDiv.appendChild(songTxt);
    buttonContainer.appendChild(songDiv);
    // PAUSE
    let pauseDiv = document.createElement("div");
    pauseDiv.id = PRE_ELEMENT_ID + "-pause";
    pauseDiv.classList.add("ugly-button");
    pauseDiv.onclick = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) pause();
        else requestConsent(yourId);
    }
    let pauseTxt = document.createTextNode("Pause");
    pauseDiv.appendChild(pauseTxt);
    buttonContainer.appendChild(pauseDiv);
    // RESUME
    let resumeDiv = document.createElement("div");
    resumeDiv.id = PRE_ELEMENT_ID + "-resume";
    resumeDiv.classList.add("ugly-button");
    resumeDiv.onclick = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) resume();
        else requestConsent(yourId);
    }
    let resumeTxt = document.createTextNode("Resume");
    resumeDiv.appendChild(resumeTxt);
    buttonContainer.appendChild(resumeDiv);
    // SUSTAIN
    let sustainDiv = document.createElement("div");
    sustainDiv.id = PRE_ELEMENT_ID + "-sustain";
    sustainDiv.classList.add("ugly-button");
    sustainDiv.onclick = function () {
        if (MPP.client.preventsPlaying()) return;

        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) sustain();
        else requestConsent(yourId);
    }
    let sustainTxt = document.createTextNode("Sustain");
    sustainDiv.appendChild(sustainTxt);
    buttonContainer.appendChild(sustainDiv);
    // PUBLIC
    let publicDiv = document.createElement("div");
    publicDiv.id = PRE_ELEMENT_ID + '-public';
    publicDiv.classList.add("ugly-button");
    publicDiv.onclick = function () {
        let yourParticipant = MPP.client.getOwnParticipant();
        let yourId = yourParticipant._id;

        if ((MPP.currentRoom).authorized) publicCommands(true, true);
        else requestConsent(yourId);
    }
    let publicTxt = document.createTextNode("Public");
    publicDiv.appendChild(publicTxt);
    buttonContainer.appendChild(publicDiv);

    // update button(s) with position information if dynamic buttons placement isn't available
    if (!exists(mppDynamicButtons)) {
        // bottom area is used to place and update the buttons manually

        // we need to keep track of the next button locations
        let nextLocationX = 1;
        let nextLocationY = 0;

        // need to initialize CSS variables: DISPLACEMENT & INITIAL for X and Y
        document.documentElement.style.setProperty(CSS_VARIABLE_X_DISPLACEMENT, "0px");
        document.documentElement.style.setProperty(CSS_VARIABLE_Y_DISPLACEMENT, "0px");
        document.documentElement.style.setProperty(CSS_VARIABLE_X_INITIAL, "0px");
        document.documentElement.style.setProperty(CSS_VARIABLE_Y_INITIAL, "0px");
        document.documentElement.style.setProperty(CSS_VARIABLE_Y_TOGGLE_INITIAL, "0px");
        
        // OPEN
        openDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // STOP
        nextLocationX++;
        stopDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // REPEAT
        nextLocationX++;
        repeatDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // SONG
        nextLocationX++;
        songDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // PAUSE
        nextLocationX = 1;
        nextLocationY++;
        pauseDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // RESUME
        nextLocationX++;
        resumeDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // SUSTAIN
        nextLocationX++;
        sustainDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        // PUBLIC
        nextLocationX++;
        publicDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
        
        // one more button to toggle the visibility of the other buttons
        nextLocationX = 0;
        nextLocationY = 0;
        togglerDiv.style = ELEM_POS + ELEM_ON + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_TOGGLE_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    }
};

// Shows room owner consent message for room to see
let requestConsent = function(yourId) {
    // displays message with mod owner ID so that the room owner can act upon it
    let roomOwnerId = mppGetRoomOwnerId();
    let roomOwner = exists(roomOwnerId) ? MPP.client.ppl[roomOwnerId] : null;
    let roomOwnerNameExists = exists(roomOwner) && exists(roomOwner.name) && roomOwner.name;
    let unknownRoomOwner = 'the room owner';
    roomOwnerName = roomOwnerNameExists ? ('`' + roomOwner.name + '`') : unknownRoomOwner;
    let preRequestConsent = PRE_CONSENT + ' ' + (roomOwnerName[0].toUpperCase() + roomOwnerName.substring(1))
                            + (roomOwnerNameExists ? (', ' + unknownRoomOwner + ',') : '') + ' hasn\'t given this user (ID = `'
                            + yourId + '`) consent to use the ' + MOD_DISPLAYNAME + " mod in this room."
    mppChatSend(preRequestConsent);
};

// When there is an incorrect command, show this error
let cmdNotFound = function (cmd) {
    let error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (publicOption) mppChatSend(error);
    else console.log(error);
};

// Commands
let help = function (command, userId, yourId) {
    let roomOwnerId = mppGetRoomOwnerId();
    let isRoomOwner = exists(roomOwnerId) && (userId == roomOwnerId);
    let isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        let publicCommands = formattedCommands(MOD_COMMANDS, PREFIX, true);
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, PREFIX, true)
                    + (publicOption ? ', ' + publicCommands : '')
                    + (userId == yourId ? " | Mod Owner Commands: " + (publicOption ? '' : publicCommands + ', ')
                                          + formattedCommands(MOD_OWNER_COMMANDS, PREFIX, true) : '')
                    + (isRoomOwner ? " | Room Owner Commands: " + formattedCommands(ROOM_OWNER_COMMANDS, PREFIX, true) : ''));
    } else {
        let valid = null;
        let commandIndex = null;
        let commandArray = null;
        command = command.toLowerCase();
        // check commands arrays
        for (let i = 0; i < BASE_COMMANDS.length; i++) {
            if (BASE_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BASE_COMMANDS;
                commandIndex = i;
            }
        }
        for (let j = 0; j < MOD_COMMANDS.length; j++) {
            if (MOD_COMMANDS[j][0].indexOf(command) == 0) {
                valid = command;
                commandArray = MOD_COMMANDS;
                commandIndex = j;
            }
        }
        for (let k = 0; k < MOD_OWNER_COMMANDS.length; k++) {
            if (MOD_OWNER_COMMANDS[k][0].indexOf(command) == 0) {
                valid = command;
                commandArray = MOD_OWNER_COMMANDS;
                commandIndex = k;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(commandArray, commandIndex),);
        else cmdNotFound(command);
    }
};
let consent = function (argsUserId, yourId) {
    if (exists(argsUserId) && argsUserId) {
        // test if input matches mod user
        if (argsUserId == yourId) {
            // toggle consent
            let preConsentMsg = PRE_CONSENT + " This user's " + MOD_DISPLAYNAME + " mod is now ";
            let postConsentMsg = "abled to run in this room.";
            mppChatSend(preConsentMsg + ((MPP.currentRoom).authorized ? 'en' : 'dis') + postConsentMsg);
            (MPP.currentRoom).authorized = !((MPP.currentRoom).authorized)
        } else mppChatSend(PRE_ERROR + ' (consent) user ID entered doesn\'t match this mod owner\'s user ID (`' + yourId + '`).');
    } else mppChatSend(PRE_ERROR + " (consent) no user ID was entered.");
};
let about = function () {
    mppChatSend(PRE_ABOUT + ' ' + MOD_DESCRIPTION + ' ' + MOD_AUTHOR + ' ' + MOD_NAMESPACE);
};
let link = function () {
    mppChatSend(PRE_LINK + " You can get this mod from " + SUPPORT_URL);
};
let feedback = function () {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
};
let ping = function () {
    // get a response back in milliseconds
    pinging = true;
    pingTime = Date.now();
    mppChatSend(PRE_PING);
};
let play = function (url) {
    let error = PRE_ERROR + " (play)";
    // URL needs to be entered to play a song
    if (!exists(url) || url == "") {
        stopLoadingMusic();
        mppChatSend(error + " No MIDI url entered... " + WHERE_TO_FIND_MIDIS);
    } else {
        // make sure we are not at the root of a website
        let testURL = (url.startsWith('http://') || url.startsWith('https://')) ? url : (url.indexOf('://') == -1 ? null : ('http://' + url));
        let testURI = testURL ? new URL(testURL) : null;
        if (testURI) {
            // downloads file if possible and then plays it if it's a MIDI
            urlToBlob(url, function (blob) {
                if (blob instanceof Error && blob.message == "The user aborted a request.") {
                    mppChatSend(PRE_MSG + ' ' + ABORTED_DOWNLOAD)
                } else if (blob == null) mppChatSend(error + " Invalid URL, this is not a MIDI file, or the file requires a manual download from " + quoteString(' ' + url + ' ') + "... " + WHERE_TO_FIND_MIDIS);
                else if (isMidi(blob) || isOctetStream(blob)) {
                    // if there is a remote filename, use it instead
                    getContentDispositionFilename(url, blob, function (blobFile, remoteFileName) {
                        // needs to be ran a second time to be sure there's no redirects to the file
                        getContentDispositionFilename(remoteFileName, blob, function (blobFileFinal, remoteFileNameFinal) {
                            let urlFinal = remoteFileName;
                            if (!remoteFileNameFinal) {
                                remoteFileNameFinal = remoteFileName;
                                urlFinal = url;
                            }
                            // check and limit file size, mainly to prevent browser tab crashing (not enough RAM to load) and deter black midi
                            if (blobFileFinal.size <= fileSizeLimitBytes) {
                                fileOrBlobToBase64(blobFileFinal, function (base64data) {
                                    // play song only if we got data
                                    if (exists(base64data)) {
                                        if (isOctetStream(blobFileFinal)) { // when download with CORS, need to replace mimetype, but it doesn't guarantee it's a MIDI file
                                            base64data = base64data.replace("application/octet-stream", "audio/midi");
                                        }
                                        if (remoteFileNameFinal) playSong(remoteFileNameFinal, base64data);
                                        else playURL(urlFinal, base64data);
                                    } else mppChatSend(error + " Unexpected result, MIDI file couldn't load... " + WHERE_TO_FIND_MIDIS);
                                });
                            } else {
                                mppChatSend(error + " The file choosen, \"" + (remoteFileNameFinal ? remoteFileNameFinal : decodeURIComponent(urlFinal.substring(urlFinal.lastIndexOf('/') + 1))) + "\",  is too big (larger than the limit of " + fileSizeLimitBytes + " bytes), please choose a file with a smaller size");
                            }
                        });
                    });
                } else mppChatSend(error + " Invalid URL, this is not a MIDI file... " + WHERE_TO_FIND_MIDIS);
            });
        } else mppChatSend(error + " Invalid URL, must be a web link to a file... " + WHERE_TO_FIND_MIDIS);
    }
};
let stop = function () {
    if (downloading) {
        // stops the current download
        fetchAbortController.abort();
    } else if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        // stops the current song
        let tempSongName = currentSongName;
        stopSong(true);
        mppChatSend(PRE_MSG + ' `' + BAR_STOPPED + '` ' + BAR_ARROW_RIGHT + ' `' + tempSongName + '`');
    }
};
let pause = function (exceedsNoteQuota) {
    // pauses the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        let title = PRE_MSG + ' `';
        if (paused) title += BAR_STILL_PAUSED;
        else {
            Player.pause();
            playerPause();
            stopSong();
            title += BAR_PAUSED;
        }
        let reason = exceedsNoteQuota ? ' Reason: Note quota was drained.' : '';
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`' + reason);
    }
};
let resume = function () {
    // resumes the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        let title = PRE_MSG + ' `';
        if (paused) {
            // must turn back to original sustain state if needed
            if (sustainState.turnBackOn) {
                MPP.pressSustain();
                sustainState.on = true;
                sustainState.turnBackOn = false;
            }
            // then we can continue playing
            Player.play();
            playerPlay();
            title += BAR_RESUMED;
        } else title += BAR_STILL_RESUMED;
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
    }
};
let song = function () {
    // shows current song playing
    if (exists(currentSongName) && currentSongName != "") {
        let title = PRE_MSG + ' `' + (paused ? BAR_PAUSED : BAR_PLAYING);
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
    } else mppChatSend(PRE_MSG + ' ' + NO_SONG);
};
let repeat = function () {
    // turns on or off repeat
    repeatOption = !repeatOption;

    mppChatSend(PRE_SETTINGS + " Repeat set to " + (repeatOption ? "" : "not") + " repeating");
};
let sustain = function () {
    // turns on or off sustain
    sustainOption = !sustainOption;

    mppChatSend(PRE_SETTINGS + " Sustain set to " + (sustainOption ? "MIDI controlled" : "MPP controlled"));
};
let percussion = function () {
    // turns on or off percussion instruments
    percussionOption = !percussionOption;

    mppChatSend(PRE_SETTINGS + ' ' + (percussionOption ? "En" : "Dis") + "abled percussion instruments");
};
let loading = function (userId, yourId) {
    // only let the mod owner set if loading music should be on or not
    if (userId != yourId) return;
    loadingOption = !loadingOption;
    mppChatSend(PRE_SETTINGS + " The MIDI loading progress is now set to " + (loadingOption ? "audio" : "text"));
};
let publicCommands = function (userId, yourId) {
    // only let the mod owner set if public mod commands should be on or not
    if (userId != yourId) return;
    publicOption = !publicOption;
    mppChatSend(PRE_SETTINGS + " Public mod commands were turned " + (publicOption ? "on" : "off"));
};
let mppGetRoomId = function () {
    if (MPP && MPP.client && MPP.client.channel && MPP.client.channel._id) {
        return MPP.client.channel._id;
    } else if (MPP && MPP.client && MPP.client.desiredChannelId) {
        return MPP.client.desiredChannelId;
    } else return null;
};
let mppGetRoomOwnerId = function() {
    if (MPP && MPP.client && MPP.client.channel && MPP.client.channel.crown && MPP.client.channel.crown.userId) {
        return MPP.client.channel.crown.userId;
    } else return null;
};

// =============================================== MAIN

// bug fix: see https://github.com/grimmdude/MidiPlayerJS/issues/25
Player.sampleRate = 0; // 1 ms is official MIDI spec, but can cause EOF to not be triggered, so set to 0 instead

Player.on('fileLoaded', function () {
    // Do something when file is loaded
    stopLoadingMusic();
});

Player.on('playing', function (currentTick) {
    // Do something while player is playing
    // (this is repeatedly triggered within the play loop)
    currentSongEventsPlayed = Player.eventsPlayed();
    if (paused || stopped) return;
    if (MPP.client.preventsPlaying()) pause();
});

Player.on('midiEvent', function (event) {
    // Do something when a MIDI event is fired.
    // (this is the same as passing a function to MidiPlayer.Player() when instantiating.

    // disable percussion instrument channels
    if (!percussionOption &&
        (event.channel == PERCUSSION_CHANNELS[0] /*|| event.channel == PERCUSSION_CHANNELS[1]*/)) return;

    // check event for note on/off and controller changes (sustain)
    let currentEvent = event.name;
    let currentNote = exists(event.noteNumber) &&
        (event.noteNumber >= 21) && (event.noteNumber <= 108)
        ? event.noteNumber : null;
    let noteIndex = currentNote ? (currentNote - 21) : -1;
    if (currentEvent == "Note on" && event.velocity) {
        // Note on
        //if (event.velocity >= 85) { // DEBLACKER NOTE: need to implement a slider for this
        // attempt at deblackening
        MPP.press(mppPianoNotes[noteIndex], event.velocity / 127);
        //}
        mppNoteBank[currentNote]++;
    } else if (currentEvent == "Note off" || (currentEvent == "Note on" && !event.velocity)) {
        // Note off
        if (sustainOption) {
            // only if the note bank shows we have 1 or less, should we release a key
            if (mppNoteBank[currentNote] <= 1) MPP.release(mppPianoNotes[noteIndex]);
        }
        mppNoteBank[currentNote]--;
    } else if (currentEvent == "Controller Change") {
        // Controller Change (CC)
        if (sustainOption) {
            if (event.noteNumber == 64) {
                // CC - Sustain
                if (event.velocity >= 64) {
                    MPP.pressSustain();
                } else {
                    MPP.releaseSustain();
                }
            } else if (event.noteNumber == 121) {
                // CC - Reset All Controllers
                MPP.releaseSustain();
            }
        }
    } // pitch bends don't need to be accounted for in midi files
});

Player.on('endOfFile', function () {
    // Do something when end of the file has been reached.
    ended = true;

    // do repeat
    if (repeatOption && !stopped && exists(currentSongName) && exists(currentSongData)) {
        // nice delay before playing song again
        setTimeout(function () { playSong(currentSongName, currentSongData) }, REPEAT_DELAY);
    }
    // stop
    else playerStop();
});

MPP.client.on('a', function (msg) { // on: new message
    // if user switches to VPN, these need to update
    let yourParticipant = MPP.client.getOwnParticipant();
    let yourId = yourParticipant._id;
    let yourUsername = yourParticipant.name;
    // get the message as string
    let input = msg.a.trim();
    let participant = msg.p;
    let username = participant.name;
    let userId = participant._id;

    // check if ping
    if (userId == yourId && pinging && input == PRE_PING) {
        pinging = false;
        pingTime = Date.now() - pingTime;
        mppChatSend(PRE_MSG + ' ' + pingTime + "ms", chatDelay);
    }

    // make sure the start of the input matches prefix
    if (input.startsWith(PREFIX)) {
        // evaluate input into command and possible arguments
        let message = input.substring(PREFIX_LENGTH).trim();
        let hasArgs = message.indexOf(' ');
        let command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        let argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1).trim() : null;
        // look through commands
        let roomOwnerId = mppGetRoomOwnerId();
        let isRoomOwner = exists(roomOwnerId) && (userId == roomOwnerId);
        let isModOwner = userId == yourId;
        let preventsPlaying = MPP.client.preventsPlaying();
        switch (command.toLowerCase()) {
            case "help": case "h": if (isRoomOwner || isModOwner || publicOption) help(argumentsString, userId, yourId); break;
            case "consent": case "c": if (isRoomOwner) consent(argumentsString); break;
            case "about": case "ab": if (isModOwner || publicOption) about(); break;
            case "link": case "li": if (isModOwner || publicOption) link(); break;
            case "feedback": case "fb": if (isModOwner || publicOption) feedback(); break;
            case "ping": case "pi": if (isModOwner || publicOption) ping(); break;
            case "play": case "p": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { play(argumentsString) } else { requestConsent(yourId) }
            }; break;
            case "stop": case "s": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { stop() } else { requestConsent(yourId) }
            }; break;
            case "pause": case "pa": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { pause() } else { requestConsent(yourId) }
            }; break;
            case "resume": case "r": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { resume() } else { requestConsent(yourId) }
            }; break;
            case "song": case "so": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { song() } else { requestConsent(yourId) }
            }; break;
            case "repeat": case "re": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { repeat() } else { requestConsent(yourId) }
            }; break;
            case "sustain": case "ss": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { sustain() } else { requestConsent(yourId) }
            }; break;
            case "percussion": case "pe": if ((isModOwner || publicOption) && !preventsPlaying) {
                if ((MPP.currentRoom).authorized) { percussion() } else { requestConsent(yourId) }
            }; break;
            case "loading": case "lo": if ((MPP.currentRoom).authorized) { loading(userId, yourId) } else { requestConsent(yourId) }; break;
            case "public": if ((MPP.currentRoom).authorized) { publicCommands(userId, yourId) } else { requestConsent(yourId) }; break;
        }
    }
});
MPP.client.on('ch', function (msg) { // on: room change
    // update current room info
    let newRoomId = mppGetRoomId();
    let roomHasOwner = exists((msg.ch).crown);
    if ((MPP.currentRoom).id != newRoomId) {
        (MPP.currentRoom).id = newRoomId;
        // changes are made to permissions or current song based on ownership of the new room
        if (MPP.client.isOwner() || !roomHasOwner) {
            (MPP.currentRoom).authorized = true;
        } else {
            (MPP.currentRoom).authorized = false;
            // stop any songs that might have been playing before changing rooms
            if (!ended) stopSong(true);
        }
    }
});
MPP.client.on('nq', function (msg) { // on: note quota change
    // changes to note quota also reflect changes to room ownership or switching

    // set new chat delay
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
});
/* MPP.client.on('p', function (msg) { // on: player joins room
    let userId = msg._id;
}); */

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. repeat)
let repeatingTasks = setInterval(function () {
    if (MPP.client.preventsPlaying()) return;
    // what to do while a song is playing
    if (!ended && exists(currentSongName) && currentSongName != "") {
        // display song progression status and end/done status
        let tempCurrentSongProgress = getElapsedProgressInt(PROGRESS_BAR_BLOCK_SIZE, currentSongEventsPlayed, currentSongTotalEvents);
        if (tempCurrentSongProgress != currentSongProgress) {
            currentSongProgress = tempCurrentSongProgress;
            if (currentSongProgress >= 0 && currentSongProgress <= PROGRESS_BAR_BLOCK_SIZE) {
                if (elapsingProgressNotification) {
                    elapsingProgressNotification.close();
                    elapsingProgressNotification = null;
                }
                let textColor = (MPP.client.user && MPP.client.user.color) ? MPP.client.user.color : '#0F0'; // fall back color just in case
                let textStyle = 'style="color: ' + textColor + ' !important"'
                let barProgress = getElapsingProgress(PROGRESS_BAR_BLOCK_SIZE, currentSongEventsPlayed, currentSongTotalEvents);
                let elapsingProgressNotificationSetup = {
                    html: '<div class="title" style="display: block !important">' +
                        '<code class="markdown">「<span ' + textStyle + '>' + barProgress + '</span>」</code><span>  </span>' +
                        '</div>' +
                        '<div class="text">' +
                        'File: <code class="markdown" ' + textStyle + '>' + currentSongName + '</code>' +
                        '</div>',
                    duration: -1,
                    class: 'short'
                };
                elapsingProgressNotification = mppNotificationSend(elapsingProgressNotificationSetup);
            }
        }
        // pause if exceeds noteQuota
        if (!paused && exists(MPP.noteQuota) && exists(MPP.noteQuota.history) && !MPP.noteQuota.history[0]) {
            pause(true);
        }
    }
    if (finishedSongName) {
        if (elapsingProgressNotification) {
            elapsingProgressNotification.close();
            elapsingProgressNotification = null;
        }
        mppChatSend(PRE_MSG + ' `' + BAR_DONE_PLAYING + '` ' + BAR_ARROW_RIGHT + ' `' + finishedSongName + '`');
        finishedSongName = null;
    }
}, 1);
let dynamicButtonDisplacement = setInterval(function () {
    // don't need when website supports this automatically
    if (mppDynamicButtons) {
        clearInterval(dynamicButtonDisplacement);
        return;
    }

    // required when other ugly-button's change visibility
    let allUglyBtns = [];
    [...document.querySelectorAll(QUERY_BOTTOM_UGLY_BTNS)].forEach(uglyBtn => {
        if (uglyBtn.offsetWidth > 0 || uglyBtn.offsetHeight > 0 || uglyBtn.getClientRects().length > 0) allUglyBtns.push(uglyBtn);
    });
    if (!allUglyBtns || !allUglyBtns.length) {
        // no buttons found, can't do anything yet
        return;
    }
    let topOffset = allUglyBtns[0].offsetTop;
    let bottomOffset = allUglyBtns[0].offsetTop;
    let moddedTopOffset = allUglyBtns[0].offsetTop;
    let moddedBottomOffset = allUglyBtns[0].offsetTop;
    for (let i = 1; i < allUglyBtns.length; i++) {
        let uglyBtn = allUglyBtns[i];
        // must factor that modded buttons might be added
        if (!uglyBtn.style.position) {
            if (uglyBtn.offsetTop > bottomOffset) bottomOffset = uglyBtn.offsetTop;
            else if (uglyBtn.offsetTop < topOffset) topOffset = uglyBtn.offsetTop;
        }
        if (uglyBtn.offsetTop > bottomOffset) moddedBottomOffset = uglyBtn.offsetTop;
        else if (uglyBtn.offsetTop < topOffset) moddedTopOffset = uglyBtn.offsetTop;
    }
    let topUglyBtns = [];
    let bottomUglyBtns = [];
    let allTopUglyBtns = [];
    let allBottomUglyBtns = [];
    allUglyBtns.forEach(uglyBtn => {
        if (uglyBtn.offsetTop == topOffset) topUglyBtns.push(uglyBtn);
        if (uglyBtn.offsetTop == bottomOffset) bottomUglyBtns.push(uglyBtn);
        // for if we have modded in buttons e.g. from a clone website
        if (uglyBtn.offsetTop == topOffset || uglyBtn.offsetTop == topOffset) allTopUglyBtns.push(uglyBtn);
        if (uglyBtn.offsetTop == bottomOffset || uglyBtn.offsetTop == bottomOffset) allBottomUglyBtns.push(uglyBtn);
    });
    // find top and bottom buttons furthest to the right (that are visible)
    let topRightMostBtn = allTopUglyBtns.reduce((prev, current) => (prev.offsetLeft > current.offsetLeft) ? prev : current);
    let bottomRightMostBtn = allBottomUglyBtns.reduce((prev, current) => (prev.offsetLeft > current.offsetLeft) ? prev : current);
    // determine from buttons which one is farthest right
    let rightMostBtn = topRightMostBtn;
    if (topRightMostBtn.offsetLeft < bottomRightMostBtn.offsetLeft) rightMostBtn = bottomRightMostBtn;
    // need to find displacements after
    let displacement = {
        x: allUglyBtns[1].offsetLeft - allUglyBtns[0].offsetLeft,
        y: bottomOffset - topOffset
    };
    // then we can finally generate initial placements
    let initial = {
        x: (topRightMostBtn.offsetLeft == bottomRightMostBtn.offsetLeft) ? rightMostBtn.offsetLeft + displacement.x : rightMostBtn.offsetLeft,
        y: topOffset
    };
    // toggle button has a special case as to fit between pre existing buttons
    let toggleInitialY = initial.y + ((topRightMostBtn.offsetLeft > bottomRightMostBtn.offsetLeft) ? displacement.y : 0);
    // set CSS displacement values and initial locations
    document.documentElement.style.setProperty(CSS_VARIABLE_X_DISPLACEMENT, displacement.x + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_DISPLACEMENT, displacement.y + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_X_INITIAL, initial.x + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_INITIAL, initial.y + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_TOGGLE_INITIAL, toggleInitialY + "px");
}, TENTH_OF_SECOND);
let slowRepeatingTasks = setInterval(function () {
    // do background tab fix
    if (!pageVisible) {
        let note = MPP.piano.keys["a-1"].note;
        let participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SLOW_DELAY);

// Automatically turns off the sound warning (mainly for autoplay)
let triedClickingPlayButton = false;
let playButtonMaxAttempts = 10; // it'll try to find the button this many times, before continuing anyways
let playButtonCheckCounter = 0;
let clearSoundWarning = setInterval(function () {
    let playButton = document.querySelector('#motd > button[i18next-orgval-0="PLAY"]') || document.querySelector("#sound-warning button");
    let playButtonStyle = exists(playButton) ? window.getComputedStyle(playButton) : null;
    let playButtonClickable = exists(playButtonStyle) ? (
        // confirming the play button is clickable is just a little harder in newer MPP versions
        playButtonStyle.display == "block" && playButtonStyle.height != "auto"
    ) : false;
    if (playButtonClickable || playButtonCheckCounter >= playButtonMaxAttempts) {
        clearInterval(clearSoundWarning);

        // only turn off sound warning if it hasn't already been turned off
        if (exists(playButton)) {
            if (playButtonStyle.display == "block" && playButtonStyle.opacity == "1") {
                playButton.click();
                setTimeout(function () {
                    // delay by a little bit to let click register
                    triedClickingPlayButton = true;
                }, HALF_SECOND);
            }
        }
    } else playButtonCheckCounter++;
}, 250);

// wait for the client to come online, and piano keys to be fully loaded
let waitForMPP = setInterval(function () {
    let MPP_Fully_Loaded = exists(MPP) && exists(MPP.client) && exists(MPP.piano) && exists(MPP.piano.keys);
    if (MPP_Fully_Loaded && mppGetRoomId() && triedClickingPlayButton) {
        clearInterval(waitForMPP);

        // initialize mod settings and elements
        mppDynamicButtons = document.querySelector(MPP_DYNAMIC_BUTTONS_SELECTOR);
        (MPP.currentRoom).id = mppGetRoomId();
        // attempt to create the Notification API, if it doesn't already exist
        if (!exists(MPP.Notification)) {
            // 2023-07-02T06:45:05Z - code modified via https://github.com/LapisHusky/mppclone/blob/main/client/script.js
            MPP.Notification = function (t) { if (this instanceof MPP.Notification == !1) throw "yeet"; EventEmitter.call(this); t = t || {}; this.id = "Notification-" + (t.id || Math.random()), this.title = t.title || "", this.text = t.text || "", this.html = t.html || "", this.target = $(t.target || "#piano"), this.duration = t.duration || 3e4, this.class = t.class || "classic"; var i = this, e = $("#" + this.id); return e.length > 0 && e.remove(), this.domElement = $('<div class="notification"><div class="notification-body"><div class="title"></div><div class="text"></div></div><div class="x">X</div></div>'), this.domElement[0].id = this.id, this.domElement.addClass(this.class), this.domElement.find(".title").text(this.title), this.text.length > 0 ? this.domElement.find(".text").text(this.text) : this.html instanceof HTMLElement ? this.domElement.find(".text")[0].appendChild(this.html) : this.html.length > 0 && this.domElement.find(".text").html(this.html), document.body.appendChild(this.domElement.get(0)), this.position(), this.onresize = function () { i.position() }, window.addEventListener("resize", this.onresize), this.domElement.find(".x").click((function () { i.close() })), this.duration > 0 && setTimeout((function () { i.close() }), this.duration), this }, mixin(MPP.Notification.prototype, EventEmitter.prototype), MPP.Notification.prototype.constructor = MPP.Notification, MPP.Notification.prototype.position = function () { var t = this.target.offset(), i = t.left - this.domElement.width() / 2 + this.target.width() / 4, e = t.top - this.domElement.height() - 8, o = this.domElement.width(); i + o > $("body").width() && (i -= i + o - $("body").width()), i < 0 && (i = 0), this.domElement.offset({ left: i, top: e }) }, MPP.Notification.prototype.close = function () { var t = this; window.removeEventListener("resize", this.onresize), this.domElement.fadeOut(500, (function () { t.domElement.remove(), t.emit("close") })) };
        }
        // let user know if they won't be able to see notifications
        if (!exists(MPP.Notification)) {
            mppChatSend(PRE_MSG + " This version of Multiplayer Piano doesn't support notifications, please check console for the notification.");
        }
        // setup midi player needs
        mppPianoNotes = Object.keys(MPP.piano.keys);
        mppNoteBank = Array.apply(null, Array(mppPianoNotes.length)).map(function () { return 0 });
        // won't work right if press/release sustain keys aren't available
        let compatitbilityError = '';
        if (!exists(MPP.pressSustain) && !exists(MPP.releaseSustain)) {
            compatitbilityError = "Looks like this version of Multiplayer Piano is incompatible with this mod.<br>" +
                "Things likely won't work as expected!<br>" +
                "Ask the website owner if they can update their version of Multiplayer Piano.<br><br>";
        }
        // create any buttons or other web page elements for mod
        createWebpageElements();
        console.log(PRE_MSG + " Online!");

        // notice for those using the AD riddled website
        let mppnetOfficialMain = "multiplayerpiano.net";
        let mppnetOfficialMirror = "www.multiplayerpiano.org";
        let mppAdsWebsite = "multiplayerpiano.com";
        let mppAdsWebsiteNotice = '';
        if (window.location.hostname == mppAdsWebsite) {
            mppAdsWebsiteNotice = "It looks like you're on `" + mppAdsWebsite + "`, please consider switching over to one of the official, AD-free websites below:<br>" +
                ` ${LIST_BULLET} <a href="https://${mppnetOfficialMain}/">${mppnetOfficialMain}</a> (main website)<br>` +
                ` ${LIST_BULLET} <a href="https://${mppnetOfficialMirror}/">${mppnetOfficialMirror}</a> (mirror website)<br><br>`;
        }

        // check if there's an update available
        let latestVersionFound = setInterval(function () {
            if (latestVersion) {
                clearInterval(latestVersionFound);

                let starterNotificationDuration = NOTIFICATION_DURATION;
                let newVersionAvailable = '';
                if (latestVersion != -1) {
                    if (latestVersion != VERSION) {
                        // make sure latestVersion is newer (prevent old updates from sending out false notification about an update available)
                        let versionRegex = /[0-9.]+/g; // this will not display a notification if a beta was to ever be published
                        let latestVersionInt = parseInt((latestVersion.match(versionRegex))[0].replaceAll('.', ''));
                        let currentVersionInt = parseInt((VERSION.match(versionRegex))[0].replaceAll('.', ''));
                        if (latestVersionInt > currentVersionInt) {
                            starterNotificationDuration = -1; // making sticky so user will for sure know that there's a new update
                            newVersionAvailable = `New version available: <code class="markdown" style="color: #0F0 !important">v${latestVersion}</code><br>` +
                                `<br>` +
                                `Please check the website!<br>` +
                                `<a target="_blank" href="${SUPPORT_URL}">` + SUPPORT_URL + '</a><br><br>';
                        }
                    }
                }

                // send notification with basic instructions, and if there's an update include info on that too
                let starterNotificationSetup = {
                    target: "#" + TOGGLER_ELEMENT_ID,
                    title: MOD_DISPLAYNAME + " [v" + VERSION + "]",
                    html: mppAdsWebsiteNotice + compatitbilityError + newVersionAvailable + `Mod created by <a target="_blank" href="${NAMESPACE}">${AUTHOR}</a>, thanks for using it!<br>` +
                        `<br>` +
                        `Try dragging a MIDI onto the screen, or click the button below to find and use the <b>Open</b> button, to start playing MIDI files!<br>` +
                        `<br>` +
                        `If you need any help using the mod, try using the command:<br>` +
                        ` ${LIST_BULLET} <code class="markdown" style="color: #0F0 !important">${PREFIX}help</code>`,
                    duration: starterNotificationDuration
                };
                let starterNotification = mppNotificationSend(starterNotificationSetup);
                // need a little delay to wait for toggler button to position itself, to correctly position notifications with it
                setTimeout(function () {
                    starterNotification.position();
                }, TENTH_OF_SECOND);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
