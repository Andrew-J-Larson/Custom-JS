// ==UserScript==
// @name         MIDI Player Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.5.3
// @description  Plays MIDI files by URL or by data URI!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-MIDI-Player-Bot/MPP-MIDI-Player-Bot.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-MIDI-Player-Bot/favicon.png
// @require      http://grimmdude.com/MidiPlayerJS/browser/midiplayer.min.js
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     MIDIPlayerJS http://grimmdude.com/MidiPlayerJS/browser/midiplayer.min.js
// @run-at       document-end
// @noframes
// ==/UserScript==

// MIDIPlayerJS via https://github.com/grimmdude/MidiPlayerJS (but I should maybe switch to https://github.com/mudcube/MIDI.js OR https://github.com/Tonejs/Midi)

/* globals MPP */

// =============================================== FILES

// scriptMIDIPlayerJS
var fileMIDIPlayerJS = GM_getResourceText("MIDIPlayerJS").split('\n');
var stringMIDIPlayerJS = "";
var jsLine;
for (jsLine = 0; jsLine < fileMIDIPlayerJS.length; jsLine++) {
    stringMIDIPlayerJS = stringMIDIPlayerJS.concat(fileMIDIPlayerJS[jsLine]);
}
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

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered

// URLs
const FEEDBACK_URL = "https://forms.gle/x4nqjynmRMEN2GSG7";

// Players listed by IDs (these are the _id strings)
const BANNED_PLAYERS = ["1251d6256fc2264660957fb9"];
const LIMITED_PLAYERS = ["9f435879f55c87c238a1575d"];

// MPP Constants (these are not meant to be changed); roomcolor arrays: [0] = inner, [1] = outer
const MPP_DEFAULT_ROOMCOLORS = ["rgb(59, 80, 84)", "rgb(0, 16, 20)"];
const MPP_LOBBY_ROOMCOLORS = ["rgb(25, 180, 185)", "rgb(128, 16, 20)"];

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const INNER_ROOM_COLOR = 0; // used in room color settings (DON'T CHANGE)
const OUTER_ROOM_COLOR = 1; // used in room color settings (DON'T CHANGE)
const PERCUSSION_CHANNEL = 10; // (DON'T CHANGE)

// Bot constant settings
const ALLOW_ALL_INTRUMENTS = false; // removes percussion instruments (turning this on makes a lot of MIDIs sound bad)
const CLEAR_LINES = 35; // may be changed if needed, but this number seems to be the magic number
const CHANGE_NAME = false; // allows the bot to change your name to the bot's name
const BOT_ROOM_COLORS = ["#046307", "#32CD32"]; // these are the colors the bot will set the room to by default
const BOT_SOLO_PLAY = true; // sets what play mode when the bot boots up on an owned room

