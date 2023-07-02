// ==UserScript==
// @name         Multiplayer Piano - MIDI Player
// @namespace    https://thealiendrew.github.io/
// @version      3.7.0
// @description  Plays MIDI files!
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        *://*.multiplayerpiano.org/*
// @match        *://*.multiplayerpiano.dev/*
// @match        *://*.multiplayerpiano.net/*
// @match        *://mpp.hri7566.info/*
// @match        *://mpp.autoplayer.xyz/*
// @match        *://mpp.lapishusky.dev/*
// @match        *://mpp.yourfriend.lv/*
// @match        *://mpp.l3m0ncao.wtf/*
// @match        *://mpp.terrium.net/*
// @match        *://mpp.hyye.tk/*
// @match        *://mpp.totalh.net/*
// @match        *://mppfork.netlify.app/*
// @match        *://*.mppkinda.com/*
// @match        *://*.augustberchelmann.com/piano/*
// @match        *://piano.ourworldofpixels.com/*
// @match        *://beta-mpp.csys64.com/*
// @match        *://fleetway-mpp.glitch.me/*
// @match        *://*.multiplayerpiano.com/*
// @match        *://*.mppclone.com/*
// @supportURL   https://github.com/TheAlienDrew/Custom-JS/tree/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/MIDI-Player.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/MIDI-Player.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/favicon.png
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     LatestUserScriptJS https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/MIDI-Player.user.js
// @resource     LatestMIDIPlayerJS https://api.github.com/repos/grimmdude/MidiPlayerJS/releases/latest
// @run-at       document-end
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (thealiendrew@gmail.com)

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

/* globals MPP, MidiPlayer */

// =============================================== SCRIPT CONSTANTS

// Script constants
const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;
const SUPPORT_URL = SCRIPT.supportURL;

// =============================================== FILES

// midiplayer.js via https://github.com/grimmdude/MidiPlayerJS
// (but I should maybe switch to https://github.com/mudcube/MIDI.js OR https://github.com/Tonejs/Midi)
let stringLatestMIDIPlayerJS = GM_getResourceText("LatestMIDIPlayerJS");
if (!stringLatestMIDIPlayerJS) {
    throw new Error('[' + NAME + "] failed to find latest MidiPlayerJS release from " + GM_getResourceURL("LatestMIDIPlayerJS"));
}
let jsonLatestMIDIPlayerJS = JSON.parse(stringLatestMIDIPlayerJS);
let LatestMIDIPlayerJS_VERSION = jsonLatestMIDIPlayerJS.name;
let MIDIPlayerJS_URL = "https://raw.githubusercontent.com/grimmdude/MidiPlayerJS/"+LatestMIDIPlayerJS_VERSION+"/browser/midiplayer.js"
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
    throw new Error(GM_info.script + " failed to load MidiPlayerJS from " + MIDIPlayerJS_URL);
}
let latestVersion = null;
let stringUserScriptJS = GM_getResourceText("LatestUserScriptJS");
if (stringUserScriptJS) {
    let linesUserScriptJS = stringUserScriptJS.split('\n');
    let currentLineUserScriptJS = 0;
    let findLatestVersion = setInterval(function () {
        if (latestVersion) clearInterval(findLatestVersion);
        else {
            let line = linesUserScriptJS[currentLineUserScriptJS];
            if (line.startsWith("// @version")) {
                let lineSplitSpaces = line.split(' ');
                latestVersion = lineSplitSpaces[lineSplitSpaces.length - 1];
            }
            currentLineUserScriptJS++;
        }
    }, 1);
} else {
    latestVersion = -1;
    console.warning('[' + NAME + "] failed to load LatestUserScriptJS from " + SUPPORT_URL);
    console.warning('[' + NAME + "] skipping version check");
}

// =============================================== CONSTANTS

// NOTE: Pure JS version code is the same from here down

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
const githubRepo = 'https://github.com/TheAlienDrew/Custom-JS/';
const githubIssueTitle = '[Feedback] ' + NAME + ' ' + VERSION;
const githubIssueBody = '<!-- Please write your feedback below this line. -->';
const FEEDBACK_URL = githubRepo + 'issues/new?title=' + encodeURIComponent(githubIssueTitle) + '&body=' + encodeURIComponent(githubIssueBody);

// Players listed by IDs (these are the _id strings)
const BANNED_PLAYERS = []; // empty for now
const LIMITED_PLAYERS = []; // empty for now

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const PERCUSSION_CHANNELS = [10, 11]; // (DON'T CHANGE)
//const QUOTA_SIZE_STANDARD_MAX_LOBBY = 240;
//const QUOTA_SIZE_STANDARD_MAX_ROOM_UNOWNED = 1200;
const QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED = 1800; // used to determine users that can play black midi
//const QUOTA_SIZE_PRIVILEGED_MAX_LOBBY = 10 * QUOTA_SIZE_STANDARD_MAX_LOBBY;
//const QUOTA_SIZE_PRIVILEGED_MAX_ROOM_UNOWNED = 10 * QUOTA_SIZE_STANDARD_MAX_ROOM_UNOWNED;
//const QUOTA_SIZE_PRIVILEGED_MAX_ROOM_OWNED = 10 * QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED;
const MIDI_FILE_SIZE_LIMIT_BYTES = 5242880 // 5 MB, most files beyond this size are black midi's which don't work well with standard quota size
const MIDI_FILE_SIZE_MAX_LIMIT_BYTES = 10 * MIDI_FILE_SIZE_LIMIT_BYTES; // 50 MB, roughly somewhere around 150 MB, but depends on how much memory is available to browser tab

