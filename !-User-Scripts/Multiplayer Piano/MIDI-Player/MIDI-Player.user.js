// ==UserScript==
// @name         Multiplayer Piano - MIDI Player
// @namespace    https://thealiendrew.github.io/
// @version      2.8.5
// @description  Plays MIDI files!
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://www.multiplayerpiano.org/*
// @match        https://www.multiplayerpiano.dev/*
// @match        https://www.multiplayerpiano.net/*
// @match        https://piano.ourworldofpixels.com/* 
// @match        https://beta-mpp.csys64.com/*
// @match        https://mpp.hri7566.info/*
// @match        https://mpp.autoplayer.xyz/*
// @match        https://mpp.lapishusky.dev/*
// @match        https://mppfork.netlify.app/*
// @match        https://mpp.yourfriend.lv/*
// @match        https://mpp.l3m0ncao.live/*
// @match        https://mppkinda.com/*
// @match        https://fleetway-mpp.glitch.me/*
// @match        https://multiplayerpiano.com/*
// @match        https://mppclone.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/MIDI-Player.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/MIDI-Player.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/favicon.png
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
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

// =============================================== FILES

// midiplayer.js via https://github.com/grimmdude/MidiPlayerJS
// (but I should maybe switch to https://github.com/mudcube/MIDI.js OR https://github.com/Tonejs/Midi)
var stringLatestMIDIPlayerJS = GM_getResourceText("LatestMIDIPlayerJS");
if (!stringLatestMIDIPlayerJS) {
    throw new Error('[' + NAME + "] failed to find latest MidiPlayerJS release from " + GM_getResourceURL("LatestMIDIPlayerJS"));
}
var jsonLatestMIDIPlayerJS = JSON.parse(stringLatestMIDIPlayerJS);
var LatestMIDIPlayerJS_VERSION = jsonLatestMIDIPlayerJS.name;
var MIDIPlayerJS_URL = "https://raw.githubusercontent.com/grimmdude/MidiPlayerJS/"+LatestMIDIPlayerJS_VERSION+"/browser/midiplayer.js"
var requestMPJS = new XMLHttpRequest();
requestMPJS.open('GET', MIDIPlayerJS_URL, false);
requestMPJS.send(null);
if (requestMPJS.status === 200) {
    var type = requestMPJS.getResponseHeader('Content-Type');
    if (type.indexOf("text") !== 1) {
        var stringMIDIPlayerJS = requestMPJS.responseText;
        var scriptMIDIPlayerJS = document.createElement("script");
        scriptMIDIPlayerJS.type = 'text/javascript';
        scriptMIDIPlayerJS.appendChild(document.createTextNode(stringMIDIPlayerJS));
        (document.body || document.head || document.documentElement).appendChild(scriptMIDIPlayerJS);
    }
} else {
    throw new Error(GM_info.script + " failed to load MidiPlayerJS from " + MIDIPlayerJS_URL);
}

// =============================================== CONSTANTS

// Script constants
const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;
const DOWNLOAD_URL = SCRIPT.downloadURL;

// NOTE: Pure JS version code is the same from here down

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered
const REPEAT_DELAY = 2 * TENTH_OF_SECOND; // makes transitioning songs in repeat feel better
const SONG_NAME_TIMEOUT = 10 * SECOND; // if a file doesn't play, then forget about showing the song name it after this time

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
const PERCUSSION_CHANNEL = 10; // (DON'T CHANGE)
const MIDI_FILE_SIZE_LIMIT_BYTES = 5242880; // Maximum is roughly somewhere around 150 MB, but only black midi's get to that point

// Bot constant settings
const BOT_SOLO_PLAY = true; // sets what play mode when the bot boots up on an owned room