// Bot custom constants
const PREFIX = "/";
const PREFIX_LENGTH = PREFIX.length;
const THICK_BORDER = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const THIN_BORDER = "══════════════════════════════════════════════════════════════════════";
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS library."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["play [URL]", "plays a specific song (URL must be a direct link)"],
    ["stop", "stops all music from playing"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat (choice)", "allows one song to keep repeating, choices are off (0), or on (1)"],
    ["sustain (choice)", "sets the how sustain is controlled, choices are MPP (0), or MIDI (1)"],
    ["roomcolor (command)", "displays info about room color command, but no command shows the room color commands and special color options"],
    ["clear", "clears the chat"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["active [choice]", "turns the bot on or off (bot owner only)"]
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
const PRE_PLAY = PRE_MSG + "[Play]";
const PRE_STOP = PRE_MSG + "[Stop]";
const PRE_PAUSE = PRE_MSG + "[Pause]";
const PRE_RESUME = PRE_MSG + "[Resume]";
const PRE_SONG = PRE_MSG + "[Song]";
const PRE_REPEAT = PRE_MSG + "[Repeat]";
const PRE_SUSTAIN = PRE_MSG + "[Sustain]";
const PRE_ROOMCOLOR = PRE_MSG + "[Roomcolor]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_LIMITED = PRE_MSG + "Limited!";
const PRE_ERROR = PRE_MSG + "Error!";
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

var active = true; // turn off the bot if needed
var currentRoom = null; // updates when it connects to room
var chatDelay = CHAT_DELAY; // for how long to wait until posting another message
var endDelay; // used in multiline chats send commands

var MidiPlayer = MidiPlayer;
var eventsDiv = document.getElementById('events');

var ended = true;
var stopped = false;
var paused = false;
var uploadButton = null; // this get's an element after it's loaded
var currentSongDuration = 0; // this changes after each song is loaded
var currentSongDurationFormatted = "00"; // gets updated when currentSongDuration is updated
var currentSongData = null; // this contains the song as a data URI
var currentFileLocation = null; // this leads to the MIDI location (local or by URL)
var currentSongName = null; // extracted from the file name/end of URL
var repeatOption = false; // allows for repeat of one song
var sustainOption = true; // makes notes end according to the midi file

// =============================================== OBJECTS

// The MIDIPlayer
var Player = new window.MidiPlayer.Player(function(event) {
    if (!active || MPP.client.preventsPlaying()) return;
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
        } else if (sustainOption && (currentEvent == "Note off" /*|| (currentEvent == "Note on" && event.velocity == 0)*/)) MPP.release(currentNote); // end note
    }
    if (!ended && !Player.isPlaying()) {
        ended = true;
        paused = false;
        if (!repeatOption) currentSongData = null;
    }
});

// =============================================== FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Format time to HH:MM:SS from seconds
var secondsToHms = function(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    var hDisplay = (h < 10 ? "0" : "") + h;
    var mDisplay = (m < 10 ? "0" : "") + m;
    var sDisplay = (s < 10 ? "0" : "") + s;
    return hDisplay + ':' + mDisplay + ':' + sDisplay;
}

// Takes formatted time and removed preceeding zeros
var timeClearZeros = function(formattedHms) {
    var newTime = formattedHms;
    while (newTime.indexOf("00:") == 0) {
        newTime = newTime.substring(3);
    }
    return newTime;
}

