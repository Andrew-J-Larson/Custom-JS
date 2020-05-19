// ==UserScript==
// @name         MIDI Player Bot
// @namespace    https://thealiendrew.github.io/
// @version      2.0.7
// @description  Plays MIDI files by URL (anyone), or by upload (bot owner only)!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-MIDI-Player-Bot/MPP-MIDI-Player-Bot.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-MIDI-Player-Bot/favicon.png
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     MIDIPlayerJS https://raw.githubusercontent.com/grimmdude/MidiPlayerJS/master/browser/midiplayer.js
// @run-at       document-end
// @noframes
// ==/UserScript==

/* globals MPP, MidiPlayer */

// =============================================== FILES

// midiplayer.js via https://github.com/grimmdude/MidiPlayerJS
// (but I should maybe switch to https://github.com/mudcube/MIDI.js OR https://github.com/Tonejs/Midi)
var stringMIDIPlayerJS = GM_getResourceText("MIDIPlayerJS");
var scriptMIDIPlayerJS = document.createElement("script");
scriptMIDIPlayerJS.type = 'text/javascript';
scriptMIDIPlayerJS.appendChild(document.createTextNode(stringMIDIPlayerJS));
(document.body || document.head || document.documentElement).appendChild(scriptMIDIPlayerJS);

// =============================================== CONSTANTS

// Script constants
const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;
const DOWNLOAD_URL = SCRIPT.downloadURL;

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered
const END_SONG_DELAY = SECOND; // makes transitioning songs in autoplay feel better

// URLs
const FEEDBACK_URL = "https://forms.gle/x4nqjynmRMEN2GSG7";

// Players listed by IDs (these are the _id strings)
const BANNED_PLAYERS = ["98a00e1626613fa4a683c14e"];
const LIMITED_PLAYERS = ["1251d6256fc2264660957fb9"];

// MPP Constants (these are not meant to be changed); roomcolor arrays: [0] = inner, [1] = outer
const MPP_DEFAULT_ROOMCOLORS = ["rgb(59, 80, 84)", "rgb(0, 16, 20)"];
const MPP_LOBBY_ROOMCOLORS = ["rgb(115, 179, 204)", "rgb(39, 53, 70)"];

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const INNER_ROOM_COLOR = 0; // used in room color settings (DON'T CHANGE)
const OUTER_ROOM_COLOR = 1; // used in room color settings (DON'T CHANGE)
const PERCUSSION_CHANNEL = 10; // (DON'T CHANGE)

// Bot constant settings
const ALLOW_ALL_INTRUMENTS = false; // removes percussion instruments (turning this on makes a lot of MIDIs sound bad)
const CLEAR_LINES = 9; // may be changed if needed, but this number seems to be the magic number
const CLEAR_TEXT = "—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬";
const CHANGE_NAME = false; // allows the bot to change your name to the bot's name
const BOT_ROOM_COLORS = ["#000000", "#046307"]; // these are the colors the bot will set the room to by default
const BOT_SOLO_PLAY = true; // sets what play mode when the bot boots up on an owned room