// Bot custom constants
const PREFIX = "/";
const PREFIX_LENGTH = PREFIX.length;
const BOT_KEYWORD = "MIDI"; // this is used for auto enabling the public commands in a room that contains the keyword (character case doesn't matter)
const BOT_ACTIVATOR = BOT_KEYWORD.toLowerCase();
const BOT_NAME = "MIDI Player";
const BOT_USERNAME = BOT_NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS "+((MidiPlayer && MidiPlayer.Constants && MidiPlayer.Constants.VERSION) ? ('(v'+MidiPlayer.Constants.VERSION+') ') : '')+"library."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const BASE_COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["ping", "gets the milliseconds response time"]
];
const BOT_COMMANDS = [
    ["play [MIDI URL]", "plays a specific song (URL must be a direct link to a MIDI file)"],
    ["stop", "stops all music from playing"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat", "toggles repeating current song on or off"],
    ["sustain", "toggles how sustain is controlled via either MIDI or by MPP"],
    ["percussion", "toggles the percussion instruments on or off (off by default since it makes most MIDIs sound bad)"]
];
const BOT_OWNER_COMMANDS = [
    ["loading", "toggles the MIDI loading progress audio, or text, on or off"],
    [BOT_ACTIVATOR, "toggles the public bot commands on or off"]
];
const PRE_MSG = BOT_NAME + " (v" + VERSION + "):";
const PRE_HELP = PRE_MSG + " [Help]";
const PRE_ABOUT = PRE_MSG + " [About]";
const PRE_LINK = PRE_MSG + " [Link]";
const PRE_FEEDBACK = PRE_MSG + " [Feedback]";
const PRE_PING = PRE_MSG + " [Ping]";
const PRE_SETTINGS = PRE_MSG + " [Settings]";
const PRE_DOWNLOADING = PRE_MSG + " [Downloading]";
const PRE_LIMITED = PRE_MSG + " Limited!";
const PRE_ERROR = PRE_MSG + " Error!";
const BAR_LEFT = '「';
const BAR_RIGHT = '」';
const BAR_ARROW_RIGHT = '⚊➤';
const BAR_NOW_PLAYING = BAR_LEFT + "   Now playing   " + BAR_RIGHT;
const BAR_PLAYING = BAR_LEFT + "     Playing     " + BAR_RIGHT;
const BAR_DONE_PLAYING = BAR_LEFT + "  Done playing   " + BAR_RIGHT;
const BAR_PAUSED = BAR_LEFT + "     Paused      " + BAR_RIGHT;
const BAR_STILL_PAUSED = BAR_LEFT + "  Still paused   " + BAR_RIGHT;
const BAR_RESUMED = BAR_LEFT + "     Resumed     " + BAR_RIGHT;
const BAR_STILL_RESUMED = BAR_LEFT + "  Still resumed  " + BAR_RIGHT;
const BAR_STOPPED = BAR_LEFT + "     Stopped     " + BAR_RIGHT;
const WHERE_TO_FIND_MIDIS = "You can find some good MIDIs to upload from https://bitmidi.com/ and https://midiworld.com/, or you can use your own MIDI files via Google Drive/Dropbox/etc. with a direct download link";
const NOT_OWNER = "The bot isn't the owner of the room";
const NO_SONG = "Not currently playing anything";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";

// Element constants
const CSS_VARIABLE_X_DISPLACEMENT = "--xDisplacement";
const CSS_VARIABLE_Y_DISPLACEMENT = "--yDisplacement";
const CSS_VARIABLE_X_INITIAL = "--xInitial";
const CSS_VARIABLE_Y_INITIAL = "--yInitial";
const CSS_VARIABLE_Y_TOGGLE_INITIAL = "--yToggleInitial"; // helps special case of determining toggle button placement
const PRE_ELEMENT_ID = "aliendrew-midi-player-bot";
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

var publicOption = false; // turn off the public bot commands if needed
var pinging = false; // helps aid in getting response time
var pingTime = 0; // changes after each ping
var currentRoom = null; // updates when it connects to room
var chatDelay = CHAT_DELAY; // for how long to wait until posting another message
var endDelay; // used in multiline chats send commands

var loadingOption = false; // controls if loading music should be on or not
var loadingProgress = 0; // updates when loading files
var loadingMusicLoop = null; // this is to play notes while a song is (down)loading
var loadingMusicPrematureStop = false; // this is used when we need to stop the music after errors
var finishedSongName = null; // only checked when not on repeat, for end/done playing message
var ended = true;
var stopped = false;
var paused = false;
var uploadButton = null; // this gets an element after it's loaded
var currentSongProgress0to10 = -1; // gets updated while a song plays
var currentSongEventsPlayed = 0; // gets updated while a song plays
var currentSongTotalEvents = 0; // gets updated as soon as a song is loaded
var currentSongData = null; // this contains the song as a data URI
var currentFileLocation = null; // this leads to the MIDI location (local or by URL)
var currentSongName = null; // extracted from the file name/end of URL
var previousSongData = null; // grabs current when changing successfully
var previousSongName = null; // grabs current when changing successfully
var repeatOption = false; // allows for repeat of one song
var sustainOption = true; // makes notes end according to the midi file
var percussionOption = false; // turning on percussion makes a lot of MIDIs sound bad


// =============================================== PAGE VISIBILITY

var pageVisible = true;
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        pageVisible = false;
    } else {
        pageVisible = true;
    }
});

// =============================================== OBJECTS

// The MIDIPlayer
const Player = new MidiPlayer.Player(function(event) {
    if (MPP.client.preventsPlaying()) {
        if (Player.isPlaying()) pause();
        return;
    }
    var currentEvent = event.name;
    if (!exists(currentEvent) || currentEvent == "") return;
    if (currentEvent.indexOf("Note") == 0 && (percussionOption || event.channel != PERCUSSION_CHANNEL)) {
        var currentNote = (exists(event.noteName) ? MIDIPlayerToMPPNote[event.noteName] : null);
        if (currentEvent == "Note on" && event.velocity > 0) { // start note
            MPP.press(currentNote, (event.velocity/100));
            if (!sustainOption) MPP.release(currentNote);
        } else if (sustainOption && (currentEvent == "Note off" || event.velocity == 0)) MPP.release(currentNote); // end note
    }
    if (!ended && !Player.isPlaying()) {
        currentSongProgress0to10 = -1;
        ended = true;
        paused = false;
        if (!stopped) finishedSongName = currentSongName;
        currentSongData = null;
        currentSongName = null;
    } else currentSongEventsPlayed = Player.eventsPlayed();
});
// see https://github.com/grimmdude/MidiPlayerJS/issues/25
Player.sampleRate = 0; // this allows sequential notes that are supposed to play at the same time, do so when using fast MIDIs (e.g. some black MIDIs)

// =============================================== FUNCTIONS

// CORS Proxy (allows downloading files where JS can't)
var useCorsUrl = function(url) {
    var newUrl = null; // send null back if it's already a cors url
    var cors_api_url = 'https://corsproxy.io/?';
    // prevents proxying an already corsproxy link
    if (url.indexOf(cors_api_url) == -1) newUrl = cors_api_url + url;
    return newUrl;
}