// Resizes a formatted HH:MM:SS time to the second formatted time
var timeSizeFormat = function(timeToResize, timeControl) {
    var newTimeFormat = timeToResize;
    // lose or add 00's
    if (newTimeFormat.length > timeControl.length) newTimeFormat = timeToResize.substring(timeToResize.length - timeControl.length);
    while (newTimeFormat.length < timeControl.length) {
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
    fetch(url).then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.blob();
    }).then(blob => {
        callback(blob);
    }).catch(error => {
        console.error("There has been a problem with your fetch operation:", error);
        callback(null);
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
    if (exists(raw) && (raw.type == "@file/mid" || raw.type == "@file/midi" || raw.type == "audio/midi" || raw.type == "audio/mid")) return true;
    else return false;
}

// Set the bot on or off (only from bot)
var setActive = function(args, userId) {
    if (userId != MPP.client.user._id) return;
    var choice = args[0];
    var newActive = null;
    switch(choice.toLowerCase()) {
        case "false": case "off": case "no": case "0": newActive = false; break;
        case "true": case "on": case "yes": case "1": newActive = true; break;
        default: console.log("Invalid choice. Bot wasn't turned off or on.");
    }
    if (exists(newActive)) {
        active = newActive;
        console.log("Bot was turned " + (newActive ? "on" : "off") + '.');
    }
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

// Titles for some commands
var mppTitleSend = function(str, delay) {
    if (chatDelay != SLOW_CHAT_DELAY) mppChatSend(THICK_BORDER, delay);
    mppChatSend(str, delay);
}

// Sends in a bottom border if needed
var mppEndSend = function(delay) {
    if (chatDelay != SLOW_CHAT_DELAY) mppChatSend(THIN_BORDER, delay);
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
        ended = true;
    }
}

// Gets song from data URI and plays it
var playSong = function(songName, songData) {
    // stop any current songs from playing
    stopSong();
    // changes song
    currentSongData = songData;
    currentSongName = songName;
    // then play song
    Player.loadDataUri(currentSongData);
    while(!Player.fileLoaded()) { console.log("Loading MIDI . . .") }
    currentSongDuration = Player.getSongTime();
    currentSongDurationFormatted = timeClearZeros(secondsToHms(currentSongDuration));
    ended = false;
    stopped = false;
    Player.play();
    mppTitleSend(PRE_PLAY, 0);
    var timeElapsedFormatted = timeSizeFormat(secondsToHms(0), currentSongDurationFormatted);
    mppChatSend("Now playing " + quoteString(currentSongName) + ' ' + getSongTimesFormatted(timeElapsedFormatted, currentSongDurationFormatted), 0);
    mppEndSend(0);
}

// Plays the song from a URL if it's a MIDI
var playURL = function(songUrl, songData) {
    currentFileLocation = songUrl.toString();
    playSong(currentFileLocation.substring(currentFileLocation.lastIndexOf('/') + 1), songData);
}

// Plays the song from an uploaded file if it's a MIDI
var playFile = function(songFile) {
    var songName = null;

    // load in the file
    if (exists(songFile)) {
        songName = songFile.name.split(/(\\|\/)/g).pop();
        if (isMidi(songFile)) {
            fileOrBlobToBase64(songFile, function(base64data) {
                // play song only if we got data
                if (exists(base64data)) {
                    currentFileLocation = songFile.name;
                    console.log(songFile, songFile.name, base64data);
                    playSong(songName, base64data);
                    uploadButton.value = ""; // reset file input
                } else {
                    mppTitleSend(PRE_ERROR + " [Play]", 0);
                    mppChatSend("Unexpected result, MIDI file couldn't load", 0);
                    mppEndSend(0);
                }
            });
        } else {
            mppTitleSend(PRE_ERROR + " (play)", 0);
            mppChatSend("The file choosen, is either corrupted, or it's not really a MIDI file", 0);
            mppEndSend(0);
        }
    } else {
        mppTitleSend(PRE_ERROR + " (play)", 0);
        mppChatSend("MIDI file not found", 0);
        mppEndSend(0);
    }
}

// Get the string/type value of the repeat option
var getRepeatString = function(choice) {
    if (!exists(choice) || typeof choice !== "boolean") return "unknown"; // shouldn't ever get here
    return (choice ? "" : "not") + " repeating";
}
var getRepeatValue = function(choice) {
    var valid = null;
    switch(choice.toLowerCase()) {
        case "0": case "off": case "false": valid = false; break;
        case "1": case "on": case "true": valid = true; break;
    }
    return valid;
}

// Get the string/type value of the sustain option
var getSustainString = function(choice) {
    if (!exists(choice) || typeof choice !== "boolean") return "unknown"; // shouldn't ever get here
    return (choice ? "MIDI controlled" : "MPP controlled");
}
var getSustainValue = function(choice) {
    var valid = null;
    switch(choice.toLowerCase()) {
        case "mpp": case "0": case "off": case "false": valid = false; break;
        case "midi": case "1": case "on": case "true": valid = true; break;
    }
    return valid;
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

        if (!setRoomColor(area, color)) {
            mppTitleSend(PRE_ERROR + " (roomcolor" + (area + 1) + ")", delay);
            mppChatSend("Invalid " + roomColorAreaToString(area) + " room color", delay);
        }
    } else {
        color = currentRoomColor(area);
        mppTitleSend(PRE_ROOMCOLOR, delay);
        mppChatSend("The " + roomColorAreaToString(area) + " room color is currently set to " + color, delay);
    }
    mppEndSend(0);
}