// Bot custom constants
const PREFIX = "/";
const PREFIX_LENGTH = PREFIX.length;
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS library."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["play [URL]", "plays a specific song (URL must be a direct link)"],
    ["stop", "stops all music from playing"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat", "toggles repeating current song on or off"],
    ["sustain", "toggles how sustain is controlled via either MIDI or by MPP"],
    ["roomcolor (command)", "displays info about room color command, but no command shows the room color commands and special color options"],
    ["clear", "clears the chat"],
    ["ping", "gets the milliseconds response time"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["active", "toggles the public bot commands on or off (owner only)"]
];
const ROOMCOLOR_OPTIONS = "Options: normal [bot set room color(s)], default [the MPP general room color(s)], lobby [the MPP lobby room color(s)], but entering nothing shows the current color(s)";
const ROOMCOLOR_COMMANDS = [
    ["roomcolor1 (option/color)", "sets the inner room color"],
    ["roomcolor2 (option/color)", "sets the outer room color"],
    ["roomcolors (option/color)", "sets both the inner and outer room colors (one color)"],
    ["roomcolors ([color1] [color2])", "sets both the inner and outer room colors (separate colors)"]
];
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_PLAY = PRE_MSG + "[Play]";
const PRE_STOP = PRE_MSG + "[Stop]";
const PRE_PAUSE = PRE_MSG + "[Pause]";
const PRE_RESUME = PRE_MSG + "[Resume]";
const PRE_SONG = PRE_MSG + "[Song]";
const PRE_REPEAT = PRE_MSG + "[Repeat]";
const PRE_SUSTAIN = PRE_MSG + "[Sustain]";
const PRE_ROOMCOLOR = PRE_MSG + "[Roomcolor]";
const PRE_DOWNLOADING = PRE_MSG + "[Downloading]";
const PRE_PING = PRE_MSG + "[Ping]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_ACTIVE = PRE_MSG + "[Active]";
const PRE_LIMITED = PRE_MSG + "Limited!";
const PRE_ERROR = PRE_MSG + "Error!";
const WHERE_TO_FIND_MIDIS = "You can find some good MIDIs to upload at https://bitmidi.com/ and https://midiworld.com/, or you can upload your own at a site like https://www.file.io/";
const NOT_OWNER = "The bot isn't the owner of the room";
const NO_SONG = "Not currently playing anything";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";

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

var active = false; // turn off the bot commands if needed
var preventsPlaying = false // changes when it detects prevention
var pinging = false; // helps aid in getting response time
var pingTime = 0; // changes after each ping
var currentRoom = null; // updates when it connects to room
var chatDelay = CHAT_DELAY; // for how long to wait until posting another message
var endDelay; // used in multiline chats send commands

var ended = true;
var stopped = false;
var paused = false;
var uploadButton = null; // this get's an element after it's loaded
var currentSongElapsedFormatted = "00:00"; // changes with the amount of song being played
var currentSongDurationFormatted = "00:00"; // gets updated when currentSongDuration is updated
var currentSongDuration = 0; // this changes after each song is loaded
var currentSongData = null; // this contains the song as a data URI
var currentFileLocation = null; // this leads to the MIDI location (local or by URL)
var currentSongName = null; // extracted from the file name/end of URL
var previousSongData = null; // grabs current when changing successfully
var previousSongName = null; // grabs current when changing successfully
var repeatOption = false; // allows for repeat of one song
var sustainOption = true; // makes notes end according to the midi file

// =============================================== OBJECTS

// The MIDIPlayer
var Player = new MidiPlayer.Player(function(event) {
    preventsPlaying = MPP.client.preventsPlaying();
    if (preventsPlaying) return;
    var currentEvent = event.name;
    if (!exists(currentEvent) || currentEvent == "") return;
    if (currentEvent == "Set Tempo") { // fixes tempo on some songs
        Player.pause();
        Player.setTempo(event.data);
        Player.play();
    } else if (currentEvent.indexOf("Note") == 0 && (ALLOW_ALL_INTRUMENTS || event.channel != PERCUSSION_CHANNEL)) {
        var currentNote = null;
        if (currentEvent == "Note on" && event.velocity > 0) { // start note
            currentNote = MIDIPlayerToMPPNote[event.noteName];
            MPP.press(currentNote, (event.velocity/100));
        } else if (sustainOption && (currentEvent == "Note off" || (currentEvent == "Note on" && event.velocity == 0))) MPP.release(currentNote); // end note
    }
    if (!ended && !Player.isPlaying()) {
        ended = true;
        paused = false;
        if (!repeatOption) {
            currentSongData = null;
            currentSongName = null;
        }
    } else {
        var timeRemaining = Player.getSongTimeRemaining();
        var timeElapsed = currentSongDuration - (timeRemaining > 0 ? timeRemaining : 0);
        currentSongElapsedFormatted = timeSizeFormat(secondsToHms(timeElapsed), currentSongDurationFormatted);
    }
});

// =============================================== FUNCTIONS

// CORS Anywhere (allows downloading files where JS can't)
var useCorsUrl = function(url) {
    var newUrl = null; // send null back if it's already a cors url
    var cors_api_url = 'https://cors-anywhere.herokuapp.com/';
    // removes protocols before applying cors api url
    if (url.indexOf(cors_api_url) == -1) newUrl = cors_api_url + url.replace(/(^\w+:|^)\/\//, '');
    return newUrl;
}

// Get visual loading progress, just enter the current progressing number (usually time elapsed in seconds)
var getProgress = function(intProgress) {
    var progress = intProgress % 20;
    switch(progress) {
        case 0: return " █░░░░░░░░░░"; break;
        case 1: case 19: return " ░█░░░░░░░░░"; break;
        case 2: case 18: return " ░░█░░░░░░░░"; break;
        case 3: case 17: return " ░░░█░░░░░░░"; break;
        case 4: case 16: return " ░░░░█░░░░░░"; break;
        case 5: case 15: return " ░░░░░█░░░░░"; break;
        case 6: case 14: return " ░░░░░░█░░░░"; break;
        case 7: case 13: return " ░░░░░░░█░░░"; break;
        case 8: case 12: return " ░░░░░░░░█░░"; break;
        case 9: case 11: return " ░░░░░░░░░█░"; break;
        case 10: return " ░░░░░░░░░░█"; break;
    }
}

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Format time to HH:MM:SS from seconds
var secondsToHms = function(d) {
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
}

// Takes formatted time and removed preceeding zeros (only before minutes)
var timeClearZeros = function(formattedHms) {
    var newTime = formattedHms;
    while (newTime.length > 5 && newTime.indexOf("00:") == 0) {
        newTime = newTime.substring(3);
    }
    return newTime;
}

// Resizes a formatted HH:MM:SS time to the second formatted time
var timeSizeFormat = function(timeCurrent, timeEnd) {
    var newTimeFormat = timeCurrent;
    var timeCurrentLength = timeCurrent.length;
    var timeEndLength = timeEnd.length;
    // lose or add 00's
    if (timeCurrentLength > timeEndLength) newTimeFormat = timeCurrent.substring(timeCurrentLength - timeEndLength);
    while (newTimeFormat.length < timeEndLength) {
        newTimeFormat = "00:" + newTimeFormat;
    }
    return newTimeFormat;
}

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

// Validates colors
var isColor = function(strColor){
    // no need to test if color exists
    var s = new Option().style;
    s.color = strColor;
    var result = s.color != "";
    if (!result) {
        var output = "Invalid color";
        if (exists(strColor) && strColor != "") console.log(output + ": " + strColor);
        else console.log(output + '.');
    }
    return result;
}

// Checks to see if HEX color is valid
var isHexColor = function(strColor) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(strColor);
}

// Convert HSL to HEX color
var HSLToHex = function(hsl) {
    let sep = hsl.indexOf(",") > -1 ? "," : " ";
    hsl = hsl.substr(4).split(")")[0].split(sep);

    let h = hsl[0],
        s = hsl[1].substr(0,hsl[1].length - 1) / 100,
        l = hsl[2].substr(0,hsl[2].length - 1) / 100,
        c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
}

// Convert RGB to HEX color
var RGBToHex = function(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substr(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
}

// Get CSS color name as HEX color
var colorToHEX = function(strColor) {
    if (!isColor(strColor)) return null;
    strColor = strColor.toLowerCase();
    if (isHexColor(strColor)) {
        // must convert hex to full 6 hexadecimal value
        if (strColor.length == 4) {
            var r = strColor.substring(1, 2);
            var g = strColor.substring(2, 3);
            var b = strColor.substring(3, 4);

            strColor = '#' + r + r + g + g + b + b;
        }
        return strColor;
    }

    // Create fake div
    let fakeDiv = document.createElement("div");
    fakeDiv.style.color = strColor;
    document.body.appendChild(fakeDiv);

    // Get color of div
    let cs = window.getComputedStyle(fakeDiv),
        pv = cs.getPropertyValue("color");

    // Remove div after obtaining desired color value
    document.body.removeChild(fakeDiv);

    // Convert to hex now that we have color values
    pv = pv.toLowerCase();
    if (pv.indexOf("rgb") == 0) pv = RGBToHex(pv);
    else if (pv.indexOf("hsl") == 0) pv = HSLToHex(pv);
    // else it must be HEX now

    return pv;
}

// Gets file as a blob (data URI)
var urlToBlob = function(url, callback) {
    // show file download progress
    var progress = 0;
    var downloading = setInterval(function() {
        var showProgress = getProgress(progress);
        progress++;
        mppChatSend(PRE_DOWNLOADING + showProgress, 0);
    }, chatDelay);

    fetch(url, {
        headers: {
            "Content-Disposition": "attachment" // this might not be doing anything
        }
    }).then(response => {
        clearInterval(downloading);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.blob();
    }).then(blob => {
        clearInterval(downloading);
        callback(blob);
    }).catch(error => {
        console.error("Normal fetch couldn't get the file:", error);
        var corsUrl = useCorsUrl(url);
        if (corsUrl != null) {
            fetch(corsUrl, {
                headers: {
                    "Content-Disposition": "attachment" // this might not be doing anything
                }
            }).then(response => {
                clearInterval(downloading);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.blob();
            }).then(blob => {
                clearInterval(downloading);
                callback(blob);
            }).catch(error => {
                console.error("CORS Anywhere API fetch couldn't get the file:", error);
                clearInterval(downloading);
                callback(null);
            });
        }
        // callback(null); // disabled since the second fetch already should call the call back
    });
}

// Converts files/blobs to base64 (data URI)
var fileOrBlobToBase64 = function(raw, callback) {
    if (raw == null) callback(null);

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

// Set the bot on or off (only from bot)
var setActive = function(userId, yourId) {
    if (userId != yourId) return;
    active = !active;
    mppChatSend(PRE_ACTIVE + " Public bot commands were turned " + (active ? "on" : "off"), 0);
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
    setTimeout(function(){MPP.chat.send(str)}, delay);
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
        currentSongElapsedFormatted = timeSizeFormat(secondsToHms(0), currentSongDurationFormatted);
        ended = true;
    }
}

// Gets song from data URI and plays it
var playSong = function(songName, songData) {
    // stop any current songs from playing
    stopSong();
    // play song if it loaded correctly
    try {
        // load song
        Player.loadDataUri(songData);
        // changes song
        previousSongData = currentSongData;
        previousSongName = currentSongName;
        currentSongData = songData;
        currentSongName = songName;
        currentSongDuration = Player.getSongTime();
        currentSongDurationFormatted = timeClearZeros(secondsToHms(currentSongDuration));
        ended = false;
        stopped = false;
        Player.play();
        currentSongElapsedFormatted = timeSizeFormat(secondsToHms(0), currentSongDurationFormatted);
        mppChatSend(PRE_PLAY + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted) + " Now playing " + quoteString(currentSongName), 0);
    } catch(error) {
        // reload the previous working file if there is one
        if (previousSongData != null) Player.loadDataUri(previousSongData);
        mppChatSend(PRE_ERROR + " (play) " + error, 0);
    }
}

// Plays the song from a URL if it's a MIDI
var playURL = function(songUrl, songData) {
    currentFileLocation = songUrl;
    playSong(currentFileLocation.substring(currentFileLocation.lastIndexOf('/') + 1), songData);
}

// Plays the song from an uploaded file if it's a MIDI
var playFile = function(songFile) {
    var songName = null;

    var error = PRE_ERROR + " (play)";
    // load in the file
    if (exists(songFile)) {
        songName = songFile.name.split(/(\\|\/)/g).pop();
        if (isMidi(songFile)) {
            fileOrBlobToBase64(songFile, function(base64data) {
                // play song only if we got data
                if (exists(base64data)) {
                    currentFileLocation = songFile.name;
                    playSong(songName, base64data);
                    uploadButton.value = ""; // reset file input
                } else mppChatSend(error + " Unexpected result, MIDI file couldn't load", 0);
            });
        } else mppChatSend(error + " The file choosen, is either corrupted, or it's not really a MIDI file", 0);
    } else mppChatSend(error + " MIDI file not found", 0);
}

// Change the room colors
var roomColorAreaToString = function(area) {
    // send string value from room color area number value
    switch(area) {
        case INNER_ROOM_COLOR: return "inner"; break;
        case OUTER_ROOM_COLOR: return "outer"; break;
        default: return "unknown"; break; // shouldn't ever get here
    }
}
var currentRoomColor = function(area) {
    // shows the current color of ths choosen room area
    var color = null;

    if (area == INNER_ROOM_COLOR) {
        color = MPP.client.channel.settings.color;
    } else if (area == OUTER_ROOM_COLOR) {
        color = MPP.client.channel.settings.color2;
    }

    // backup solution in the case of colors not set in the room setting
    if (!exists(color)) {
        var background = document.body.style.background;
        var rgb1StartIndex = background.indexOf("rgb(");
        var rgb1EndIndex = background.indexOf(')', rgb1StartIndex + 4) + 1;
        if (area == INNER_ROOM_COLOR) {
            color = background.substring(rgb1StartIndex, rgb1EndIndex);
        } else if (area == OUTER_ROOM_COLOR) {
            var rgb2StartIndex = background.indexOf("rgb(", rgb1EndIndex);
            var rgb2EndIndex = background.indexOf(')', rgb2StartIndex + 4) + 1;
            color = background.substring(rgb2StartIndex, rgb2EndIndex);
        }
    }

    return color;
}
var getRoomColorArea = function(area) {
    // get area we are setting a color to
    var valid = null;
    if (exists(area)) { // don't continue if value is already correct
        switch(area) {
            case INNER_ROOM_COLOR:
            case OUTER_ROOM_COLOR: return area; break;
        }
        // fix string if not value
        if (area != "") valid = area.toLowerCase();
    }
    var result = null;
    var output = "";

    switch(valid) {
        case "inner": case "inside": case "center": case "1": result = INNER_ROOM_COLOR; break;
        case "outer": case "outside": case "outskirts": case "2": result = OUTER_ROOM_COLOR; break;
        default: console.log("Invalid area: " + quoteString(area)); break;
    }

    if (valid != null) console.log(output + '.'); return null;
    return result;
}
var getRoomColorSet = function(area, color) {
    // get the set we need to change area color
    var validArea = getRoomColorArea(area);
    var validColor = colorToHEX(color);
    var result = null;
    var output = null;

    switch(validArea) {
        case INNER_ROOM_COLOR:
        case OUTER_ROOM_COLOR: output = roomColorAreaToString(validArea); break;
    }
    switch(validArea) {
        case INNER_ROOM_COLOR: result = {color: validColor, color2: colorToHEX(currentRoomColor(OUTER_ROOM_COLOR))}; break; // second color gets reset without setting it with first color
        case OUTER_ROOM_COLOR: result = {color2: validColor}; break;
    }

    if (output != null) {
        output = output.charAt(0).toUpperCase() + output.slice(1);
        output += " color will be set to: " + color;
        console.log(output);
    }
    return result;
}
var getRoomColorsSet = function(color1, color2) {
    // get the set we need to change colors
    var validColor1 = colorToHEX(color1);
    var validColor2 = colorToHEX(color2);
    var result = null;
    var output = null;

    if (validColor1 != null && validColor2 != null) result = {color: validColor1, color2: validColor2};
    else if (validColor1 != null) result = {color: validColor1, color2: colorToHEX(currentRoomColor(OUTER_ROOM_COLOR))}; // second color gets reset without setting it with first color
    else if (validColor2 != null) result = {color2: validColor2};

    if (validColor1 != null) output = "Room " + roomColorAreaToString(INNER_ROOM_COLOR) + " color will be set to: " + color1;
    if (validColor2 != null) output += (output == null ? "" : "\n") + "Room " + roomColorAreaToString(OUTER_ROOM_COLOR) + " color will be set to: " + color2;

    if (output != null) console.log(output);
    return result;
}
var setRoomColor = function(area, color) {
    // set color based on inner or outer area
    var isOwner = MPP.client.isOwner();

    var set = getRoomColorSet(area, color);
    if (isOwner && set != null) {
        MPP.client.sendArray([{m: "chset", set: set}]);
        return true;
    } else { // room ownership (other errors are logged from other functions)
        if (!isOwner) console.log(NOT_OWNER);
        return false;
    }
}
var setRoomColors = function(color1, color2) {
    // set both inner and outer colors
    var isOwner = MPP.client.isOwner();

    var set = getRoomColorsSet(color1, color2);
    if (isOwner && set != null) {
        MPP.client.sendArray([{m: "chset", set: set}]);
        return true;
    } else { // room ownership (other errors are logged from other functions)
        if (!isOwner) console.log(NOT_OWNER);
        return false;
    }
}
var mppRoomColorSend = function(area, color, delay) { // area is the INNER or OUTER constant
    // check the color string for defaults or show color
    if (exists(color) && color != "") {
        var checkColor = (color != "") ? color.toLowerCase() : "normal";
        switch(checkColor) {
            case "normal": color = BOT_ROOM_COLORS[area]; break;
            case "default": case "mpp": color = MPP_DEFAULT_ROOMCOLORS[area]; break;
            case "lobby": case "test": color = MPP_LOBBY_ROOMCOLORS[area]; break;
        }

        if (!setRoomColor(area, color)) mppChatSend(PRE_ERROR + " (roomcolor" + (area + 1) + ") Invalid " + roomColorAreaToString(area) + " room color", delay);
    } else {
        color = currentRoomColor(area);
        mppChatSend(PRE_ROOMCOLOR + " The " + roomColorAreaToString(area) + " room color is currently set to " + color, delay);
    }
}

// Creates the play, pause, resume, and stop button for the bot
var createButtons = function() {
    const PRE_ELEMENT_ID = "aliendrew-midi-player-bot";
    // buttons have some constant styles/classes
    const ELEM_ON = "display:block;";
    const ELEM_OFF = "display:none;";
    const ELEM_POS = "position:absolute;";
    const BTN_PAD_LEFT = 8; // pixels
    const BTN_PAD_TOP = 4; // pixels
    const BTN_WIDTH = 112; // pixels
    const BTN_HEIGHT = 24; // pixels
    const BTN_SPACER_X = BTN_PAD_LEFT + BTN_WIDTH; //pixels
    const BTN_SPACER_Y = BTN_PAD_TOP + BTN_HEIGHT; //pixels
    const BTNS_START_X = 300; //pixels
    const BTNS_END_X = BTNS_START_X + 4 * BTN_SPACER_X; //pixels
    const BTNS_TOP_0 = BTN_PAD_TOP; //pixels
    const BTNS_TOP_1 = BTN_PAD_TOP + BTN_SPACER_Y; //pixels
    const BTN_STYLE = ELEM_POS + ELEM_OFF;
    // need the bottom area to append buttons to
    var buttonContainer = document.querySelector("#bottom div");
    // we need to keep track of the next button locations
    var nextLocationX = BTNS_END_X;

    // play needs the div like all the other buttons
    // PLAY
    var playDiv = document.createElement("div");
    playDiv.id = PRE_ELEMENT_ID + "-play";
    playDiv.style = BTN_STYLE + "top:" + BTNS_TOP_0 + "px;left:" + nextLocationX + "px;";
    playDiv.classList.add("ugly-button");
    buttonContainer.appendChild(playDiv);
    // since we need upload files, there also needs to be an input element inside the play div
    var uploadBtn = document.createElement("input");
    uploadBtn.id = PRE_ELEMENT_ID + "-upload";
    uploadBtn.style = "opacity:0;filter:alpha(opacity=0);position:absolute;top:0;left:0;width:110px;height:22px;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;";
    uploadBtn.title = " "; // removes the "No file choosen" tooltip
    uploadBtn.type = "file";
    uploadBtn.accept = ".mid,.midi";
    uploadBtn.onchange = function() {
        preventsPlaying = MPP.client.preventsPlaying();
        if (!preventsPlaying && uploadBtn.files.length > 0) playFile(uploadBtn.files[0]);
        else console.log("No MIDI file selected");
    }
    var uploadTxt = document.createTextNode("Play");
    playDiv.appendChild(uploadBtn);
    playDiv.appendChild(uploadTxt);
    // then we need to let the rest of the script know it so it can reset it after loading files
    uploadButton = uploadBtn;

    // other buttons can work fine without major adjustments
    // STOP
    nextLocationX += BTN_SPACER_X;
    var stopDiv = document.createElement("div");
    stopDiv.id = PRE_ELEMENT_ID + "-stop";
    stopDiv.style = BTN_STYLE + "top:" + BTNS_TOP_0 + "px;left:" + nextLocationX + "px;";
    stopDiv.classList.add("ugly-button");
    stopDiv.onclick = function() {
        preventsPlaying = MPP.client.preventsPlaying();
        if (!preventsPlaying) stop();
    }
    var stopTxt = document.createTextNode("Stop");
    stopDiv.appendChild(stopTxt);
    buttonContainer.appendChild(stopDiv);
    // REPEAT
    nextLocationX += BTN_SPACER_X;
    var repeatDiv = document.createElement("div");
    repeatDiv.id = PRE_ELEMENT_ID + "-repeat";
    repeatDiv.style = BTN_STYLE + "top:" + BTNS_TOP_0 + "px;left:" + nextLocationX + "px;";
    repeatDiv.classList.add("ugly-button");
    repeatDiv.onclick = function() {
        preventsPlaying = MPP.client.preventsPlaying();
        if (!preventsPlaying) repeat();
    }
    var repeatTxt = document.createTextNode("Repeat");
    repeatDiv.appendChild(repeatTxt);
    buttonContainer.appendChild(repeatDiv);
    // PAUSE
    nextLocationX = BTNS_END_X;
    var pauseDiv = document.createElement("div");
    pauseDiv.id = PRE_ELEMENT_ID + "-pause";
    pauseDiv.style = BTN_STYLE + "top:" + BTNS_TOP_1 + "px;left:" + nextLocationX + "px;";
    pauseDiv.classList.add("ugly-button");
    pauseDiv.onclick = function() {
        preventsPlaying = MPP.client.preventsPlaying();
        if (!preventsPlaying) pause();
    }
    var pauseTxt = document.createTextNode("Pause");
    pauseDiv.appendChild(pauseTxt);
    buttonContainer.appendChild(pauseDiv);
    // RESUME
    nextLocationX += BTN_SPACER_X;
    var resumeDiv = document.createElement("div");
    resumeDiv.id = PRE_ELEMENT_ID + "-resume";
    resumeDiv.style = BTN_STYLE + "top:" + BTNS_TOP_1 + "px;left:" + nextLocationX + "px;";
    resumeDiv.classList.add("ugly-button");
    resumeDiv.onclick = function() {
        preventsPlaying = MPP.client.preventsPlaying();
        if (!preventsPlaying) resume();
    }
    var resumeTxt = document.createTextNode("Resume");
    resumeDiv.appendChild(resumeTxt);
    buttonContainer.appendChild(resumeDiv);
    // SUSTAIN
    nextLocationX += BTN_SPACER_X;
    var sustainDiv = document.createElement("div");
    sustainDiv.id = PRE_ELEMENT_ID + "-sustain";
    sustainDiv.style = BTN_STYLE + "top:" + BTNS_TOP_1 + "px;left:" + nextLocationX + "px;";
    sustainDiv.classList.add("ugly-button");
    sustainDiv.onclick = function() {
        preventsPlaying = MPP.client.preventsPlaying();
        if (!preventsPlaying) sustain();
    }
    var sustainTxt = document.createTextNode("Sustain");
    sustainDiv.appendChild(sustainTxt);
    buttonContainer.appendChild(sustainDiv);

    // one more button to toggle the visibility of the other buttons
    nextLocationX = BTNS_END_X - BTN_SPACER_X;
    var buttonsOn = false;
    var togglerDiv = document.createElement("div");
    togglerDiv.id = PRE_ELEMENT_ID + "-toggler";
    togglerDiv.style = ELEM_POS + ELEM_ON + "top:" + BTNS_TOP_1 + "px;left:" + nextLocationX + "px;";
    togglerDiv.classList.add("ugly-button");
    togglerDiv.onclick = function() {
        if (buttonsOn) { // if on, then turn off, else turn on
            playDiv.style.display =
            stopDiv.style.display =
            repeatDiv.style.display =
            pauseDiv.style.display =
            resumeDiv.style.display =
            sustainDiv.style.display = "none";
            buttonsOn = false;
        } else {
            playDiv.style.display =
            stopDiv.style.display =
            repeatDiv.style.display =
            pauseDiv.style.display =
            resumeDiv.style.display =
            sustainDiv.style.display = "block";
            buttonsOn = true;
        }
    }
    var togglerTxt = document.createTextNode(NAME);
    togglerDiv.appendChild(togglerTxt);
    buttonContainer.appendChild(togglerDiv);
}

// Sets the name of the bot
var setOwnerUsername = function(username) {
    if (exists(username) && username != "") {
        var set = {name: username};
        MPP.client.sendArray([{m: "userset", set: set}]);
        console.log("Username set to " + quoteString(username));
        return true;
    } else {
        console.log("Invalid username. Username wasn't set.");
        return false;
    }
}

// Sends back the current time in the song against total time
var getSongTimesFormatted = function(elapsed, duration) {
    return '[' + elapsed + " / " + duration + ']';
}

// Shows limited message for user
var playerLimited = function(username) {
    // displays message with their name about being limited
    mppChatSend(PRE_LIMITED + " You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the bot", 0);
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    var error = PRE_ERROR;
    // if cmd is empty somehow, show it
    if (exists(cmd) && cmd != "") {
        // if we're in the fishing room, ignore the fishing commands
        error += " Invalid command, " + quoteString(cmd) + " doesn't exist";
        cmd = cmd.toLowerCase();
    } else error += " No command entered";
    if (currentRoom == "test/fishing") console.log(error);
    else mppChatSend(error, 0);
}

// Commands
var help = function(command) {
    if (!exists(command) || command == "") mppChatSend(PRE_HELP + " Commands: " + formattedCommands(COMMANDS, LIST_BULLET + PREFIX, true), 0);
    else {
        var valid = null;
        var commandIndex = null;
        command = command.toLowerCase();
        // check commands array
        var i;
        for(i = 0; i < COMMANDS.length; ++i) {
            if (COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandIndex = i;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(COMMANDS, commandIndex), 0);
        else cmdNotFound(command);
    }
}
var about = function() {
    mppChatSend(PRE_ABOUT + ' '+ BOT_DESCRIPTION, 0);
    mppChatSend(BOT_AUTHOR + ' ' + BOT_NAMESPACE, 0);
}
var link = function() {
    mppChatSend(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
}
var play = function(url) {
    var error = PRE_ERROR + " (play)";
    // URL needs to be entered to play a song
    if (!exists(url) || url == "") mppChatSend(error + " No MIDI url entered... " + WHERE_TO_FIND_MIDIS, 0);
    else {
        // downloads file if possible and then plays it if it's a MIDI
        urlToBlob(url, function(blob) {
            if (blob == null) mppChatSend(error + " Invalid URL, this is not a MIDI file, or the file requires a manual download from " + quoteString(url) + "... " + WHERE_TO_FIND_MIDIS, 0);
            else if (isMidi(blob) || isOctetStream(blob)) {
                fileOrBlobToBase64(blob, function(base64data) {
                    // play song only if we got data
                    if (exists(base64data)) {
                        if (isOctetStream(blob)) { // when download with CORS, need to replace mimetype, but it doesn't guarantee it's a MIDI file
                            base64data = base64data.replace("application/octet-stream", "audio/midi");
                        }
                        playURL(url, base64data);
                    } else mppChatSend(error + " Unexpected result, MIDI file couldn't load", 0);
                });
            } else mppChatSend(error + " Invalid URL, this is not a MIDI file... " + WHERE_TO_FIND_MIDIS, 0);
        });
    }
}
var stop = function() {
    // stops the current song
    if (ended) mppChatSend(PRE_STOP + ' ' + NO_SONG, 0);
    else {
        stopSong();
        paused = false;
        mppChatSend(PRE_STOP + " Stopped playing " + quoteString(currentSongName), 0);
        currentFileLocation = currentSongName = null;
    }
}
var pause = function() {
    // pauses the current song
    if (ended) mppChatSend(PRE_PAUSE + ' ' + NO_SONG, 0);
    else {
        var title = PRE_PAUSE + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
        if (paused) mppChatSend(title + " The song is already paused", 0);
        else {
            Player.pause();
            paused = true;
            mppChatSend(title + " Paused " + quoteString(currentSongName), 0);
        }
    }
}
var resume = function() {
    // resumes the current song
    if (ended) mppChatSend(PRE_RESUME + ' ' + NO_SONG, 0);
    else {
        var title = PRE_RESUME + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
        if (paused) {
            Player.play();
            paused = false;
            mppChatSend(title + " Resumed " + quoteString(currentSongName), 0);
        } else mppChatSend(title + " The song is already playing", 0);
    }
}
var song = function() {
    // shows current song playing
    if (exists(currentSongName) && currentSongName != "") mppChatSend(PRE_SONG + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted) + " Currently " + (paused ? "paused on" : "playing") + ' ' + quoteString(currentSongName), 0);
    else mppChatSend(PRE_SONG + ' ' + NO_SONG, 0);
}
var repeat = function() {
    // turns on or off repeat
    repeatOption = !repeatOption;

    mppChatSend(PRE_REPEAT + " Repeat set to " + (repeatOption ? "" : "not") + " repeating", 0);
}
var sustain = function() {
    // turns on or off sustain
    sustainOption = !sustainOption;

    mppChatSend(PRE_SUSTAIN + " Sustain set to " + (sustainOption ? "MIDI controlled" : "MPP controlled"), 0);
}
var roomcolor = function(command) {
    if (!exists(command) || command == "") {
        mppChatSend(PRE_ROOMCOLOR + ' ' + ROOMCOLOR_OPTIONS, 0);
        mppChatSend("Commands: " + formattedCommands(ROOMCOLOR_COMMANDS, LIST_BULLET + PREFIX, true), 0);
    } else {
        var valid = null;
        var commandIndex = null;
        command = command.toLowerCase();
        // check commands array
        var i;
        for(i = 0; i < ROOMCOLOR_COMMANDS.length; ++i) {
            if (ROOMCOLOR_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandIndex = i;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(ROOMCOLOR_COMMANDS, commandIndex), 0);
        else cmdNotFound(command);
    }
}
var roomcolor1 = function(color) {
    mppRoomColorSend(INNER_ROOM_COLOR, color, 0);
}
var roomcolor2 = function(color) {
    mppRoomColorSend(OUTER_ROOM_COLOR, color, 0);
}
var roomcolors = function(argsColors) {
    // check the arguments for color string defaults or show colors
    var color1 = currentRoomColor(INNER_ROOM_COLOR);
    var color2 = currentRoomColor(OUTER_ROOM_COLOR);
    if (exists(argsColors) && argsColors.length > 0) {
        var error = PRE_ERROR + " (roomcolors)";
        // make sure extra spaces aren't being used (will show up as extra arguments)
        if (argsColors.length <= 2) {
            // get color1
            var newColor1 = argsColors[INNER_ROOM_COLOR].toLowerCase();
            switch(newColor1) {
                case "normal": color1 = BOT_ROOM_COLORS[INNER_ROOM_COLOR]; break;
                case "default": case "mpp": color1 = MPP_DEFAULT_ROOMCOLORS[INNER_ROOM_COLOR]; break;
                case "lobby": case "test": color1 = MPP_LOBBY_ROOMCOLORS[INNER_ROOM_COLOR]; break;
                default: color1 = newColor1;
            }

            // get color2
            var newColor2 = newColor1;
            if (argsColors.length > 1) newColor2 = argsColors[OUTER_ROOM_COLOR].toLowerCase();
            switch(newColor2) {
                case "normal": color2 = BOT_ROOM_COLORS[OUTER_ROOM_COLOR]; break;
                case "default": case "mpp": color2 = MPP_DEFAULT_ROOMCOLORS[OUTER_ROOM_COLOR]; break;
                case "lobby": case "test": color2 = MPP_LOBBY_ROOMCOLORS[OUTER_ROOM_COLOR]; break;
                default: color2 = newColor2;
            }

            if (!setRoomColors(color1, color2)) mppChatSend(error + ' ' + (MPP.client.isOwner() ? "Invalid room color(s)" : NOT_OWNER), 0);
        } else mppChatSend(error + "Too many arguments (are you sure you removed spaces from the color values?)", 0);
    } // show the room colors
    else mppChatSend(PRE_ROOMCOLOR + " The room colors are currently set to: " + roomColorAreaToString(INNER_ROOM_COLOR) + " = " + color1 + ", " + roomColorAreaToString(OUTER_ROOM_COLOR) + " = " + color2, 0);
}
var clear = function() {
    // clear the chat of current messages (can be slow)
    var i;
    for (i = 0; i < CLEAR_LINES; ++i) {
        mppChatSend(CLEAR_TEXT, chatDelay * i);
        if (i == CLEAR_LINES - 1) setTimeout(MPP.chat.clear, chatDelay * (i + 1));
    }
}
var ping = function() {
    // get a response back in milliseconds
    pinging = true;
    pingTime = Date.now();
    mppChatSend(PRE_PING, 0);
    setTimeout(function() {
        if (pinging) mppChatSend("Pong! [within 1 second]", 0);
        pinging = false;
    }, SECOND);
}
var feedback = function() {
    // just sends feedback url to user
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.", 0);
}

// =============================================== MAIN

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
        var argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1) : null;
        var arguments = (hasArgs != -1) ? argumentsString.split(' ') : null;
        // look through commands
        preventsPlaying = MPP.client.preventsPlaying();
        switch (command.toLowerCase()) {
            case "help": case "h": if (!preventsPlaying) help(argumentsString); break;
            case "about": case "ab": if (!preventsPlaying) about(); break;
            case "link": case "li": if (!preventsPlaying) link(); break;
            case "play": case "p": if (active && !preventsPlaying) play(argumentsString); break;
            case "stop": case "s": if (active && !preventsPlaying) stop(); break;
            case "pause": case "pa": if (active && !preventsPlaying) pause(); break;
            case "resume": case "r": if (active && !preventsPlaying) resume(); break;
            case "song": case "so": if (!preventsPlaying) song(); break;
            case "repeat": case "re": if (active && !preventsPlaying) repeat(); break;
            case "sustain": case "ss": if (active && !preventsPlaying) sustain(); break;
            case "roomcolor": case "rc": if (active) roomcolor(argumentsString); break;
            case "roomcolor1": case "rc1": if (active) roomcolor1(argumentsString); break;
            case "roomcolor2": case "rc2": if (active) roomcolor2(argumentsString); break;
            case "roomcolors": case "rcs": if (active) roomcolors(arguments); break;
            case "clear": case "cl": if (active) clear(); break;
            case "ping": case "pi": if (active) ping(); break;
            case "feedback": case "fb": if (active) feedback(); break;
            case "active": case "a": setActive(userId, yourId); break;
            default: if (active) cmdNotFound(command); break;
        }
    }
});
MPP.client.on("ch", function(msg) {
    // set new chat delay based on room ownership after changing rooms
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
    // update current room info
    currentRoom = MPP.client.channel._id;
    // stop any songs that might have been playing before changing rooms
    stopSong();
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
    preventsPlaying = MPP.client.preventsPlaying();
    if (preventsPlaying) return;
    // do repeat
    if (repeatOption && ended && !stopped && exists(currentSongName) && exists(currentSongData)) {
        ended = false;
        // nice delay before playing song again
        setTimeout(function() {Player.play()}, END_SONG_DELAY);
    }
}, TENTH_OF_SECOND);

// Automatically turns off the sound warning (mainly for autoplay)
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);
        playButton.click();
        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id) && MPP.client.channel._id != "") {
                clearInterval(waitForMPP);

                active = true;
                currentRoom = MPP.client.channel._id;
                setRoomColors(BOT_ROOM_COLORS[0], BOT_ROOM_COLORS[1]);
                if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
                if (CHANGE_NAME) setOwnerUsername(BOT_USERNAME);
                createButtons();
                console.log(PRE_MSG + " Online!");
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);