// Get visual loading progress, just use a progressing number (e.g. time elapsed, loop index, etc.)
var getLoadingProgress = function(intProgress) {
    var loadProgress = intProgress % 20;
    switch(loadProgress) {
        case 0: return BAR_LEFT + "▩▢▢▢▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 1: case 19: return BAR_LEFT + "▢▩▢▢▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 2: case 18: return BAR_LEFT + "▢▢▩▢▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 3: case 17: return BAR_LEFT + "▢▢▢▩▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 4: case 16: return BAR_LEFT + "▢▢▢▢▩▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 5: case 15: return BAR_LEFT + "▢▢▢▢▢▩▢▢▢▢▢" + BAR_RIGHT; break;
        case 6: case 14: return BAR_LEFT + "▢▢▢▢▢▢▩▢▢▢▢" + BAR_RIGHT; break;
        case 7: case 13: return BAR_LEFT + "▢▢▢▢▢▢▢▩▢▢▢" + BAR_RIGHT; break;
        case 8: case 12: return BAR_LEFT + "▢▢▢▢▢▢▢▢▩▢▢" + BAR_RIGHT; break;
        case 9: case 11: return BAR_LEFT + "▢▢▢▢▢▢▢▢▢▩▢" + BAR_RIGHT; break;
        case 10: return BAR_LEFT + "▢▢▢▢▢▢▢▢▢▢▩" + BAR_RIGHT; break;
        default: return BAR_LEFT + "▢▢▢▢▢▢▢▢▢▢▢" + BAR_RIGHT; // will never end up getting here
    }
}

// Get visual elapsing progress, first argument would elapsed amount while second argument would be total amount
var getElapsedProgressInt0to10 = function(intElapsed, intTotal) {
    return Math.round((intElapsed / intTotal) * 10);
}
var getElapsingProgress = function(intElapsed, intTotal) {
    var elapsedProgress = getElapsedProgressInt0to10(intElapsed, intTotal);
    switch(elapsedProgress) {
        case 0: return BAR_LEFT + "▩▢▢▢▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 1: return BAR_LEFT + "▩▩▢▢▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 2: return BAR_LEFT + "▩▩▩▢▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 3: return BAR_LEFT + "▩▩▩▩▢▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 4: return BAR_LEFT + "▩▩▩▩▩▢▢▢▢▢▢" + BAR_RIGHT; break;
        case 5: return BAR_LEFT + "▩▩▩▩▩▩▢▢▢▢▢" + BAR_RIGHT; break;
        case 6: return BAR_LEFT + "▩▩▩▩▩▩▩▢▢▢▢" + BAR_RIGHT; break;
        case 7: return BAR_LEFT + "▩▩▩▩▩▩▩▩▢▢▢" + BAR_RIGHT; break;
        case 8: return BAR_LEFT + "▩▩▩▩▩▩▩▩▩▢▢" + BAR_RIGHT; break;
        case 9: return BAR_LEFT + "▩▩▩▩▩▩▩▩▩▩▢" + BAR_RIGHT; break;
        case 10: return BAR_LEFT + "▩▩▩▩▩▩▩▩▩▩▩" + BAR_RIGHT; break;
        default: return BAR_LEFT + "▢▢▢▢▢▢▢▢▢▢▢" + BAR_RIGHT; // should never end up here unless negative numbers were introduced
    }
}

// Checks if loading music should play
var preventsLoadingMusic = function() {
    return !loadingMusicPrematureStop && !Player.isPlaying() && !MPP.client.preventsPlaying();
}

// This is used when loading a song in the midi player, if it's been turned on
var humanMusic = function() {
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
var startLoadingMusic = function() {
    if (loadingMusicLoop == null) {
        humanMusic();
        loadingMusicLoop = setInterval(function() {
            humanMusic();
        }, 2200);
    }
}

// Stops the loading music
var stopLoadingMusic = function() {
    if (loadingMusicLoop != null) {
        loadingMusicPrematureStop = true;
        clearInterval(loadingMusicLoop);
        loadingMusicLoop = null;
    }
}

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Format time to HH:MM:SS from seconds
/* var secondsToHms = function(d) {
    d = Number(d);

    var h, m, s;
    var hDisplay = "00";
    var mDisplay = hDisplay;
    var sDisplay = hDisplay;

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
/* var timeClearZeros = function(formattedHms) {
    var newTime = formattedHms;
    while (newTime.length > 5 && newTime.indexOf("00:") == 0) {
        newTime = newTime.substring(3);
    }
    return newTime;
} */

// Resizes a formatted HH:MM:SS time to the second formatted time
/* var timeSizeFormat = function(timeCurrent, timeEnd) {
    var newTimeFormat = timeCurrent;
    var timeCurrentLength = timeCurrent.length;
    var timeEndLength = timeEnd.length;
    // lose or add 00's
    if (timeCurrentLength > timeEndLength) newTimeFormat = timeCurrent.substring(timeCurrentLength - timeEndLength);
    while (newTimeFormat.length < timeEndLength) {
        newTimeFormat = "00:" + newTimeFormat;
    }
    return newTimeFormat;
} */

// Generate a random number
var randomNumber = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Puts quotes around string
var quoteString = function(string) {
    var newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
}

// Gets file as a blob (data URI)
var urlToBlob = function(url, callback) {
    // show file download progress
    var downloading = null;
    mppChatSend(PRE_DOWNLOADING + ' ' + url);
    if (loadingOption) startLoadingMusic();
    else {
        var progress = 0;
        downloading = setInterval(function() {
            mppChatSend(PRE_DOWNLOADING + ' ' + getLoadingProgress(progress));
            progress++;
        }, chatDelay);
    }

    fetch(url, {
        headers: {
            "Content-Disposition": "attachment" // this might not be doing anything
        }
    }).then(response => {
        stopLoadingMusic();
        clearInterval(downloading);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.blob();
    }).then(blob => {
        stopLoadingMusic();
        clearInterval(downloading);
        callback(blob);
    }).catch(error => {
        console.error("Normal fetch couldn't get the file:", error);
        var corsUrl = useCorsUrl(url);
        if (corsUrl != null) {
            if (loadingOption) startLoadingMusic();

            fetch(corsUrl, {
                headers: {
                    "Content-Disposition": "attachment" // this might not be doing anything
                }
            }).then(response => {
                stopLoadingMusic();
                clearInterval(downloading);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.blob();
            }).then(blob => {
                stopLoadingMusic();
                clearInterval(downloading);
                callback(blob);
            }).catch(error => {
                console.error("CORS Anywhere API fetch couldn't get the file:", error);
                stopLoadingMusic();
                clearInterval(downloading);
                callback(null);
            });
        }
        // callback(null); // disabled since the second fetch already should call the call back
    });
}

// Converts files/blobs to base64 (data URI)
var fileOrBlobToBase64 = function(raw, callback) {
    if (raw == null) {
        stopLoadingMusic();
        callback(null);
    }

    // continue if we have a blob
    var reader = new FileReader();
    reader.readAsDataURL(raw);
    reader.onloadend = function() {
        var base64data = reader.result;
        callback(base64data);
    }
}

// Validates file or blob is a MIDI
var isMidi = function(raw) {
    if (exists(raw)) {
        var mimetype = raw.type;
        // acceptable mimetypes for midi files
        switch(mimetype) {
            case "@file/mid": case "@file/midi":
            case "application/mid": case "application/midi":
            case "application/x-mid": case "application/x-midi":
            case "audio/mid": case "audio/midi":
            case "audio/x-mid": case "audio/x-midi":
            case "music/crescendo":
            case "x-music/mid": case "x-music/midi":
            case "x-music/x-mid": case "x-music/x-midi": return true; break;
        }
    }
    return false;
}

// Validates file or blob is application/octet-stream ... when using CORS
var isOctetStream = function(raw) {
    if (exists(raw) && raw.type == "application/octet-stream") return true;
    else return false;
}

// Makes all commands into one string
var formattedCommands = function(commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    var commands = '';
    var i;
    for(i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' ' : '') + prefix + commandsArray[i][0];
    }
    return commands;
}