// Bot constant settings
const MOD_SOLO_PLAY = true; // sets what play mode when the mod boots up on an owned room

// Bot custom constants
const PREFIX = "mp!";
const PREFIX_LENGTH = PREFIX.length;
const MOD_KEYWORD = "MIDI"; // this is used for auto enabling the public commands in a room that contains the keyword (character case doesn't matter)
const MOD_DISPLAYNAME = "MIDI Player";
const MOD_USERNAME = MOD_DISPLAYNAME + " (`" + PREFIX + "help`)";
const MOD_NAMESPACE = '( ' + NAMESPACE + ' )';
const MOD_DESCRIPTION = "[v" + VERSION + "] " + DESCRIPTION + " Made by a nerd in javascript. Special thanks to grimmdude for https://github.com/grimmdude/MidiPlayerJS "+((MidiPlayer && MidiPlayer.Constants && MidiPlayer.Constants.VERSION) ? ('(v'+MidiPlayer.Constants.VERSION+') ') : '')+"library."
const MOD_AUTHOR = "Created by " + AUTHOR + '.';
const BASE_COMMANDS = [
    ["help [command]", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this mod"],
    ["link", "get the download link for this mod"],
    ["feedback", "shows link to send feedback about the mod to the developer"],
    ["ping", "gets the milliseconds response time"]
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
const PRE_SETTINGS = PRE_MSG + " [Settings]";
const PRE_DOWNLOADING = PRE_MSG + " [Downloading]";
const PRE_LIMITED = PRE_MSG + " Limited!";
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
const CSS_VARIABLE_X_DISPLACEMENT = "--xDisplacement";
const CSS_VARIABLE_Y_DISPLACEMENT = "--yDisplacement";
const CSS_VARIABLE_X_INITIAL = "--xInitial";
const CSS_VARIABLE_Y_INITIAL = "--yInitial";
const CSS_VARIABLE_Y_TOGGLE_INITIAL = "--yToggleInitial"; // helps special case of determining toggle button placement
const PRE_ELEMENT_ID = "aliendrew-midi-player-mod";
const PRE_TOGGLER_ID = PRE_ELEMENT_ID + "-toggler";
const QUERY_BOTTOM_UGLY_BTNS = `#bottom > div > .ugly-button:not([id^=${PRE_ELEMENT_ID}])`;
// buttons have some constant styles/classes
const ELEM_ON = "display:block;";
const ELEM_OFF = "display:none;";
const ELEM_POS = "position:absolute;";
const BTN_STYLE = ELEM_POS + ELEM_OFF;

// Gets the correct note from MIDIPlayer to play on MPP
const MIDIPlayerToMPPNote = {
    "A0": "a-1",
    "Bb0": "as-1",
    "B0": "b-1",
    "C1": "c0",
    "Db1": "cs0",
    "D1": "d0",
    "Eb1": "ds0",
    "E1": "e0",
    "F1": "f0",
    "Gb1": "fs0",
    "G1": "g0",
    "Ab1": "gs0",
    "A1": "a0",
    "Bb1": "as0",
    "B1": "b0",
    "C2": "c1",
    "Db2": "cs1",
    "D2": "d1",
    "Eb2": "ds1",
    "E2": "e1",
    "F2": "f1",
    "Gb2": "fs1",
    "G2": "g1",
    "Ab2": "gs1",
    "A2": "a1",
    "Bb2": "as1",
    "B2": "b1",
    "C3": "c2",
    "Db3": "cs2",
    "D3": "d2",
    "Eb3": "ds2",
    "E3": "e2",
    "F3": "f2",
    "Gb3": "fs2",
    "G3": "g2",
    "Ab3": "gs2",
    "A3": "a2",
    "Bb3": "as2",
    "B3": "b2",
    "C4": "c3",
    "Db4": "cs3",
    "D4": "d3",
    "Eb4": "ds3",
    "E4": "e3",
    "F4": "f3",
    "Gb4": "fs3",
    "G4": "g3",
    "Ab4": "gs3",
    "A4": "a3",
    "Bb4": "as3",
    "B4": "b3",
    "C5": "c4",
    "Db5": "cs4",
    "D5": "d4",
    "Eb5": "ds4",
    "E5": "e4",
    "F5": "f4",
    "Gb5": "fs4",
    "G5": "g4",
    "Ab5": "gs4",
    "A5": "a4",
    "Bb5": "as4",
    "B5": "b4",
    "C6": "c5",
    "Db6": "cs5",
    "D6": "d5",
    "Eb6": "ds5",
    "E6": "e5",
    "F6": "f5",
    "Gb6": "fs5",
    "G6": "g5",
    "Ab6": "gs5",
    "A6": "a5",
    "Bb6": "as5",
    "B6": "b5",
    "C7": "c6",
    "Db7": "cs6",
    "D7": "d6",
    "Eb7": "ds6",
    "E7": "e6",
    "F7": "f6",
    "Gb7": "fs6",
    "G7": "g6",
    "Ab7": "gs6",
    "A7": "a6",
    "Bb7": "as6",
    "B7": "b6",
    "C8": "c7"
}

// =============================================== VARIABLES

let publicOption = false; // turn off the public mod commands if needed
let pinging = false; // helps aid in getting response time
let pingTime = 0; // changes after each ping
let fileSizeLimitBytes = MIDI_FILE_SIZE_LIMIT_BYTES; // updates if user has more than the highest standard quota, to allow playing black midi
let currentRoom = null; // updates when it connects to room
let chatDelay = CHAT_DELAY; // for how long to wait until posting another message
let endDelay; // used in multiline chats send commands

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
let useCorsUrl = function(url, useAlt = false) {
    let newUrl = null; // send null back if it's already a cors url
    let cors_api_url = 'https://corsproxy.io/?';
    let cors_api_url_alt = 'https://api.allorigins.win/get?url=';
    if (useAlt) cors_api_url = cors_api_url_alt;
    // prevents proxying an already corsproxy link
    if (url.indexOf(cors_api_url) == -1) newUrl = cors_api_url + encodeURIComponent(url);
    return newUrl;
}

// When using CORS proxies, sometimes a filename isn't available as content-disposition
// will return URL if it has redirects it needs to go through
let getContentDispositionFilename = function(url, blob, callback) {
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
        "body": "{\"requestUrl\":\""+url+"\",\"responseHeaders\":true}"
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
}

// Get visual loading progress (e.g. numBlocks = size of loading bar, think of it like pong bouncing back and forth)
let getLoadingProgress = function(numBlocks, intProgress) {
    let moduloTotal = (numBlocks - 1) * 2;
    let blockFillPosition = 0;
    let loadProgress = intProgress % moduloTotal;
    switch(loadProgress) {
        case 0: blockFillPosition = 0; break;
        case 1: case 19: blockFillPosition = 1; break;
        case 2: case 18: blockFillPosition = 2; break;
        case 3: case 17: blockFillPosition = 3; break;
        case 4: case 16: blockFillPosition = 4; break;
        case 5: case 15: blockFillPosition = 5; break;
        case 6: case 14: blockFillPosition = 6; break;
        case 7: case 13: blockFillPosition = 7; break;
        case 8: case 12: blockFillPosition = 8; break;
        case 9: case 11: blockFillPosition = 9; break;
        case 10: blockFillPosition = 10; break;
        default: blockFillPosition = -1; // will never end up getting here
    }
    let progressMade = "";
    for (let i = 0; i < numBlocks; i++) {
        if (i == blockFillPosition) progressMade += BAR_BLOCK_FILL;
        else progressMade += BAR_BLOCK_EMPTY;
    }
    return progressMade;
}

// Get visual elapsing progress (e.g. numBlocks = size of loading bar, think of it like a loading screen bar)
let getElapsedProgressInt = function(numBlocks, intElapsed, intTotal) {
    return Math.round((intElapsed / intTotal) * numBlocks);
}
let getElapsingProgress = function(numBlocks, intElapsed, intTotal) {
    let elapsedProgress = getElapsedProgressInt(numBlocks, intElapsed, intTotal);
    let progressMade = "";
    for (let i = 0; i < elapsedProgress; i++) {
        progressMade += BAR_BLOCK_FILL;
    }
    for (let j = 0; j < (numBlocks - elapsedProgress); j++) {
        progressMade += BAR_BLOCK_EMPTY;
    }
    return progressMade;
}

// Checks if loading music should play
let preventsLoadingMusic = function() {
    return !loadingMusicPrematureStop && !Player.isPlaying() && !MPP.client.preventsPlaying();
}

// This is used when loading a song in the midi player, if it's been turned on
let humanMusic = function() {
    setTimeout(function() {
        if (preventsLoadingMusic()) MPP.press("c5", 1);
        if (preventsLoadingMusic()) MPP.release("c5");
    }, 200);
    setTimeout(function() {
        if (preventsLoadingMusic()) MPP.press("d5", 1);
        if (preventsLoadingMusic()) MPP.release("d5");
    }, 700);
    setTimeout(function() {
        if (preventsLoadingMusic()) MPP.press("c5", 1);
        if (preventsLoadingMusic()) MPP.release("c5");
        loadingMusicPrematureStop = false;
    }, 1200);
}

// Starts the loading music
let startLoadingMusic = function() {
    if (loadingMusicLoop == null) {
        humanMusic();
        loadingMusicLoop = setInterval(function() {
            humanMusic();
        }, 2200);
    }
}

// Stops the loading music
let stopLoadingMusic = function() {
    if (loadingMusicLoop != null) {
        loadingMusicPrematureStop = true;
        clearInterval(loadingMusicLoop);
        loadingMusicLoop = null;
    }
}

// Check to make sure variable is initialized with something
let exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

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
} */

// Takes formatted time and removed preceeding zeros (only before minutes)
/* let timeClearZeros = function(formattedHms) {
    let newTime = formattedHms;
    while (newTime.length > 5 && newTime.indexOf("00:") == 0) {
        newTime = newTime.substring(3);
    }
    return newTime;
} */

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
} */

