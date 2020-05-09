// ==UserScript==
// @name         MIDI Player Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.1.9
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