// Gets 1 command and info about it into a string
var formatCommandInfo = function(commandsArray, commandIndex) {
    return LIST_BULLET + PREFIX + commandsArray[commandIndex][0] + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
}

// Send messages without worrying about timing
var mppChatSend = function(str, delay) {
    setTimeout(function(){MPP.chat.send(str)}, (exists(delay) ? delay : 0));
}

// Send multiline chats, and return final delay to make things easier for timings
var mppChatMultiSend = function(strArray, optionalPrefix, initialDelay) {
    if (!exists(optionalPrefix)) optionalPrefix = '';
    var newDelay = 0;
    var i;
    for (i = 0; i < strArray.length; ++i) {
        var currentString = strArray[i];
        if (currentString != "") {
            ++newDelay;
            mppChatSend(optionalPrefix + strArray[i], chatDelay * newDelay);
        }
    }
    return chatDelay * newDelay;
}

// Stops the current song if any are playing
var stopSong = function() {
    stopped = true;
    if (!ended) {
        Player.stop();
        currentSongProgress0to10 = -1;
        currentSongEventsPlayed = 0;
        currentSongName = null;
        ended = true;
    }
    if (paused) paused = false;
}

// Gets song from data URI and plays it
var playSong = function(songFileName, songData) {
    // stop any current songs from playing
    stopSong();
    // play song if it loaded correctly
    try {
        // load song
        Player.loadDataUri(songData);
        // play song
        Player.play();
        ended = false;
        stopped = false;
        var timeoutRecorder = 0;
        var showSongName = setInterval(function() {
            if (Player.isPlaying()) {
                clearInterval(showSongName);

                // changes song
                //var hasExtension = songFileName.lastIndexOf('.');
                previousSongData = currentSongData;
                previousSongName = currentSongName;
                currentSongData = songData;
                currentSongName = /*(hasExtension > 0) ? songFileName.substring(0, hasExtension) :*/ songFileName;
                currentSongEventsPlayed = Player.eventsPlayed();
                currentSongTotalEvents = Player.getTotalEvents();

                mppChatSend(PRE_MSG + ' `' + BAR_NOW_PLAYING + ' ' + BAR_ARROW_RIGHT + ' ' + quoteString(currentSongName) + '`');
            } else if (timeoutRecorder == SONG_NAME_TIMEOUT) {
                clearInterval(showSongName);
            } else timeoutRecorder++;
        }, 1);
    } catch(error) {
        stopLoadingMusic();
        // reload the previous working file if there is one
        if (previousSongData != null) Player.loadDataUri(previousSongData);
        mppChatSend(PRE_ERROR + " (play) " + error);
    }
}

// Plays the song from a URL if it's a MIDI
var playURL = function(songUrl, songData) {
    currentFileLocation = songUrl;
    var songFileName = decodeURIComponent(currentFileLocation.substring(currentFileLocation.lastIndexOf('/') + 1));
    playSong(songFileName, songData);
}