// Allows users to upload midi files to the bot
var createUploadButton = function() {
    var buttonContainer = document.querySelector("#bottom div");
    var uploadDiv = document.createElement("div");
    uploadDiv.style = "position:absolute;left:660px;top:32px;display:block;";
    uploadDiv.classList.add("ugly-button");
    uploadDiv.innerHtml = "Upload MIDI";
    buttonContainer.appendChild(uploadDiv);

    var uploadBtn = document.createElement("input");
    uploadBtn.style = "opacity:0;filter:alpha(opacity=0);position:absolute;top:0;left:0;width:110px;height:22px;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;";
    uploadBtn.title = " "; // removes the "No file choosen" tooltip
    uploadBtn.id = "aliendrew-midi-player-bot-upload"
    uploadBtn.type = "file";
    uploadBtn.accept = ".mid,.midi";
    uploadBtn.onchange = function() {
        if (uploadBtn.files.length > 0) playFile(uploadBtn.files[0]);
        else console.log("No MIDI file selected");
    }

    var uploadTxt = document.createTextNode("Upload MIDI");
    uploadDiv.appendChild(uploadBtn);
    uploadDiv.appendChild(uploadTxt);

    uploadButton = uploadBtn;
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
    mppTitleSend(PRE_LIMITED, 0);
    mppChatSend("You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the bot", 0);
    mppEndSend(0);
}

// when there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    // if cmd is empty somehow, show it
    if (exists(cmd) && cmd != "") {
        // if we're in the fishing room, ignore the fishing commands
        var error = "Invalid command, " + quoteString(cmd) + " doesn't exist";
        cmd = cmd.toLowerCase();
        if (currentRoom == "test/fishing" && (cmd.indexOf("fish") == 0 || cmd.indexOf("cast") == 0 || cmd.indexOf("reel") == 0 ||
                                             cmd.indexOf("caught") == 0 || cmd.indexOf("eat") == 0 || cmd.indexOf("give") == 0 ||
                                             cmd.indexOf("pick") == 0 || cmd.indexOf("sack") == 0)) {
            console.log(error);
        } else {
            mppTitleSend(PRE_ERROR, 0);
            mppChatSend(error, 0);
            mppEndSend(0);
        }
    } else {
        mppTitleSend(PRE_ERROR, 0);
        mppChatSend("No command entered", 0);
        mppEndSend(0);
    }
}

