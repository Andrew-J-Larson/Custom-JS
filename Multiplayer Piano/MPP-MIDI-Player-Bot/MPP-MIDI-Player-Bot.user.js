// ==UserScript==
// @name         MIDI Player Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.2.4
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
const CHAT_DELAY = 500; // needed since the chat is limited to 10 messages within less delay

// Players listed by IDs (these are the _id strings)
const BANNED_PLAYERS = []; // none for now
const LIMITED_PLAYERS = []; // none for now

// Bot constants
const PREFIX = "/";
const PREFIX_LENGTH = PREFIX.length;
const THICK_BORDER = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const THIN_BORDER = "════════════════════════════════════════════════════";
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_ROOM_COLOR = "#";
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS library."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const BOT_COMMAND = "~~ Commands ~~";
const COMMANDS = ["help - displays this help page",
                  "about - get information about this bot",
                  "play [url or data uri] - plays a specific song (url must be a direct link)",
                  "stop - stops all music from playing ",
                  "pause - pauses the music at that moment in the song",
                  "resume - plays music right where pause left off",
                  "song - shows the current song playing",
                  "sustain - sets the sustain (midi controlled), choices are off (0), or on (1)",
                  "clear - clears the chat",
                  "feedback [text] - send feedback about the bot to the developer"];
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_PLAY = PRE_MSG + "[Play]";
const PRE_STOP = PRE_MSG + "[Stop]";
const PRE_PAUSE = PRE_MSG + "[Pause]";
const PRE_RESUME = PRE_MSG + "[Resume]";
const PRE_SONG = PRE_MSG + "[Song]";
const PRE_SUSTAIN = PRE_MSG + "[Sustain]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_LIMITED = PRE_MSG + "Limited!";
const PRE_ERROR = PRE_MSG + "Error!";
const NOT_OWNER = "The bot isn't the owner of the room";
const NO_SONG = "Not currently playing anything";
const FEEDBACK_COLORS = "background-color: black; color: #00ff00;";
const FEEDBACK_NAME_STYLE = FEEDBACK_COLORS + " text-decoration: underline;";
const FEEDBACK_TEXT_STYLE = FEEDBACK_COLORS + " font-weight: bold";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";
const CHANGE_NAME = false; // allows the bot to change your name to the bot's name
const CLEAR_LINES = 35;

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
var sustainOption = true; // makes notes end according to the midi file "Note off" ("Note on" && velocity == 0)
var endDelay; // used in multiline chats send commands

var MidiPlayer = MidiPlayer;
var eventsDiv = document.getElementById('events');

var ended = true;
var stopped = false;
var paused = false;
var currentNote = null;
var previousTick = null;
var currentTick = null;
var currentSongData = null; // this contains the song as a data URI
var currentFileURL = null; // this leads to the MIDI URL
var currentFileName = null; // extracted from the end of the URL

// =============================================== OBJECTS

// The MIDIPlayer
var Player = new window.MidiPlayer.Player(function(event) {
    if (!active || MPP.client.preventsPlaying()) return;
    var currentEvent = event.name;
    previousTick = currentTick;
    if (exists(event.tick)) currentTick = event.tick;
    if (currentEvent == "Set Tempo") { // fixes tempo on some songs
        Player.pause();
        Player.setTempo(event.data);
        Player.play();
    } else if (currentEvent == "Note on") {
        if (event.velocity > 0) { // start note
            currentNote = MIDIPlayerToMPPNote[event.noteName];
            MPP.press(currentNote, (event.velocity/100));
        } else if (sustainOption) MPP.release(currentNote); // conditionally end note
    } else if (currentEvent == "Key Signature" && previousTick > currentTick) {
        ended = true;
        paused = false;
        currentSongData = null;
        currentTick = null;
    }
});

// =============================================== FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
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