// Plays the song from an uploaded file if it's a MIDI
var playFile = function(songFile) {
    var songFileName = null;

    var error = PRE_ERROR + " (play)";
    // load in the file
    if (exists(songFile)) {
        // check and limit file size, mainly to prevent browser tab crashing (not enough RAM to load) and deter black midi
        songFileName = songFile.name.split(/(\\|\/)/g).pop();
        if (songFile.size <= MIDI_FILE_SIZE_LIMIT_BYTES) {
            if (isMidi(songFile)) {
                fileOrBlobToBase64(songFile, function(base64data) {
                    // play song only if we got data
                    if (exists(base64data)) {
                        currentFileLocation = songFile.name;
                        playSong(songFileName, base64data);
                        uploadButton.value = ""; // reset file input
                    } else mppChatSend(error + " Unexpected result, MIDI file couldn't load");
                });
            } else mppChatSend(error + " The file choosen, \"" + songFileName + "\", is either corrupted, or it's not really a MIDI file");
        } else mppChatSend(error + " The file choosen, \"" + songFileName + "\",  is too big (larger than " + MIDI_FILE_SIZE_LIMIT_BYTES + " bytes), please choose a file with a smaller size");
    } else mppChatSend(error + " MIDI file not found");
}

// Creates the play, pause, resume, and stop button for the bot
var createButtons = function() {
    // need the bottom area to append buttons to
    var buttonContainer = document.querySelector("#bottom div");
    // we need to keep track of the next button locations
    var nextLocationX = 1;
    var nextLocationY = 0;

    // need to initialize CSS variables: DISPLACEMENT & INITIAL for X and Y
    document.documentElement.style.setProperty(CSS_VARIABLE_X_DISPLACEMENT, "0px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_DISPLACEMENT, "0px");
    document.documentElement.style.setProperty(CSS_VARIABLE_X_INITIAL, "0px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_INITIAL, "0px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_TOGGLE_INITIAL, "0px");

    // play needs the div like all the other buttons
    // PLAY
    var playDiv = document.createElement("div");
    playDiv.id = PRE_ELEMENT_ID + "-play";
    playDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    playDiv.classList.add("ugly-button");
    buttonContainer.appendChild(playDiv);
    // since we need upload files, there also needs to be an input element inside the play div
    var uploadBtn = document.createElement("input");
    var uploadBtnId = PRE_ELEMENT_ID + "-upload";
    uploadBtn.id = uploadBtnId;
    uploadBtn.style = "opacity:0;filter:alpha(opacity=0);position:absolute;top:0;left:0;width:110px;height:22px;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;";
    uploadBtn.title = " "; // removes the "No file choosen" tooltip
    uploadBtn.type = "file";
    uploadBtn.accept = ".mid,.midi";
    uploadBtn.onchange = function() {
        if (!MPP.client.preventsPlaying() && uploadBtn.files.length > 0) playFile(uploadBtn.files[0]);
        else console.log("No MIDI file selected");
    }
    // fix cursor on upload file button
    var head = document.getElementsByTagName('HEAD')[0];
    var uploadFileBtnFix = this.document.createElement('link');
    uploadFileBtnFix.setAttribute('rel', 'stylesheet');
    uploadFileBtnFix.setAttribute('type', 'text/css');
    uploadFileBtnFix.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent('#' + uploadBtnId + ", #" + uploadBtnId + "::-webkit-file-upload-button {cursor:pointer}"));
    head.appendChild(uploadFileBtnFix);
    // continue with other html for play button
    var playTxt = document.createTextNode("Play");
    playDiv.appendChild(uploadBtn);
    playDiv.appendChild(playTxt);
    // then we need to let the rest of the script know it so it can reset it after loading files
    uploadButton = uploadBtn;

    // other buttons can work fine without major adjustments
    // STOP
    nextLocationX++;
    var stopDiv = document.createElement("div");
    stopDiv.id = PRE_ELEMENT_ID + "-stop";
    stopDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    stopDiv.classList.add("ugly-button");
    stopDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) stop();
    }
    var stopTxt = document.createTextNode("Stop");
    stopDiv.appendChild(stopTxt);
    buttonContainer.appendChild(stopDiv);
    // REPEAT
    nextLocationX++;
    var repeatDiv = document.createElement("div");
    repeatDiv.id = PRE_ELEMENT_ID + "-repeat";
    repeatDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    repeatDiv.classList.add("ugly-button");
    repeatDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) repeat();
    }
    var repeatTxt = document.createTextNode("Repeat");
    repeatDiv.appendChild(repeatTxt);
    buttonContainer.appendChild(repeatDiv);
    // SONG
    nextLocationX++;
    var songDiv = document.createElement("div");
    songDiv.id = PRE_ELEMENT_ID + "-song";
    songDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    songDiv.classList.add("ugly-button");
    songDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) song(true);
    }
    var songTxt = document.createTextNode("Song");
    songDiv.appendChild(songTxt);
    buttonContainer.appendChild(songDiv);
    // PAUSE
    nextLocationX = 1;
    nextLocationY++;
    var pauseDiv = document.createElement("div");
    pauseDiv.id = PRE_ELEMENT_ID + "-pause";
    pauseDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    pauseDiv.classList.add("ugly-button");
    pauseDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) pause();
    }
    var pauseTxt = document.createTextNode("Pause");
    pauseDiv.appendChild(pauseTxt);
    buttonContainer.appendChild(pauseDiv);
    // RESUME
    nextLocationX++;
    var resumeDiv = document.createElement("div");
    resumeDiv.id = PRE_ELEMENT_ID + "-resume";
    resumeDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    resumeDiv.classList.add("ugly-button");
    resumeDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) resume();
    }
    var resumeTxt = document.createTextNode("Resume");
    resumeDiv.appendChild(resumeTxt);
    buttonContainer.appendChild(resumeDiv);
    // SUSTAIN
    nextLocationX++;
    var sustainDiv = document.createElement("div");
    sustainDiv.id = PRE_ELEMENT_ID + "-sustain";
    sustainDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    sustainDiv.classList.add("ugly-button");
    sustainDiv.onclick = function() {
        if (!MPP.client.preventsPlaying()) sustain();
    }
    var sustainTxt = document.createTextNode("Sustain");
    sustainDiv.appendChild(sustainTxt);
    buttonContainer.appendChild(sustainDiv);
    // PUBLIC
    nextLocationX++;
    var publicDiv = document.createElement("div");
    publicDiv.id = PRE_ELEMENT_ID + '-' + BOT_ACTIVATOR;
    publicDiv.style = BTN_STYLE + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    publicDiv.classList.add("ugly-button");
    publicDiv.onclick = function() { public(true, true) }
    var publicTxt = document.createTextNode("Public");
    publicDiv.appendChild(publicTxt);
    buttonContainer.appendChild(publicDiv);

    // one more button to toggle the visibility of the other buttons
    nextLocationX = 0;
    nextLocationY = 0;
    var buttonsOn = false;
    var togglerDiv = document.createElement("div");
    togglerDiv.title = 'Use `'+PREFIX+'help` for more commands'
    togglerDiv.id = PRE_ELEMENT_ID + "-toggler";
    togglerDiv.style = ELEM_POS + ELEM_ON + "top:calc(" + nextLocationY + " * var(" + CSS_VARIABLE_Y_DISPLACEMENT + ") + var(" + CSS_VARIABLE_Y_TOGGLE_INITIAL + "));left:calc(" + nextLocationX + " * var(" + CSS_VARIABLE_X_DISPLACEMENT + ") + var(" + CSS_VARIABLE_X_INITIAL + "));";
    togglerDiv.classList.add("ugly-button");
    togglerDiv.onclick = function() {
        if (buttonsOn) { // if on, then turn off, else turn on
            playDiv.style.display =
            stopDiv.style.display =
            repeatDiv.style.display =
            songDiv.style.display =
            pauseDiv.style.display =
            resumeDiv.style.display =
            sustainDiv.style.display =
            publicDiv.style.display = "none";
            buttonsOn = false;
        } else {
            playDiv.style.display =
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
    var togglerTxt = document.createTextNode(BOT_NAME);
    togglerDiv.appendChild(togglerTxt);
    buttonContainer.appendChild(togglerDiv);
}

// Shows limited message for user
var playerLimited = function(username) {
    // displays message with their name about being limited
    mppChatSend(PRE_LIMITED + " You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the bot");
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    var error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (publicOption) mppChatSend(error);
    else console.log(error);
}

// Commands
var help = function(command, userId, yourId) {
    var isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        var publicCommands = formattedCommands(BOT_COMMANDS, LIST_BULLET + PREFIX, true);
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, LIST_BULLET + PREFIX, true)
                             + (publicOption ? ' ' + publicCommands : '')
                             + (userId == yourId ? " | Bot Owner Commands: " + (publicOption ? '' : publicCommands + ' ')
                             + formattedCommands(BOT_OWNER_COMMANDS, LIST_BULLET + PREFIX, true) : ''));
    } else {
        var valid = null;
        var commandIndex = null;
        var commandArray = null;
        command = command.toLowerCase();
        // check commands arrays
        var i;
        for(i = 0; i < BASE_COMMANDS.length; i++) {
            if (BASE_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BASE_COMMANDS;
                commandIndex = i;
            }
        }
        var j;
        for(j = 0; j < BOT_COMMANDS.length; j++) {
            if (BOT_COMMANDS[j][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BOT_COMMANDS;
                commandIndex = j;
            }
        }
        var k;
        for(k = 0; k < BOT_OWNER_COMMANDS.length; k++) {
            if (BOT_OWNER_COMMANDS[k][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BOT_OWNER_COMMANDS;
                commandIndex = k;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(commandArray, commandIndex),);
        else cmdNotFound(command);
    }
}
var about = function() {
    mppChatSend(PRE_ABOUT + ' ' + BOT_DESCRIPTION + ' ' + BOT_AUTHOR + ' ' + BOT_NAMESPACE);
}
var link = function() {
    mppChatSend(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
}
var feedback = function() {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
}
var ping = function() {
    // get a response back in milliseconds
    pinging = true;
    pingTime = Date.now();
    mppChatSend(PRE_PING);
    setTimeout(function() {
        if (pinging) mppChatSend("Pong! [within 1 second]");
        pinging = false;
    }, SECOND);
}
var play = function(url) {
    var error = PRE_ERROR + " (play)";
    // URL needs to be entered to play a song
    if (!exists(url) || url == "") {
        stopLoadingMusic();
        mppChatSend(error + " No MIDI url entered... " + WHERE_TO_FIND_MIDIS);
    } else {
        // downloads file if possible and then plays it if it's a MIDI
        urlToBlob(url, function(blob) {
            if (blob == null) mppChatSend(error + " Invalid URL, this is not a MIDI file, or the file requires a manual download from " + quoteString(' ' + url + ' ') + "... " + WHERE_TO_FIND_MIDIS);
            else if (isMidi(blob) || isOctetStream(blob)) {
                // check and limit file size, mainly to prevent browser tab crashing (not enough RAM to load) and deter black midi
                if (blob.size <= MIDI_FILE_SIZE_LIMIT_BYTES) {
                    fileOrBlobToBase64(blob, function(base64data) {
                        // play song only if we got data
                        if (exists(base64data)) {
                            if (isOctetStream(blob)) { // when download with CORS, need to replace mimetype, but it doesn't guarantee it's a MIDI file
                                base64data = base64data.replace("application/octet-stream", "audio/midi");
                            }
                            playURL(url, base64data);
                        } else mppChatSend(error + " Unexpected result, MIDI file couldn't load... " + WHERE_TO_FIND_MIDIS);
                    });
                } else mppChatSend(error + " The file choosen, \"" + decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)) + "\",  is too big (larger than the limit of " + MIDI_FILE_SIZE_LIMIT_BYTES + " bytes), please choose a file with a smaller size");
            } else mppChatSend(error + " Invalid URL, this is not a MIDI file... " + WHERE_TO_FIND_MIDIS);
        });
    }
}
var stop = function() {
    // stops the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        var tempSongName = currentSongName;
        stopSong();
        currentFileLocation = null;
        paused = false;
        mppChatSend(PRE_MSG + ' `' + BAR_STOPPED + ' ' + BAR_ARROW_RIGHT + ' ' + quoteString(tempSongName) + '`');
    }
}
var pause = function() {
    // pauses the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        var title = PRE_MSG + ' `';
        if (paused) title += BAR_STILL_PAUSED;
        else {
            Player.pause();
            paused = true;
            title += BAR_PAUSED;
        }
        mppChatSend(title + ' ' + BAR_ARROW_RIGHT + ' ' + quoteString(currentSongName) + '`');
    }
}
var resume = function() {
    // resumes the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        var title = PRE_MSG + ' `';
        if (paused) {
            Player.play();
            paused = false;
            title += BAR_RESUMED;
        } else title += BAR_STILL_RESUMED;
        mppChatSend(title + ' ' + BAR_ARROW_RIGHT + ' ' + quoteString(currentSongName) + '`');
    }
}
var song = function(showStatusText) {
    // shows current song playing
    if (exists(currentSongName) && currentSongName != "") {
        var title = PRE_MSG + ' `';
        if (showStatusText) {
            if (paused) {
                title += BAR_PAUSED;
            } else {
                title += BAR_PLAYING;
            }
        }
        else title += getElapsingProgress(currentSongEventsPlayed, currentSongTotalEvents);
        mppChatSend(title + ' ' + BAR_ARROW_RIGHT + ' ' + quoteString(currentSongName) + '`');
    } else mppChatSend(PRE_MSG + ' ' + NO_SONG);
}
var repeat = function() {
    // turns on or off repeat
    repeatOption = !repeatOption;

    mppChatSend(PRE_SETTINGS + " Repeat set to " + (repeatOption ? "" : "not") + " repeating");
}
var sustain = function() {
    // turns on or off sustain
    sustainOption = !sustainOption;

    mppChatSend(PRE_SETTINGS + " Sustain set to " + (sustainOption ? "MIDI controlled" : "MPP controlled"));
}
var percussion = function() {
    // turns on or off percussion instruments
    percussionOption = !percussionOption;

    mppChatSend(PRE_SETTINGS + ' '+ (percussionOption ? "En" : "Dis") + "abled percussion instruments");
}
var loading = function(userId, yourId) {
    // only let the bot owner set if loading music should be on or not
    if (userId != yourId) return;
    loadingOption = !loadingOption;
    mppChatSend(PRE_SETTINGS + " The MIDI loading progress is now set to " + (loadingOption ? "audio" : "text"));
}
var public = function(userId, yourId) {
    // only let the bot owner set if public bot commands should be on or not
    if (userId != yourId) return;
    publicOption = !publicOption;
    mppChatSend(PRE_SETTINGS + " Public bot commands were turned " + (publicOption ? "on" : "off"));
}