// Commands
var help = function(command) {
    if (!exists(command) || command == "") {
        mppTitleSend(PRE_HELP, 0);
        mppChatSend("Commands: " + formattedCommands(COMMANDS, LIST_BULLET + PREFIX, true), 0);
    } else {
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
        if (exists(valid)) {
            mppTitleSend(PRE_HELP, 0);
            mppChatSend(formatCommandInfo(COMMANDS, commandIndex), 0);
        } else cmdNotFound(command);
    }
    mppEndSend(0);
}
var about = function() {
    mppTitleSend(PRE_ABOUT, 0);
    mppChatSend(BOT_DESCRIPTION, 0);
    mppChatSend(BOT_AUTHOR + ' ' + BOT_NAMESPACE, 0);
    mppEndSend(0);
}
var play = function(url) {
    // URL needs to be entered to play a song
    if (exists(url)) {
        if (url == "") {
            mppTitleSend(PRE_ERROR + " (play)", 0);
            mppChatSend("No MIDI url entered", 0);
            mppEndSend(0);
        } else {
            // must change http to https
            if (url.indexOf("http:") == 0) url = "https:" + url.substring(5);
            // downloads file if possible and then plays it if it's a MIDI
            urlToBlob(url, function(blob) {
                if (blob == null) {
                    mppTitleSend(PRE_ERROR + " (play)", 0);
                    mppChatSend("Invalid URL, there is no file, or the file requires a manual download from " + quoteString(url), 0);
                    mppEndSend(0);
                } else if (isMidi(blob)) {
                    fileOrBlobToBase64(blob, function(base64data) {
                        // play song only if we got data
                        if (exists(base64data)) {
                            playURL(url, base64data);
                        } else {
                            mppTitleSend(PRE_ERROR + " [Play]", 0);
                            mppChatSend("Unexpected result, MIDI file couldn't load", 0);
                            mppEndSend(0);
                        }
                    });
                } else {
                    mppTitleSend(PRE_ERROR + " [Play]", 0);
                    mppChatSend("Invalid URL, this is not a MIDI file", 0);
                    mppEndSend(0);
                }
            });
        }
    }
}
var stop = function() {
    // stops the current song
    mppTitleSend(PRE_STOP, 0);
    if (ended) mppChatSend(NO_SONG, 0);
    else {
        stopSong();
        paused = false;
        mppChatSend("Stopped playing " + quoteString(currentSongName), 0);
        currentFileLocation = currentSongName = null;
    }
    mppEndSend(0);
}
var pause = function() {
    // pauses the current song
    mppTitleSend(PRE_PAUSE, 0);
    if (ended) mppChatSend(NO_SONG, 0);
    else if (paused) mppChatSend("The song is already paused", 0);
    else {
        Player.pause();
        paused = true;
        mppChatSend("Paused " + quoteString(currentSongName), 0);
    }
    mppEndSend(0);
}
var resume = function() {
    // resumes the current song
    mppTitleSend(PRE_RESUME, 0)
    if (ended) mppChatSend(NO_SONG, 0);
    else if (paused) {
        Player.play();
        paused = false;
        mppChatSend("Resumed " + quoteString(currentSongName), 0);
    } else mppChatSend("The song is already playing", 0);
    mppEndSend(0);
}
var song = function() {
    // shows current song playing
    mppTitleSend(PRE_SONG, 0);
    if (exists(currentSongName) && currentSongName != "") {
        var timeRemaining = Player.getSongTimeRemaining();
        var timeElapsed = currentSongDuration - timeRemaining;
        var timeElapsedFormatted = timeSizeFormat(secondsToHms(timeElapsed), currentSongDurationFormatted);
        mppChatSend("Currently playing " + quoteString(currentSongName) + ' ' + getSongTimesFormatted(timeElapsedFormatted, currentSongDurationFormatted), 0);
    } else mppChatSend(NO_SONG, 0);
    mppEndSend(0);
}
var repeat = function(choice) {
    // turns on or off repeat
    var currentRepeat = getRepeatString(repeatOption);

    if (!exists(choice) || choice == "") {
        mppTitleSend(PRE_REPEAT, 0);
        mppChatSend("Repeat is currently set to " + currentRepeat, 0);
    } else if (getRepeatValue(choice) == repeatOption) {
        mppTitleSend(PRE_REPEAT, 0);
        mppChatSend("Repeat is already set to " + currentRepeat, 0);
    } else {
        var valid = getRepeatValue(choice);
        if (valid != null) {
            repeatOption = valid;
            mppTitleSend(PRE_REPEAT, 0);
            mppChatSend("Repeat set to " + getRepeatString(valid), 0);
        } else {
            mppTitleSend(PRE_ERROR + " (repeat)", 0);
            mppChatSend("Invalid repeat choice", 0);
        }
    }
    mppEndSend(0);
}
var sustain = function(choice) {
    // turns on or off sustain
    var currentSustain = getSustainString(sustainOption);

    if (!exists(choice) || choice == "") {
        mppTitleSend(PRE_SUSTAIN, 0);
        mppChatSend("Sustain is currently set to " + currentSustain, 0);
    } else if (getSustainValue(choice) == sustainOption) {
        mppTitleSend(PRE_SUSTAIN, 0);
        mppChatSend("Sustain is already set to " + currentSustain, 0);
    } else {
        var valid = getSustainValue(choice);
        if (valid != null) {
            sustainOption = valid;
            mppTitleSend(PRE_SUSTAIN, 0);
            mppChatSend("Sustain set to " + getSustainString(valid), 0);
        } else {
            mppTitleSend(PRE_ERROR + " (sustain)", 0);
            mppChatSend("Invalid sustain choice", 0);
        }
    }
    mppEndSend(0);
}
var roomcolor = function(command) {
    if (!exists(command) || command == "") {
        mppTitleSend(PRE_ROOMCOLOR, 0);
        mppChatSend(ROOMCOLOR_OPTIONS, 0);
        mppChatSend("Commands: " + formattedCommands(ROOMCOLOR_COMMANDS, LIST_BULLET + PREFIX, true), 0);
        mppEndSend(0);
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
        if (exists(valid)) {
            mppTitleSend(PRE_HELP, 0);
            mppChatSend(formatCommandInfo(ROOMCOLOR_COMMANDS, commandIndex), 0);
            mppEndSend(0);
        } else cmdNotFound(command);
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

        if (!setRoomColors(color1, color2)) {
            mppTitleSend(PRE_ERROR + " (roomcolors)", 0);
            mppChatSend("Invalid room color(s)", 0);
        }
    } else {
        // show the room colors
        mppTitleSend(PRE_ROOMCOLOR, 0);
        mppChatSend("The room colors are currently set to: " + roomColorAreaToString(INNER_ROOM_COLOR) + " = " + color1 + ", " + roomColorAreaToString(OUTER_ROOM_COLOR) + " = " + color2, 0);
    }
    mppEndSend(0);
}
var clear = function() {
    // clear the chat of current messages (can be slow)
    var i;
    for (i = 0; i < CLEAR_LINES; ++i) {
        mppChatSend('.', chatDelay * i);
        if (i == CLEAR_LINES - 1) setTimeout(MPP.chat.clear, chatDelay * (i + 1));
    }
}
var feedback = function() {
    // just sends feedback url to user
    mppTitleSend(PRE_FEEDBACK, 0);
    mppChatSend("Please go to " + FEEDBACK_URL + " in order to submit feedback.", 0);
    mppEndSend(0);
}

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    // get the message as string
    var input = msg.a.trim();
    var participant = msg.p;
    var username = participant.name;
    var userId = participant._id;
    // make sure the start of the input matches prefix
    if (input.startsWith(PREFIX)) {
        // don't allow limited users to use the bot
        var limitedPlayers = LIMITED_PLAYERS.length;
        if (limitedPlayers > 0) {
            var i;
            for(i = 0; i < LIMITED_PLAYERS.length; ++i) {
                if (LIMITED_PLAYERS[i] == userId) {
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
        var preventsPlaying = MPP.client.preventsPlaying();
        switch (command.toLowerCase()) {
            case "help": case "h": if (active) help(argumentsString); break;
            case "about": case "ab": if (active) about(); break;
            case "play": case "p": if (active && !preventsPlaying) play(arguments, argumentsString); break;
            case "stop": case "s": if (active && !preventsPlaying) stop(); break;
            case "pause": case "pa": if (active && !preventsPlaying) pause(); break;
            case "resume": case "r": if (active && !preventsPlaying) resume(); break;
            case "song": case "so": if (active && !preventsPlaying) song(); break;
            case "repeat": case "re": if (active && !preventsPlaying) repeat(argumentsString); break;
            case "sustain": case "ss": if (active && !preventsPlaying) sustain(argumentsString); break;
            case "roomcolor": case "rc": if (active) roomcolor(argumentsString); break;
            case "roomcolor1": case "rc1": if (active) roomcolor1(argumentsString); break;
            case "roomcolor2": case "rc2": if (active) roomcolor2(argumentsString); break;
            case "roomcolors": case "rcs": if (active) roomcolors(arguments); break;
            case "clear": case "cl": if (active) clear(); break;
            case "feedback": case "fb": if (active) feedback(); break;
            case "active": setActive(arguments, userId); break;
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
    if (!active || MPP.client.preventsPlaying()) return;
    // do repeat
    if (repeatOption && ended && !stopped && exists(currentSongName) && exists(currentSongData)) {
        ended = false;
        Player.play();
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

                currentRoom = MPP.client.channel._id;
                active = true;
                setRoomColors(BOT_ROOM_COLORS[0], BOT_ROOM_COLORS[1]);
                if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
                if (CHANGE_NAME) setOwnerUsername(BOT_USERNAME);
                createUploadButton();
                mppTitleSend(PRE_MSG + " Online!", 0);
                mppEndSend(0);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