// Validates colors
var isColor = function(strColor){
    var s = new Option().style;
    s.color = strColor;
    return (s.color != "");
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
        case "false": case "off": case "0": newActive = false; break;
        case "true": case "on": case "1": newActive = true; break;
        default: console.log("Invalid choice. Bot wasn't turned off or on.");
    }
    if (exists(newActive)) {
        active = newActive;
        console.log("Bot was turned " + (newActive ? "on" : "off") + '.');
    }
}

// Send messages without worrying about timing
var mppChatSend = function(str, delay) {
    setTimeout(function(){MPP.chat.send(str)}, delay);
}

// Titles for some commands
var mppTitleSend = function(str, delay) {
    mppChatSend(THICK_BORDER, delay);
    mppChatSend(str, delay);
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
            mppChatSend(optionalPrefix + strArray[i], CHAT_DELAY * newDelay);
        }
    }
    return CHAT_DELAY * newDelay;
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
    currentFileName = songName;
    // then play song
    Player.loadDataUri(currentSongData);
    while(!Player.fileLoaded()) {}
    ended = false;
    stopped = false;
    Player.play();
    mppTitleSend(PRE_PLAY, 0);
    mppChatSend("Now playing " + quoteString(currentFileName), 0);
    mppChatSend(THIN_BORDER, 0);
}

// Plays the song from a URL if it's a MIDI
var playURL = function(songUrl, songData) {
    currentFileURL = songUrl.toString();
    playSong(currentFileURL.substring(currentFileURL.lastIndexOf('/') + 1), songData);
}

// Plays the song from an uploaded file if it's a MIDI
var playFile = function(songFile) {
    var songData = null;
    var songName = null;

    // load in the file
    if (exists(songFile)) {
        songName = songFile.name.split(/(\\|\/)/g).pop();
        if (isMidi(songFile)) {
            fileOrBlobToBase64(songFile, function(base64data) {
                // play song only if we got data
                if (exists(base64data)) {
                    playURL(songName, base64data);
                } else {
                    mppTitleSend(PRE_ERROR + " [Play]", 0);
                    mppChatSend("Unexpected result, MIDI file couldn't load", 0);
                    mppChatSend(THIN_BORDER, 0);
                }
            });
        } else {
            mppTitleSend(PRE_ERROR + " (play)", 0);
            mppChatSend("The file choosen, is either corrupted, or it's not really a MIDI file", 0);
            mppChatSend(THIN_BORDER, 0);
        }
    } else {
        mppTitleSend(PRE_ERROR + " (play)", 0);
        mppChatSend("MIDI file not found", 0);
        mppChatSend(THIN_BORDER, 0);
    }
}

// Get the string value of the sustain
var getSustainString = function(choice) {
    if (!exists(choice) || typeof choice !== "boolean") return "unknown"; // shouldn't ever get here
    return (choice ? "midi controlled (on)" : "MPP controlled (off)");
}

// Change the room color
var setRoomColor = function(color) {
    var isOwner = MPP.client.isOwner();
    if (isOwner && isColor(color)) {
        color = colorToHEX(color);
        var set = {color: color};
        MPP.client.sendArray([{m: "chset", set: set}]);
        console.log("Color set to: " + color);
        return true;
    } else if (exists(color)){
        if (!isOwner) console.log(NOT_OWNER);
        else console.log("Invalid color. Color wasn't set.");
        return false;
    } else {
        // go back to default color
        setRoomColor(BOT_ROOM_COLOR);
    }
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
    uploadBtn.style = "opacity:0;filter:alpha(opacity=0);position:absolute;width:100%;height:100%;border-radius:3px;-webkit-border-radius:3px;-moz-border-radius:3px;";
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
}

// Sets the name of the bot
var setOwnerUsername = function(username) {
    if (exists(username) && username != "") {
        var set = {name: username};
        MPP.client.sendArray([{m: "userset", set: set}]);
        console.log("Username set to " + quoteString(username));
    } else {
        console.log("Invalid username. Username wasn't set.");
        return false;
    }
}