// Generate a random number
let randomNumber = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Puts quotes around string
let quoteString = function(string) {
    let newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
}

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
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}

// Gets file as a blob (data URI)
let urlToBlob = function(url, callback) {
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
        downloading = setInterval(function() {
            if (loadingProgressNotification) {
                loadingProgressNotification.close();
                loadingProgressNotification = null;
            }
            let textColor = (MPP.client.user.color) ? MPP.client.user.color : '#0F0'; // fall back color just in case
            let textStyle = 'style="color: ' + textColor + ' !important"'
            let barProgress = getLoadingProgress(PROGRESS_BAR_BLOCK_SIZE, progress);
            let loadingProgressNotificationSetup = {
                html: '<div class="title" style="display: block !important">' +
                        '[<span ' + textStyle + '>' + barProgress + '</span>]<span>  </span>' +
                      '</div>' +
                      '<div class="text">' +
                        'Downloading: <code class="markdown" ' + textStyle + '>' + url + '</code>' +
                      '</div>',
                duration: HALF_SECOND,
                class: 'short'
            }
            loadingProgressNotification = mppNotificationSend(loadingProgressNotificationSetup);
            progress++;
        }, 200);
    }

    // can't have "mixed content", so must start off secure
    fetch (urlSecureProtocol, {
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
        fetch (corsBasicUrl, {
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
            fetch (corsSecureUrl, {
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
                fetch (corsBasicUrlAlt, {
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
                    fetch (corsSecureUrlAlt, {
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
}

// Converts files/blobs to base64 (data URI)
let fileOrBlobToBase64 = function(raw, callback) {
    if (raw == null) {
        stopLoadingMusic();
        callback(null);
    }

    // continue if we have a blob
    let reader = new FileReader();
    reader.readAsDataURL(raw);
    reader.onloadend = function() {
        let base64data = reader.result;
        callback(base64data);
    }
}

// Returns the max file size you can have
let getMaxFileSize = function(lowestSizeBytes, maxSizeBytes) {
    // if noteQuota is undefined, assume we have infinite quota
    let getQuotaMax = MPP && (MPP.noteQuota ? (MPP.noteQuota.max ? MPP.noteQuota.max : 0) : QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED + 1);
    return ((getQuotaMax > QUOTA_SIZE_STANDARD_MAX_ROOM_OWNED) ? maxSizeBytes : lowestSizeBytes);
}

// Validates file or blob is a MIDI
let isMidi = function(raw) {
    if (exists(raw)) {
        let mimetype = raw.type;
        // acceptable mimetypes for midi files
        switch(mimetype) {
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
}

// Validates file or blob is application/octet-stream ... when using CORS
let isOctetStream = function(raw) {
    if (exists(raw) && raw.type == "application/octet-stream") return true;
    else return false;
}

// Makes all commands into one string
let formattedCommands = function(commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    let commands = '';
    for (let i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' `' : '`') + prefix + commandsArray[i][0] + '`' + (i < (commandsArray.length - 1) ? ',' : '');
    }
    return commands;
}

// Gets 1 command and info about it into a string
let formatCommandInfo = function(commandsArray, commandIndex) {
    return '`' + PREFIX + commandsArray[commandIndex][0] + '`' + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
}

// Send messages without worrying about timing
let mppChatSend = function(str, delay) {
    setTimeout(function(){MPP.chat.send(str)}, (exists(delay) ? delay : 0));
}

// Send multiline chats, and return final delay to make things easier for timings
let mppChatMultiSend = function(strArray, optionalPrefix, initialDelay) {
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
}

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
    if (!exists(MPP.Notification) && exists(Notification)) {
        // fix for older versions of MPP
        MPP.Notification = Notification;
    }
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
}

let playerStop = function(manualStop = false) {
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
}

let playerPlay = function(loop = false) {
    if (loop) {
        // Need to do something???
    }
    ended = stopped = paused = false;
}

let playerPause = function() {
    if (ended || stopped) {
        // Need to do something???
        return;
    }
    paused = true;
}

// Stops song in player, or at least stops all notes
let stopSong = function(fullStop) {
    if (fullStop) {
        if (elapsingProgressNotification) {
            elapsingProgressNotification.close();
            elapsingProgressNotification = null;
        }
        Player.stop();
        playerStop(true);
    }
    // need to release all keys that are playing at the moment
    Object.values(MIDIPlayerToMPPNote).forEach(note => {
        MPP.release(note);
    });
}

// Opens song in player
let openSong = function(songData) {
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
}

// Plays song in player
let playSong = function(songFileName, songData) {
    if (openSong(songData)) {
        // play song
        Player.play();
        playerPlay();
        let timeoutRecorder = 0;
        let showSongName = setInterval(function() {
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
}

// Plays the song from a URL if it's a MIDI
let playURL = function(songUrl, songData) {
    currentFileLocation = songUrl;
    let songFileName = decodeURIComponent(currentFileLocation.substring(currentFileLocation.lastIndexOf('/') + 1));
    playSong(songFileName, songData);
}

// Plays the song from an uploaded file if it's a MIDI
let playFile = function(songFiles) {
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
                fileOrBlobToBase64(songFile, function(base64data) {
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
}

// Creates the drag & drop area, and the following buttons: open, pause, stop, resume, repeat, sustain, song, & public
let createWebpageElements = function() {
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
            Array.prototype.forEach.call(droppedFiles, function(file) {
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

    // need the bottom area to append buttons to
    let buttonContainer = document.querySelector("#bottom div");
    // need the first button to setup upload button size correctly
    let buttonStyle = getComputedStyle(document.querySelector('.ugly-button'));
    let buttonWidth = parseInt(buttonStyle.width);
    let buttonHeight = parseInt(buttonStyle.height);
    let buttonBorderRadius = parseInt(buttonStyle.borderRadius);
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
    // needs an internal div for the upload button, this is the only special button (for now)
    let openDiv = document.createElement("div");
    openDiv.id = PRE_ELEMENT_ID + "-open";
    openDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    openDiv.classList.add("ugly-button");
    buttonContainer.appendChild(openDiv);
    // since we need upload files, there also needs to be an input element inside the open div
    let uploadBtn = document.createElement("input");
    let uploadBtnId = PRE_ELEMENT_ID + "-upload";
    uploadBtn.id = uploadBtnId;
    uploadBtn.style = "opacity:0;filter:alpha(opacity=0);position:absolute;top:0;left:0;width:" + (buttonWidth + 10) + "px;height:" + (buttonHeight + 10) + "px;border-radius:" + (buttonBorderRadius + 1) + "px;-webkit-border-radius:" + (buttonBorderRadius + 1) + "px;-moz-border-radius:" + (buttonBorderRadius + 1) + "px;";
    uploadBtn.title = " "; // removes the "No file choosen" tooltip
    uploadBtn.type = "file";
    uploadBtn.accept = ".mid,.midi";
    uploadBtn.onchange = function() {
        if (!MPP.client.preventsPlaying() && uploadBtn.files.length > 0) playFile(uploadBtn.files);
        else console.log("No MIDI file selected");
    }
    // fix cursor on upload file button
    let head = document.getElementsByTagName('HEAD')[0];
    let uploadFileBtnFix = this.document.createElement('link');
    uploadFileBtnFix.setAttribute('rel', 'stylesheet');
    uploadFileBtnFix.setAttribute('type', 'text/css');
    uploadFileBtnFix.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent('#' + uploadBtnId + ", #" + uploadBtnId + "::-webkit-file-upload-button {cursor:pointer}"));
    head.appendChild(uploadFileBtnFix);
    // continue with other html for open button
    let openTxt = document.createTextNode("Open");
    openDiv.appendChild(uploadBtn);
    openDiv.appendChild(openTxt);
    // then we need to let the rest of the script know it so it can reset it after loading files
    uploadButton = uploadBtn;

    // STOP
    nextLocationX++;
    let stopDiv = document.createElement("div");
    stopDiv.id = PRE_ELEMENT_ID + "-stop";
    stopDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    stopDiv.classList.add("ugly-button");
    stopDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) stop();
    }
    let stopTxt = document.createTextNode("Stop");
    stopDiv.appendChild(stopTxt);
    buttonContainer.appendChild(stopDiv);
    // REPEAT
    nextLocationX++;
    let repeatDiv = document.createElement("div");
    repeatDiv.id = PRE_ELEMENT_ID + "-repeat";
    repeatDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    repeatDiv.classList.add("ugly-button");
    repeatDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) repeat();
    }
    let repeatTxt = document.createTextNode("Repeat");
    repeatDiv.appendChild(repeatTxt);
    buttonContainer.appendChild(repeatDiv);
    // SONG
    nextLocationX++;
    let songDiv = document.createElement("div");
    songDiv.id = PRE_ELEMENT_ID + "-song";
    songDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    songDiv.classList.add("ugly-button");
    songDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) song();
    }
    let songTxt = document.createTextNode("Song");
    songDiv.appendChild(songTxt);
    buttonContainer.appendChild(songDiv);
    // PAUSE
    nextLocationX = 1;
    nextLocationY++;
    let pauseDiv = document.createElement("div");
    pauseDiv.id = PRE_ELEMENT_ID + "-pause";
    pauseDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    pauseDiv.classList.add("ugly-button");
    pauseDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) pause();
    }
    let pauseTxt = document.createTextNode("Pause");
    pauseDiv.appendChild(pauseTxt);
    buttonContainer.appendChild(pauseDiv);
    // RESUME
    nextLocationX++;
    let resumeDiv = document.createElement("div");
    resumeDiv.id = PRE_ELEMENT_ID + "-resume";
    resumeDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    resumeDiv.classList.add("ugly-button");
    resumeDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) resume();
    }
    let resumeTxt = document.createTextNode("Resume");
    resumeDiv.appendChild(resumeTxt);
    buttonContainer.appendChild(resumeDiv);
    // SUSTAIN
    nextLocationX++;
    let sustainDiv = document.createElement("div");
    sustainDiv.id = PRE_ELEMENT_ID + "-sustain";
    sustainDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    sustainDiv.classList.add("ugly-button");
    sustainDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) sustain();
    }
    let sustainTxt = document.createTextNode("Sustain");
    sustainDiv.appendChild(sustainTxt);
    buttonContainer.appendChild(sustainDiv);
    // PUBLIC
    nextLocationX++;
    let publicDiv = document.createElement("div");
    publicDiv.id = PRE_ELEMENT_ID + '-public';
    publicDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    publicDiv.classList.add("ugly-button");
    publicDiv.onclick = function() { publicCommands(true, true) }
    let publicTxt = document.createTextNode("Public");
    publicDiv.appendChild(publicTxt);
    buttonContainer.appendChild(publicDiv);

    // one more button to toggle the visibility of the other buttons
    nextLocationX = 0;
    nextLocationY = 0;
    let buttonsOn = false;
    let togglerDiv = document.createElement("div");
    togglerDiv.title = 'Use `'+PREFIX+'help` for more commands'
    togglerDiv.id = PRE_TOGGLER_ID;
    togglerDiv.style = ELEM_POS + ELEM_ON + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_TOGGLE_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    togglerDiv.classList.add("ugly-button");
    togglerDiv.onclick = function() {
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
}

// Shows limited message for user
let playerLimited = function(username) {
    // displays message with their name about being limited
    mppChatSend(PRE_LIMITED + " You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the mod");
}

// When there is an incorrect command, show this error
let cmdNotFound = function(cmd) {
    let error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (publicOption) mppChatSend(error);
    else console.log(error);
}

// Commands
let help = function(command, userId, yourId) {
    let isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        let publicCommands = formattedCommands(MOD_COMMANDS, PREFIX, true);
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, PREFIX, true)
                             + (publicOption ? ', ' + publicCommands : '')
                             + (userId == yourId ? " | Bot Owner Commands: " + (publicOption ? '' : publicCommands + ', ')
                             + formattedCommands(MOD_OWNER_COMMANDS, PREFIX, true) : ''));
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
}
let about = function() {
    mppChatSend(PRE_ABOUT + ' ' + MOD_DESCRIPTION + ' ' + MOD_AUTHOR + ' ' + MOD_NAMESPACE);
}
let link = function() {
    mppChatSend(PRE_LINK + " You can get this mod from " + SUPPORT_URL);
}
let feedback = function() {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
}
let ping = function() {
    // get a response back in milliseconds
    pinging = true;
    pingTime = Date.now();
    mppChatSend(PRE_PING);
}
let play = function(url) {
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
            urlToBlob(url, function(blob) {
                if (blob instanceof Error && blob.message == "The user aborted a request.") {
                    mppChatSend(PRE_MSG + ' ' + ABORTED_DOWNLOAD)
                } else if (blob == null) mppChatSend(error + " Invalid URL, this is not a MIDI file, or the file requires a manual download from " + quoteString(' ' + url + ' ') + "... " + WHERE_TO_FIND_MIDIS);
                else if (isMidi(blob) || isOctetStream(blob)) {
                    // if there is a remote filename, use it instead
                    getContentDispositionFilename(url, blob, function(blobFile, remoteFileName) {
                        // needs to be ran a second time to be sure there's no redirects to the file
                        getContentDispositionFilename(remoteFileName, blob, function(blobFileFinal, remoteFileNameFinal) {
                            let urlFinal = remoteFileName;
                            if (!remoteFileNameFinal) {
                                remoteFileNameFinal = remoteFileName;
                                urlFinal = url;
                            }
                            // check and limit file size, mainly to prevent browser tab crashing (not enough RAM to load) and deter black midi
                            if (blobFileFinal.size <= fileSizeLimitBytes) {
                                fileOrBlobToBase64(blobFileFinal, function(base64data) {
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
}
let stop = function() {
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
}
let pause = function(exceedsNoteQuota) {
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
}
let resume = function() {
    // resumes the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        let title = PRE_MSG + ' `';
        if (paused) {
            Player.play();
            playerPlay();
            title += BAR_RESUMED;
        } else title += BAR_STILL_RESUMED;
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
    }
}
let song = function() {
    // shows current song playing
    if (exists(currentSongName) && currentSongName != "") {
        let title = PRE_MSG + ' `' + (paused ? BAR_PAUSED : BAR_PLAYING);
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
    } else mppChatSend(PRE_MSG + ' ' + NO_SONG);
}
let repeat = function() {
    // turns on or off repeat
    repeatOption = !repeatOption;

    mppChatSend(PRE_SETTINGS + " Repeat set to " + (repeatOption ? "" : "not") + " repeating");
}
let sustain = function() {
    // turns on or off sustain
    sustainOption = !sustainOption;

    mppChatSend(PRE_SETTINGS + " Sustain set to " + (sustainOption ? "MIDI controlled" : "MPP controlled"));
}
let percussion = function() {
    // turns on or off percussion instruments
    percussionOption = !percussionOption;

    mppChatSend(PRE_SETTINGS + ' '+ (percussionOption ? "En" : "Dis") + "abled percussion instruments");
}
let loading = function(userId, yourId) {
    // only let the mod owner set if loading music should be on or not
    if (userId != yourId) return;
    loadingOption = !loadingOption;
    mppChatSend(PRE_SETTINGS + " The MIDI loading progress is now set to " + (loadingOption ? "audio" : "text"));
}
let publicCommands = function(userId, yourId) {
    // only let the mod owner set if public mod commands should be on or not
    if (userId != yourId) return;
    publicOption = !publicOption;
    mppChatSend(PRE_SETTINGS + " Public mod commands were turned " + (publicOption ? "on" : "off"));
}
let mppGetRoom = function() {
    if (MPP && MPP.client && MPP.client.channel && MPP.client.channel._id) {
        return MPP.client.channel._id;
    } else if (MPP && MPP.client && MPP.client.desiredChannelId) {
        return MPP.client.desiredChannelId;
    } else return null;
}

// =============================================== MAIN

// bug fix: see https://github.com/grimmdude/MidiPlayerJS/issues/25
Player.sampleRate = 0; // this allows sequential notes that are supposed to play at the same time, do so when using fast MIDIs (e.g. some black MIDIs)

Player.on('fileLoaded', function() {
    // Do something when file is loaded
    stopLoadingMusic();
});

Player.on('playing', function(currentTick) {
    // Do something while player is playing
    // (this is repeatedly triggered within the play loop)
    currentSongEventsPlayed = Player.eventsPlayed();
    if (paused || stopped) return;
    if (MPP.client.preventsPlaying()) pause();
});

Player.on('midiEvent', function(event) {
    // Do something when a MIDI event is fired.
    // (this is the same as passing a function to MidiPlayer.Player() when instantiating.
    if (!percussionOption &&
         (event.channel == PERCUSSION_CHANNELS[0] || event.channel == PERCUSSION_CHANNELS[1])) return;
    let currentEvent = event.name;
/* MAY NOT NEED */ // if (!exists(currentEvent) || currentEvent == "") return;
if (!currentEvent || currentEvent == '') console.log('FOUND NO NAME EVENT');
//console.log(event.noteName);
    let currentNote = (currentEvent.indexOf("Note") == 0) ? (
/* MAY NOT NEED */ //exists(event.noteName) ? MIDIPlayerToMPPNote[event.noteName] : null
        MIDIPlayerToMPPNote[event.noteName]
    ) : null;
    if (currentEvent == "Note on") {
        let mppNoteVelocity = (event.velocity ? event.velocity/100 : 0);
        MPP.press(currentNote, mppNoteVelocity);
        if (event.velocity == 0 || !sustainOption) MPP.release(currentNote);
    }
    if (sustainOption && (currentEvent == "Note off")) {
        MPP.release(currentNote);
    }
});

Player.on('endOfFile', function() {
    // Do something when end of the file has been reached.
    ended = true;
    playerStop();
});

MPP.client.on('a', function (msg) {
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
        // don't allow banned or limited users to use the mod
        let bannedPlayers = BANNED_PLAYERS.length;
        if (bannedPlayers > 0) {
            for (let i = 0; i < BANNED_PLAYERS.length; ++i) {
                if (BANNED_PLAYERS[i] == userId) {
                    playerLimited(username);
                    return;
                }
            }
        }
        let limitedPlayers = LIMITED_PLAYERS.length;
        if (limitedPlayers > 0) {
            for (let j = 0; j < LIMITED_PLAYERS.length; ++j) {
                if (LIMITED_PLAYERS[j] == userId) {
                    playerLimited(username);
                    return;
                }
            }
        }
        // evaluate input into command and possible arguments
        let message = input.substring(PREFIX_LENGTH).trim();
        let hasArgs = message.indexOf(' ');
        let command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        let argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1).trim() : null;
        // look through commands
        let isBotOwner = userId == yourId;
        let preventsPlaying = MPP.client.preventsPlaying();
        switch (command.toLowerCase()) {
            case "help": case "h": if ((isBotOwner || publicOption) && !preventsPlaying) help(argumentsString, userId, yourId); break;
            case "about": case "ab": if ((isBotOwner || publicOption) && !preventsPlaying) about(); break;
            case "link": case "li": if ((isBotOwner || publicOption) && !preventsPlaying) link(); break;
            case "feedback": case "fb": if (isBotOwner || publicOption) feedback(); break;
            case "ping": case "pi": if (isBotOwner || publicOption) ping(); break;
            case "play": case "p": if ((isBotOwner || publicOption) && !preventsPlaying) play(argumentsString); break;
            case "stop": case "s": if ((isBotOwner || publicOption) && !preventsPlaying) stop(); break;
            case "pause": case "pa": if ((isBotOwner || publicOption) && !preventsPlaying) pause(); break;
            case "resume": case "r": if ((isBotOwner || publicOption) && !preventsPlaying) resume(); break;
            case "song": case "so": if ((isBotOwner || publicOption) && !preventsPlaying) song(); break;
            case "repeat": case "re": if ((isBotOwner || publicOption) && !preventsPlaying) repeat(); break;
            case "sustain": case "ss": if ((isBotOwner || publicOption) && !preventsPlaying) sustain(); break;
            case "percussion": case "pe": if ((isBotOwner || publicOption) && !preventsPlaying) percussion(); break;
            case "loading": case "lo": loading(userId, yourId); break;
            case "public": publicCommands(userId, yourId); break;
        }
    }
});
MPP.client.on("ch", function(msg) {
    // set new chat delay based on room ownership after changing rooms
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
    // update current room info
    let newRoom = mppGetRoom();
    if (currentRoom != newRoom) {
        currentRoom = newRoom;
        // stop any songs that might have been playing before changing rooms
        if (currentRoom.toUpperCase().indexOf(MOD_KEYWORD) == -1 && !ended) stopSong(true);
    }
});
MPP.client.on('p', function(msg) {
    let userId = msg._id;
    // kick ban all the banned players
    let bannedPlayers = BANNED_PLAYERS.length;
    if (bannedPlayers > 0) {
        for (let i = 0; i < BANNED_PLAYERS.length; ++i) {
            let bannedPlayer = BANNED_PLAYERS[i];
            if (userId == bannedPlayer) MPP.client.sendArray([{m: "kickban", _id: bannedPlayer, ms: 3600000}]);
        }
    }
});

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. repeat)
let repeatingTasks = setInterval(function() {
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
                let textColor = (MPP.client.user.color) ? MPP.client.user.color : '#0F0'; // fall back color just in case
                let textStyle = 'style="color: ' + textColor + ' !important"'
                let barProgress = getElapsingProgress(PROGRESS_BAR_BLOCK_SIZE, currentSongEventsPlayed, currentSongTotalEvents);
                let elapsingProgressNotificationSetup = {
                    html: '<div class="title" style="display: block !important">' +
                            '[<span ' + textStyle + '>' + barProgress + '</span>]<span>  </span>' +
                          '</div>' +
                          '<div class="text">' +
                            'File: <code class="markdown" ' + textStyle + '>' + currentSongName + '</code>' +
                          '</div>',
                    duration: -1,
                    class: 'short'
                }
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
    // do repeat
    if (repeatOption && ended && !stopped && exists(currentSongName) && exists(currentSongData)) {
        ended = false;
        // nice delay before playing song again
        setTimeout(function() {playSong(currentSongName, currentSongData)}, REPEAT_DELAY);
    }
}, 1);
let dynamicButtonDisplacement = setInterval(function() {
    // required when other ugly-button's change visibility
    let allUglyBtns = [];
    [...document.querySelectorAll(QUERY_BOTTOM_UGLY_BTNS)].forEach(uglyBtn => {
        if (uglyBtn.offsetWidth > 0 || uglyBtn.offsetHeight > 0 || uglyBtn.getClientRects().length > 0) allUglyBtns.push(uglyBtn);
    });
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
    let displacement = { x: allUglyBtns[1].offsetLeft - allUglyBtns[0].offsetLeft,
                         y: bottomOffset - topOffset};
    // then we can finally generate initial placements
    let initial = { x: (topRightMostBtn.offsetLeft == bottomRightMostBtn.offsetLeft) ? rightMostBtn.offsetLeft + displacement.x : rightMostBtn.offsetLeft,
                    y: topOffset};
    // toggle button has a special case as to fit between pre existing buttons
    let toggleInitialY = initial.y + ((topRightMostBtn.offsetLeft > bottomRightMostBtn.offsetLeft) ? displacement.y : 0);
    // set CSS displacement values and initial locations
    document.documentElement.style.setProperty(CSS_VARIABLE_X_DISPLACEMENT, displacement.x + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_DISPLACEMENT, displacement.y + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_X_INITIAL, initial.x + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_INITIAL, initial.y + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_TOGGLE_INITIAL, toggleInitialY + "px");
}, TENTH_OF_SECOND);
let slowRepeatingTasks = setInterval(function() {
    // do background tab fix
    if (!pageVisible) {
        let note = MPP.piano.keys["a-1"].note;
        let participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SLOW_DELAY);

// Automatically turns off the sound warning (mainly for autoplay)
let playButtonAttempt = 10; // it'll try to find the button this many times, before continuing anyways
let playButtonCheckCounter = 0;
let clearSoundWarning = setInterval(function() {
    let playButton = document.querySelector("#sound-warning button");
    if (exists(playButton) || playButtonCheckCounter >= playButtonAttempt) {
        clearInterval(clearSoundWarning);

        // only turn off sound warning if it hasn't already been turned off
        if (exists(playButton) && window.getComputedStyle(playButton).display == "block") playButton.click();

        // wait for the client to come online
        let waitForMPP = setInterval(function() {
            let MPP_Client_Loaded = exists(MPP) && exists(MPP.client);
            if (MPP_Client_Loaded && mppGetRoom()) {
                clearInterval(waitForMPP);

                currentRoom = mppGetRoom();
                if (currentRoom.toUpperCase().indexOf(MOD_KEYWORD) >= 0) {
                    loadingOption = true;
                }
                createWebpageElements();
                console.log(PRE_MSG + " Online!");

                // let user know if they won't be able to see notifications
                    if (!exists(MPP.Notification) && !exists(Notification)) {
                    mppChatSend(PRE_MSG + " This version of Multiplayer Piano doesn't support notifications, please check console for the notification.");
                }

                // need a little delay to wait for button to position itself
                setTimeout(function() {
                    // send notification with basic instructions
                    let starterNotification = {
                        target: "#" + PRE_TOGGLER_ID,
                        title: MOD_DISPLAYNAME + " (mod created by " + AUTHOR + ") [v" + VERSION + "]",
                        html: `Thanks for using my mod!<br><br>Try dragging a MIDI onto the screen, or click the button below to find and use the <b>Open</b> button, to start playing MIDI files!<br><br>If you need any help using the mod, try using the command:<br> ${LIST_BULLET}<code class="markdown" style="color: #0F0 !important">${PREFIX}help</code>`,
                        duration: NOTIFICATION_DURATION
                    }
                    mppNotificationSend(starterNotification);
                }, TENTH_OF_SECOND);

                // check if there's an update available
                let latestVersionFound = setInterval(function () {
                    if (latestVersion) {
                        clearInterval(latestVersionFound);

                        if (latestVersion != -1) {
                            if (latestVersion != VERSION) {
                                // make sure latestVersion is newer (prevent old updates from sending out false message about an update available)
                                let versionRegex = /[0-9.]+/g; // this will not display a notification if a beta was to ever be published
                                let latestVersionInt = parseInt((latestVersion.match(versionRegex))[0].replaceAll('.',''));
                                let currentVersionInt = parseInt((VERSION.match(versionRegex))[0].replaceAll('.',''));
                                if (latestVersionInt > currentVersionInt) {
                                    mppChatSend(PRE_MSG + ' New version available (v' + latestVersion + ')! Please check the website: ' + SUPPORT_URL);
                                }
                            }
                        }
                    }
                }, SLOW_CHAT_DELAY);
            }
        }, TENTH_OF_SECOND);
    }
    playButtonCheckCounter++;
}, TENTH_OF_SECOND);