// =============================================== MAIN

Player.on('fileLoaded', function() {
    // Do something when file is loaded
    stopLoadingMusic();
});
MPP.client.on('a', function (msg) {
    // if user switches to VPN, these need to update
    var yourParticipant = MPP.client.getOwnParticipant();
    var yourId = yourParticipant._id;
    var yourUsername = yourParticipant.name;
    // get the message as string
    var input = msg.a.trim();
    var participant = msg.p;
    var username = participant.name;
    var userId = participant._id;

    // check if ping
    if (userId == yourId && pinging && input == PRE_PING) {
        pinging = false;
        pingTime = Date.now() - pingTime;
        mppChatSend("Pong! [" + pingTime + "ms]", 0 );
    }

    // make sure the start of the input matches prefix
    if (input.startsWith(PREFIX)) {
        // don't allow banned or limited users to use the bot
        var bannedPlayers = BANNED_PLAYERS.length;
        if (bannedPlayers > 0) {
            var i;
            for(i = 0; i < BANNED_PLAYERS.length; ++i) {
                if (BANNED_PLAYERS[i] == userId) {
                    playerLimited(username);
                    return;
                }
            }
        }
        var limitedPlayers = LIMITED_PLAYERS.length;
        if (limitedPlayers > 0) {
            var j;
            for(j = 0; j < LIMITED_PLAYERS.length; ++j) {
                if (LIMITED_PLAYERS[j] == userId) {
                    playerLimited(username);
                    return;
                }
            }
        }
        // evaluate input into command and possible arguments
        var message = input.substring(PREFIX_LENGTH).trim();
        var hasArgs = message.indexOf(' ');
        var command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        var argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1).trim() : null;
        // look through commands
        var isBotOwner = userId == yourId;
        var preventsPlaying = MPP.client.preventsPlaying();
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
            case "song": case "so": if ((isBotOwner || publicOption) && !preventsPlaying) song(true); break;
            case "repeat": case "re": if ((isBotOwner || publicOption) && !preventsPlaying) repeat(); break;
            case "sustain": case "ss": if ((isBotOwner || publicOption) && !preventsPlaying) sustain(); break;
            case "percussion": case "pe": if ((isBotOwner || publicOption) && !preventsPlaying) percussion(); break;
            case "loading": case "lo": loading(userId, yourId); break;
            case BOT_ACTIVATOR: public(userId, yourId); break;
        }
    }
});
MPP.client.on("ch", function(msg) {
    // set new chat delay based on room ownership after changing rooms
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
    // update current room info
    var newRoom = MPP.client.channel._id;
    if (currentRoom != newRoom) {
        currentRoom = MPP.client.channel._id;
        // stop any songs that might have been playing before changing rooms
        if (currentRoom.toUpperCase().indexOf(BOT_KEYWORD) == -1) stopSong();
    }
});
MPP.client.on('p', function(msg) {
    var userId = msg._id;
    // kick ban all the banned players
    var bannedPlayers = BANNED_PLAYERS.length;
    if (bannedPlayers > 0) {
        var i;
        for(i = 0; i < BANNED_PLAYERS.length; ++i) {
            var bannedPlayer = BANNED_PLAYERS[i];
            if (userId == bannedPlayer) MPP.client.sendArray([{m: "kickban", _id: bannedPlayer, ms: 3600000}]);
        }
    }
});

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. repeat)
var repeatingTasks = setInterval(function() {
    if (MPP.client.preventsPlaying()) return;
    // display song progression status and end/done status
    if (exists(currentSongName) && currentSongName != "") {
        var tempCurrentSongProgress0to10 = getElapsedProgressInt0to10(currentSongEventsPlayed, currentSongTotalEvents);
        if (tempCurrentSongProgress0to10 != currentSongProgress0to10) {
            currentSongProgress0to10 = tempCurrentSongProgress0to10;
            song();
        }
    }
    if (finishedSongName) {
        mppChatSend(PRE_MSG + ' `' + BAR_DONE_PLAYING + ' ' + BAR_ARROW_RIGHT + ' ' + quoteString(finishedSongName) + '`');
        finishedSongName = null;
    }
    // do repeat
    if (repeatOption && ended && !stopped && exists(currentSongName) && exists(currentSongData)) {
        ended = false;
        // nice delay before playing song again
        setTimeout(function() {Player.play()}, REPEAT_DELAY);
    }
}, 1);
var dynamicButtonDisplacement = setInterval(function() {
    // required when other ugly-button's change visibility
    var allUglyBtns = [];
    [...document.querySelectorAll(QUERY_BOTTOM_UGLY_BTNS)].forEach(uglyBtn => {
        if (uglyBtn.offsetWidth > 0 || uglyBtn.offsetHeight > 0 || uglyBtn.getClientRects().length > 0) allUglyBtns.push(uglyBtn);
    });
    var topOffset = allUglyBtns[0].offsetTop;
    var bottomOffset = allUglyBtns[0].offsetTop;
    for (let i = 1; i < allUglyBtns.length; i++) {
        let uglyBtn = allUglyBtns[i];
        if (uglyBtn.offsetTop > bottomOffset) bottomOffset = uglyBtn.offsetTop;
        else if (uglyBtn.offsetTop < topOffset) topOffset = uglyBtn.offsetTop;
    }
    var topUglyBtns = [];
    var bottomUglyBtns = [];
    allUglyBtns.forEach(uglyBtn => {
        if (uglyBtn.offsetTop == topOffset) topUglyBtns.push(uglyBtn);
        if (uglyBtn.offsetTop == bottomOffset) bottomUglyBtns.push(uglyBtn);
    });
    // find top and bottom buttons furthest to the right (that are visible)
    var topRightMostBtn = topUglyBtns.reduce((prev, current) => (prev.offsetLeft > current.offsetLeft) ? prev : current);
    var bottomRightMostBtn = bottomUglyBtns.reduce((prev, current) => (prev.offsetLeft > current.offsetLeft) ? prev : current);
    // determine from buttons which one is farthest right
    var rightMostBtn = topRightMostBtn;
    if (topRightMostBtn.offsetLeft < bottomRightMostBtn.offsetLeft) rightMostBtn = bottomRightMostBtn;
    // need to find displacements after
    var displacement = { x: allUglyBtns[1].offsetLeft - allUglyBtns[0].offsetLeft,
                         y: bottomRightMostBtn.offsetTop - topRightMostBtn.offsetTop};
    // then we can finally generate initial placements
    var initial = { x: (topRightMostBtn.offsetLeft == bottomRightMostBtn.offsetLeft) ? rightMostBtn.offsetLeft + displacement.x : rightMostBtn.offsetLeft,
                    y: topRightMostBtn.offsetTop};
    // toggle button has a special case as to fit between pre existing buttons
    var toggleInitialY = initial.y + ((topRightMostBtn.offsetLeft > bottomRightMostBtn.offsetLeft) ? displacement.y : 0);
    // set CSS displacement values and initial locations
    document.documentElement.style.setProperty(CSS_VARIABLE_X_DISPLACEMENT, displacement.x + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_DISPLACEMENT, displacement.y + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_X_INITIAL, initial.x + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_INITIAL, initial.y + "px");
    document.documentElement.style.setProperty(CSS_VARIABLE_Y_TOGGLE_INITIAL, toggleInitialY + "px");
}, TENTH_OF_SECOND);
var slowRepeatingTasks = setInterval(function() {
    // do background tab fix
    if (!pageVisible) {
        var note = MPP.piano.keys["a-1"].note;
        var participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SECOND);

// Automatically turns off the sound warning (mainly for autoplay)
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);

        // only turn off sound warning if it hasn't already been turned off
        if (window.getComputedStyle(playButton).display == "block") playButton.click();

        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id) && MPP.client.channel._id != "") {
                clearInterval(waitForMPP);

                currentRoom = MPP.client.channel._id;
                if (currentRoom.toUpperCase().indexOf(BOT_KEYWORD) >= 0) {
                    loadingOption = publicOption = true;
                }
                createButtons();
                console.log(PRE_MSG + " Online!");
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