// Shows limited message for user
var playerLimited = function(username) {
    // displays message with their name about being limited
    mppTitleSend(PRE_LIMITED, 0);
    mppChatSend("You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the bot", 0);
    mppChatSend(THIN_BORDER, 0);
}

// Commands
var help = function() {
    mppTitleSend(PRE_HELP, 0);
    mppChatSend(BOT_COMMAND, 0);
    endDelay = mppChatMultiSend(COMMANDS, "• " + PREFIX, 0);
    mppChatSend(THIN_BORDER, endDelay);
}
var about = function() {
    mppTitleSend(PRE_ABOUT, 0);
    mppChatSend(BOT_DESCRIPTION, 0);
    mppChatSend(BOT_AUTHOR, 0);
    mppChatSend(NAMESPACE, 0);
    mppChatSend(THIN_BORDER, 0);
}
var play = function(url) {
    // URL needs to be entered to play a song
    if (exists(url)) {
        if (url == "") {
            mppTitleSend(PRE_ERROR + " (play)", 0);
            mppChatSend("No MIDI url entered", 0);
            mppChatSend(THIN_BORDER, 0);
        } else {
            // must change http to https
            if (url.indexOf("http:") == 0) url = "https:" + url.substring(5);
            // downloads file if possible and then plays it if it's a MIDI
            urlToBlob(url, function(blob) {
                if (blob == null) {
                    mppTitleSend(PRE_ERROR + " (play)", 0);
                    mppChatSend("Invalid URL, there is no file, or the download is blocked by the website, at " + quoteString(url), 0);
                    mppChatSend(THIN_BORDER, 0);
                } else if (isMidi(blob)) {
                    fileOrBlobToBase64(blob, function(base64data) {
                        // play song only if we got data
                        if (exists(base64data)) {
                            playURL(url, base64data);
                        } else {
                            mppTitleSend(PRE_ERROR + " [Play]", 0);
                            mppChatSend("Unexpected result, MIDI file couldn't load", 0);
                            mppChatSend(THIN_BORDER, 0);
                        }
                    });
                } else {
                    mppTitleSend(PRE_ERROR + " [Play]", 0);
                    mppChatSend("Invalid file, this is not a MIDI file", 0);
                    mppChatSend(THIN_BORDER, 0);
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
        mppChatSend("Stopped playing " + quoteString(currentFileName), 0);
        currentFileURL = currentFileName = null;
    }
    mppChatSend(THIN_BORDER, 0);
}
var pause = function() {
    // pauses the current song
    mppTitleSend(PRE_PAUSE, 0);
    if (ended) mppChatSend(NO_SONG, 0);
    else if (paused) mppChatSend("The song is already paused", 0);
    else {
        Player.pause();
        paused = true;
        mppChatSend("Paused " + quoteString(currentFileName), 0);
    }
    mppChatSend(THIN_BORDER, 0);
}
var resume = function() {
    // resumes the current song
    mppTitleSend(PRE_RESUME, 0)
    if (ended) mppChatSend(NO_SONG, 0);
    else if (paused) {
        Player.play();
        paused = false;
        mppChatSend("Resumed " + quoteString(currentFileName), 0);
    } else mppChatSend("The song is already playing", 0);
    mppChatSend(THIN_BORDER, 0);
}
var song = function() {
    // shows current song playing
    mppTitleSend(PRE_SONG, 0);
    if (exists(currentFileName) && currentFileName != "") {
        mppChatSend("Currently playing " + quoteString(currentFileName), 0);
    } else mppChatSend(NO_SONG, 0);
    mppChatSend(THIN_BORDER, 0);
}
var sustain = function(choice) {
    // turns on or off sustain
    var currentSustain = getSustainString(sustainOption);

    if (!exists(choice) || choice == "") {
        mppTitleSend(PRE_SUSTAIN, 0);
        mppChatSend("Self sustain is currently set to " + currentSustain, 0);
    } else if (choice.toLowerCase() == sustainOption) {
        mppTitleSend(PRE_SUSTAIN, 0);
        mppChatSend("Self sustain is already set to " + currentSustain, 0);
    } else {
        var valid = null;
        switch(choice.toLowerCase()) {
            case "0": case "off": case "false": valid = false; break;
            case "1": case "on": case "true": valid = true; break;
        }
        if (valid != null) {
            sustainOption = valid;
            mppTitleSend(PRE_SUSTAIN, 0);
            mppChatSend("Self sustain set to " + getSustainString(valid), 0);
        } else {
            mppTitleSend(PRE_ERROR + " (sustain)", 0);
            mppChatSend("Invalid self sustain choice", 0);
        }
    }
    mppChatSend(THIN_BORDER, 0);
}
var clear = function() {
    // clear the chat of current messages (can be slow)
    var i;
    for (i = 0; i < CLEAR_LINES; ++i) {
        mppChatSend('.', CHAT_DELAY * i);
        if (i == CLEAR_LINES - 1) setTimeout(MPP.chat.clear, CHAT_DELAY * (i + 1));
    }
}
var feedback = function(username, userId, comment) {
    // just sends string to console to look at later
    if (exists(username) && exists(comment)) {
        console.log("%c" + username + " (" + userId + ")%c says: %c" + quoteString(comment), FEEDBACK_NAME_STYLE, FEEDBACK_COLORS, FEEDBACK_TEXT_STYLE);
        mppTitleSend(PRE_FEEDBACK, 0);
        mppChatSend("Feedback sent to developer");
    } else {
        mppTitleSend(PRE_ERROR + " (feedback)", 0);
        mppChatSend("Nothing entered, so nothing was send", 0);
    }
    mppChatSend(THIN_BORDER, 0);
}
var cmdNotFound = function(cmd) {
    // if cmd is empty somehow, show it
    mppTitleSend(PRE_ERROR, 0);
    if (exists(cmd) && cmd != "") {
        mppChatSend("Invalid command, " + quoteString(cmd) + " doesn't exist", 0);
    } else {
        mppChatSend("No command entered", 0);
    }
    mppChatSend(THIN_BORDER, 0);
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
            case "help": if (active) help(); break;
            case "about": case "ab": if (active) about(); break;
            case "play": case "p": if (active && !preventsPlaying) play(arguments, argumentsString); break;
            case "stop": case "s": if (active && !preventsPlaying) stop(); break;
            case "pause": case "pa": if (active && !preventsPlaying) pause(); break;
            case "resume": case "re": if (active && !preventsPlaying) resume(); break;
            case "song": case "so": if (active && !preventsPlaying) song(); break;
            case "sustain": case "ss": if (active && !preventsPlaying) sustain(argumentsString); break;
            case "clear": case "cl": if (active) clear(); break;
            case "feedback": case "fb": if (active) feedback(username, userId, argumentsString); break;
            case "active": setActive(arguments, userId); break;
            default: if (active) cmdNotFound(command); break;
        }
    }
});
MPP.client.on('p', function(msg) {
    // kick ban all the banned players
    var userId = msg._id;
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

// Stuff that needs to be done by intervals (e.g. autoplay)
/*var repeatingTasks = setInterval(function() {
    if (!active || MPP.client.preventsPlaying()) return;
    // code here ---------------------------------------------------------- might not need ---- FIX ME
}, TENTH_OF_SECOND);*/

// Automatically turns off the sound warning (mainly for autoplay)
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);
        playButton.click();
        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id)) {
                clearInterval(waitForMPP);
                active = true;
                if (CHANGE_NAME) setOwnerUsername(BOT_USERNAME);
                mppTitleSend(PRE_MSG + " Online!", 0);
                mppChatSend(THIN_BORDER, 0);
                createUploadButton();
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);