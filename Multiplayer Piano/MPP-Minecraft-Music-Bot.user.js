// ==UserScript==
// @name         Minecraft Music Bot
// @namespace    https://thealiendrew.github.io/
// @version      2.2.5
// @description  Plays Minecraft music!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @icon         https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-32x32.png
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     MIDIPlayerJS http://grimmdude.com/MidiPlayerJS/browser/midiplayer.js
// @run-at       document-end
// @noframes
// ==/UserScript==

// ============================================================================================================== NEED MODAL BOX FOR SONG SELECTION BEFORE ADDING BUTTONS
// ============================================================================================================== (with pages that show 10 songs at a time)
// ============================================================================================================== https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal

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
const DOWNLOAD_URL = "(there is no download, only source code at ...) https://github.com/TheAlienDrew/Tampermonkey-Scripts/blob/master/Multiplayer%20Piano/MPP-Minecraft-Music-Bot.user.js"; // SCRIPT.downloadURL;

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered
const REPEAT_DELAY = TENTH_OF_SECOND; // makes transitioning songs in repeat/autoplay feel better

// URLs
const FEEDBACK_URL = "https://forms.gle/aPGtap31XaGuvYkc7";

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
const CHANGE_NAME = false; // allows the bot to change your name to the bot's name
const BOT_ROOM_COLORS = ["#44673B", "#18110b"]; // these are the colors the bot will set the room to by default
const BOT_SOLO_PLAY = true; // sets what play mode when the bot boots up on an owned room

// Bot custom constants
const PREFIX = "/";
const PREFIX_LENGTH = PREFIX.length;
const ART_CHOICES = "cow, pig, carved pumpkin, villager, iron golem, enderman, spider, creeper, ghast, skeleton, slime, zombie, wither, grass, cobblestone, or tnt";
const ADDITIONAL_FEEDBACK_INFO = ", including links to other Minecraft songs as MIDIs or sheet music"; // must keep the comma
const BOT_ROOM_KEYPHRASE = "MINECRAFT"; // this is used for auto enabling the bot in the room that contains the key phrase (character case doesn't matter)
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS library."
const BOT_MUSIC_CREDIT = "Music is by C418 from his Minecraft Volume Alpha album (https://c418.bandcamp.com/album/minecraft-volume-alpha).";
const BOT_MIDI_CREDIT = "All songs here are from MIDIs I professionally transcribed from the official sheet music book (https://www.google.com/books/edition/_/ywHUngEACAAJ).";
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["play (song)", "plays a specific song by name or number, no entry plays a random song"],
    ["skip", "skips the current song (if autoplay is on)"],
    ["stop", "stops all music from playing (this stops autoplay too)"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat", "toggles repeating current song on or off"],
    ["sustain", "toggles how sustain is controlled via either MIDI or by MPP"],
    ["autoplay (choice)", "your choices are off (0), random (1), or ordered (2), no entry shows current setting"],
    ["album", "shows the list of available songs"],
    ["art (choice)", "displays ascii art, no choice shows the choices"],
    ["ping", "gets the milliseconds response time"],
    ["feedback", "shows link to send feedback about the bot to the developer"]
];
const BOT_OWNER_COMMANDS = [
    ["active", "toggles the public bot commands on or off"]
];
const ROOM_OWNER_COMMANDS = [
    ["roomcolor (command)", "displays info about room color command, but no command shows the room color commands and special color options"]
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
const PRE_SKIP = PRE_MSG + "[Skip]";
const PRE_STOP = PRE_MSG + "[Stop]";
const PRE_PAUSE = PRE_MSG + "[Pause]";
const PRE_RESUME = PRE_MSG + "[Resume]";
const PRE_SONG = PRE_MSG + "[Song]";
const PRE_ALBUM = PRE_MSG + "[Album]";
const PRE_AUTOPLAY = PRE_MSG + "[Autoplay]";
const PRE_REPEAT = PRE_MSG + "[Repeat]";
const PRE_SUSTAIN = PRE_MSG + "[Sustain]";
const PRE_ART = PRE_MSG + "[Art]";
const PRE_ROOMCOLOR = PRE_MSG + "[Roomcolor]";
const PRE_PING = PRE_MSG + "[Ping]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_ACTIVE = PRE_MSG + "[Active]";
const PRE_LIMITED = PRE_MSG + "Limited!";
const PRE_ERROR = PRE_MSG + "Error!";
const NOT_OWNER = "The bot isn't the owner of the room";
const NO_SONG = "Not currently playing anything";
const AUTOPLAY_OFF = 0;
const AUTOPLAY_RANDOM = 1;
const AUTOPLAY_ORDERED = 2;
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";

// Songs: names, and MIDIs as base64 URIs
const SONG_NAMES = ["01 - Key",
                    "02 - Door",
                    "03 - Subwoofer Lullaby",
                    "04 - Death",
                    "05 - Living Mice",
                    "06 - Moog City",
                    "07 - Haggstrom",
                    "08 - Minecraft",
                    "", // 09 - Oxygene (NOT INCLUDED)
                    "10 - Equinoxe",
                    "11 - Mice on Venus",
                    "12 - Dry Hands",
                    "13 - Wet Hands",
                    "14 - Clark",
                    "15 - Chris",
                    "", // 16 - Thirteen (NOT INCLUDED)
                    "17 - Excuse",
                    "18 - Sweden",
                    "", // 19 - Cat (NOT INCLUDED)
                    "", // 20 - Dog (NOT INCLUDED)
                    "21 - Danny",
                    "22 - Beginning",
                    "23 - Droopy Likes Ricochet",
                    "" // 24 - Droopy Likes Your Face (NOT INCLUDED)
                   ];
const SONG_MIDIS = ["", // 01 - Key (DATAURI REMOVED FOR GITHUB)
                    "", // 02 - Door (DATAURI REMOVED FOR GITHUB)
                    "", // 03 - Subwoofer Lullaby (DATAURI REMOVED FOR GITHUB)
                    "", // 04 - Death (DATAURI REMOVED FOR GITHUB)
                    "", // 05 - Living Mice (DATAURI REMOVED FOR GITHUB)
                    "", // 06 - Moog City (DATAURI REMOVED FOR GITHUB)
                    "", // 07 - Haggstrom (DATAURI REMOVED FOR GITHUB)
                    "", // 08 - Minecraft (DATAURI REMOVED FOR GITHUB)
                    "", // 09 - Oxygene (NOT INCLUDED)
                    "", // 10 - Equinoxe (DATAURI REMOVED FOR GITHUB)
                    "", // 11 - Mice on Venus (DATAURI REMOVED FOR GITHUB)
                    "", // 12 - Dry Hands (DATAURI REMOVED FOR GITHUB)
                    "", // 13 - Wet Hands (DATAURI REMOVED FOR GITHUB)
                    "", // 14 - Clark (DATAURI REMOVED FOR GITHUB)
                    "", // 15 - Chris (DATAURI REMOVED FOR GITHUB)
                    "", // 16 - Thirteen (NOT INCLUDED)
                    "", // 17 - Excuse (DATAURI REMOVED FOR GITHUB)
                    "", // 18 - Sweden (DATAURI REMOVED FOR GITHUB)
                    "", // 19 - Cat (NOT INCLUDED)
                    "", // 20 - Dog (NOT INCLUDED)
                    "", // 21 - Danny (DATAURI REMOVED FOR GITHUB)
                    "", // 22 - Beginning (DATAURI REMOVED FOR GITHUB)
                    "", // 23 - Droopy Likes Ricochet (DATAURI REMOVED FOR GITHUB)
                    "" // 24 - Droopy Likes Your Face (NOT INCLUDED)
                   ];
const SONG_LENGTH = SONG_MIDIS.length;

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

// Art
const cowArt = ["░░░░░░▓▓▓▓▓▓▓▓░░",
                "░░░░░░▓▓▓▓▓▓░░░░",
                "▓▓▓▓░░▓▓▓▓░░▓▓▓▓",
                "▏▕██░░▓▓░░░░██▏▕",
                "░░░░░░░░░░░░░░░░",
                "░░░░▓▓▓▓▓▓▓▓░░░░",
                "░░▓▓▏▕▒▒▒▒▏▕▓▓░░",
                "░░▓▓▒▒░░░░▒▒▓▓░░"];
const pigArt = ["▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                "▏▕██▒▒▒▒▒▒▒▒██▏▕",
                "▒▒▒▒▓▓▓▓▓▓▓▓▒▒▒▒",
                "▒▒▒▒░░▒▒▒▒░░▒▒▒▒",
                "▒▒▒▒▓▓▓▓▓▓▓▓▒▒▒▒",
                "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒"];
const carvedPumpkinArt = ["▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒▒▒▓▓▓▓▓▓▒▒▒▒▓▓▒▒",
                          "██████▒▒▓▓████▓▓▒▒████▓▓▒▒████▒▒",
                          "▓▓████▒▒▔▔▔▔▓▓██▒▒▓▓▔▔██▒▒▓▓██▒▒",
                          "▒▒████▒▒▏▕▔▔▏▕██▒▒▔▔▔▔▔▔▓▓▒▒██▓▓",
                          "▒▒████▏▕▔▔▔▔▔▔██▒▒▏▕▔▔▔▔▏▕▒▒██▓▓",
                          "▒▒████▏▕▔▔▔▔▔▔██▒▒▏▕▔▔▔▔▔▔▒▒████",
                          "▒▒████▏▕▔▔▔▔▔▔▓▓▒▒▏▕▔▔▔▔▔▔▔▔████",
                          "▒▒██████▔▔▔▔██▓▓▒▒██▔▔▔▔▔▔▔▔████",
                          "▒▒██████████▓▓██▓▓██████████████",
                          "▒▒████▔▔▒▒▔▔▓▓██▔▔▓▓▓▓▔▔▒▒▔▔████",
                          "▒▒██▔▔▁▁▁▁▁▁▏▕▁▁▁▁▏▕▁▁▁▁▏▕▁▁████",
                          "▒▒██▏▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
                          "▒▒▓▓██▏▕▁▁██▁▁▁▁▓▓▁▁▁▁▁▁▓▓▁▁▁▁▓▓",
                          "▒▒▓▓██▁▁████▁▁██▒▒████▁▁░░████▒▒",
                          "░░▒▒▓▓░░▓▓▓▓▒▒▒▒▒▒▓▓▒▒▒▒░░▒▒▓▓░░",
                          "░░▒▒▒▒░░▒▒▓▓▒▒▒▒░░▒▒▒▒░░░░▒▒▒▒░░"];
const villagerArt = ["▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                     "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                     "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                     "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                     "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                     "▓▓▔▔▔▔▔▔▔▔▔▔▔▔▓▓",
                     "▓▓██░░▓▓▓▓░░██▓▓",
                     "░░▓▓▓▓░░░░▓▓▓▓░░",
                     "░░▓▓▒▒░░░░▒▒▓▓░░",
                     "░░▓▓▓▓░░░░▓▓▓▓░░",
                     "▔▔▔▔▔▔░░░░▔▔▔▔▔▔"];
const ironGolemArt = ["████████████████",
                      "████████████████",
                      "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                      "██▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                      "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                      "██▔▔▔▔██▓▓▔▔▔▔██",
                      "██░░▏▕████▏▕░░██",
                      "██▒▒▒▒▓▓▓▓▒▒▒▒██",
                      "██████▓▓▓▓▓▓▓▓██",
                      "██████▓▓▒▒██████",
                      "▔▔▔▔▔▔▒▒▒▒▔▔▔▔▔▔"];
const endermanArt = ["░░▒▒░░░░░░░░▒▒░░",
                     "░░▒▒▒▒░░░░▒▒▒▒░░",
                     "▒▒░░▒▒▒▒▒▒▒▒░░▒▒",
                     "░░░░▒▒▒▒▒▒▒▒░░░░",
                     "██▓▓██▒▒▒▒██▓▓██",
                     "▒▒░░░░▒▒▒▒░░░░▒▒",
                     "░░▒▒▒▒░░░░▒▒▒▒░░",
                     "░░░░░░░░░░░░░░░░"];
const spiderArt = ["░░░░▒▒▒▒▒▒▒▒▔▔░░",
                   "▒▒▒▒▏▕▒▒▒▒░░▒▒▒▒",
                   "░░▒▒▒▒▒▒▒▒▒▒▒▒██",
                   "▏▕▒▒██░░██░░▒▒░░",
                   "▒▒▒▒░░▁▁▒▒▁▁▒▒▒▒",
                   "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                   "▒▒▓▓▏▕▒▒▒▒▏▕▓▓▒▒",
                   "▏▕▓▓▏▕▒▒▒▒▏▕▓▓▏▕"];
const creeperArt = ["▓▓▒▒▓▓▓▓██▓▓▓▓▒▒",
                    "▒▒▓▓▓▓▓▓▒▒▓▓▓▓██",
                    "▓▓░░░░▓▓▒▒░░░░██",
                    "▓▓░░▏▕▓▓▓▓▏▕░░▓▓",
                    "▓▓▓▓▓▓░░░░██▒▒▓▓",
                    "▓▓▒▒░░▔▔▔▔░░▓▓██",
                    "██▒▒▁▁▁▁▁▁▁▁▓▓▒▒",
                    "▓▓▓▓░░▓▓▓▓░░▒▒▓▓"];
const ghastArt = ["██████████▓▓▓▓▓▓████▓▓▓▓▓▓██████",
                  "██▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓██",
                  "██▓▓▓▓░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▓▓▓▓██",
                  "██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██",
                  "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                  "▓▓▓▓░░▁▁▁▁▁▁▒▒▓▓▓▓▒▒▁▁▁▁▁▁░░▓▓▓▓",
                  "██▓▓▓▓▓▓░░░░██▓▓▓▓██░░░░▓▓▓▓▓▓██",
                  "██▓▓▓▓▓▓░░▓▓██▓▓▓▓██▓▓░░▓▓▓▓▓▓▓▓",
                  "██▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██",
                  "░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░▓▓░░░░░░",
                  "████▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████",
                  "░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░",
                  "██▓▓▓▓▓▓▓▓▓▓▒▒▁▁▁▁▒▒▓▓▓▓▓▓▓▓▓▓██",
                  "░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░",
                  "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                  "██████████▓▓████████▓▓██████████"];
const skeletonArt = ["▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓",
                     "▓▓████░░██████▓▓",
                     "██████▓▓████████",
                     "████████████████",
                     "██▁▁▁▁████▁▁▁▁██",
                     "▓▓▓▓██░░░░▓▓▓▓▓▓",
                     "░░▁▁▁▁▁▁▁▁▁▁▁▁░░",
                     "▓▓▓▓████████▓▓▓▓"];
const slimeArt = ["▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                  "▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓",
                  "▓▓░░░░▒▒▒▒░░░░▓▓",
                  "▓▓░░▏▕▒▒▒▒▏▕░░▓▓",
                  "▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓",
                  "▓▓▒▒▒▒▒▒▏▕▒▒▒▒▓▓",
                  "▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓",
                  "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"];
const zombieArt = ["░░░░░░░░░░░░░░░░",
                   "░░░░░░▒▒▒▒░░░░░░",
                   "░░▒▒▒▒▒▒▒▒▒▒▒▒░░",
                   "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                   "▒▒▁▁▁▁▒▒▒▒▁▁▁▁▒▒",
                   "░░▒▒▒▒▔▔▔▔▒▒▒▒░░",
                   "░░░░▏▕░░░░▏▕░░░░",
                   "░░░░▁▁▁▁▁▁▁▁░░░░"];
const witherArt = ["░░░░░░▏▕▔▔▏▕░░░░",
                   "░░░░░░░░▒▒▒▒░░░░",
                   "░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                   "▔▔▔▔▔▔▒▒▒▒▔▔▔▔▔▔",
                   "▒▒████▒▒▒▒████▒▒",
                   "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▏▕",
                   "▒▒▏▕████████▏▕▏▕",
                   "▁▁▔▔▁▁▁▁▏▕▁▁▔▔▁▁"];
const grassArt = ["██▓▓▓▓▓▓██▓▓██▓▓▓▓▓▓██▓▓██▓▓▓▓▓▓",
                  "██▓▓██▓▓██▏▕██▓▓██▓▓██▓▓██▓▓██▓▓",
                  "▓▓▏▕██▓▓██▏▕▓▓▏▕████▓▓██▏▕▓▓▓▓▏▕",
                  "▏▕▒▒▁▁▁▁▓▓▁▁▁▁▁▁▓▓▏▕▓▓▏▕░░▁▁▔▔░░",
                  "▒▒░░▒▒▓▓▏▕▒▒░░░░▔▔▁▁▔▔▒▒░░▒▒▏▕░░",
                  "░░▏▕▒▒▒▒░░▒▒▁▁▁▁▁▁░░░░▏▕░░░░░░▓▓",
                  "▓▓░░░░░░▓▓░░░░▓▓▓▓░░▓▓▓▓░░▒▒░░▒▒",
                  "░░░░▓▓▓▓▒▒▒▒░░░░▒▒▏▕▒▒▒▒░░░░▒▒▒▒",
                  "▒▒░░░░▒▒░░▒▒░░▏▕░░▒▒▒▒░░░░░░▏▕░░",
                  "░░▒▒▏▕░░░░▁▁▁▁░░░░░░░░░░▓▓▓▓░░▒▒",
                  "░░▒▒░░▓▓▓▓░░▓▓▒▒▏▕▓▓▓▓▏▕▒▒▒▒▓▓░░",
                  "▒▒░░░░▒▒▒▒▓▓░░▒▒▒▒▒▒▒▒░░▏▕▒▒░░▏▕",
                  "░░▏▕▒▒░░▒▒▒▒▓▓░░░░░░░░░░░░░░▓▓▓▓",
                  "░░▒▒░░░░░░░░▒▒▒▒░░▏▕▓▓▏▕░░▓▓▒▒▒▒",
                  "▒▒░░▏▕▓▓░░▏▕░░▏▕▓▓▓▓░░▒▒░░░░▒▒▒▒",
                  "▒▒░░▓▓▒▒▒▒░░▓▓░░▒▒▒▒░░░░▒▒▒▒░░▏▕"];
const cobblestoneArt = ["░░▔▔▓▓██▔▔▔▔▔▔▓▓██▓▓▒▒▔▔▒▒██▓▓▒▒",
                        "▏▕▓▓██▒▒▒▒▏▕████▓▓▒▒▒▒▏▕▔▔▒▒░░▒▒",
                        "▏▕▓▓▒▒▓▓░░▏▕▓▓▒▒▒▒▓▓░░▁▁▁▁▁▁▒▒░░",
                        "▏▕▔▔▒▒░░▁▁▁▁▒▒░░▒▒░░▏▕▒▒▓▓▒▒▔▔▏▕",
                        "▏▕░░▏▕▒▒██▓▓▏▕▒▒▔▔▔▔██▓▓▓▓▓▓▒▒▏▕",
                        "██░░▓▓██▒▒▒▒░░▔▔▏▕▒▒▒▒██▓▓▒▒░░▒▒",
                        "▓▓▒▒▏▕▒▒▓▓▒▒▒▒░░▁▁▁▁░░▓▓▒▒░░▏▕██",
                        "▒▒▒▒░░░░▒▒▒▒░░▏▕▒▒██▓▓▏▕░░▒▒▏▕▒▒",
                        "░░▏▕██▓▓░░░░▏▕▒▒██▒▒▒▒▒▒▔▔▔▔▁▁░░",
                        "▏▕██▓▓▒▒░░▒▒░░░░▒▒▒▒▏▕░░▏▕▒▒▓▓▏▕",
                        "▒▒░░▒▒░░▒▒▔▔▔▔▔▔▔▔░░░░▔▔▁▁▓▓▓▓██",
                        "▒▒░░░░▁▁▁▁░░▒▒██▓▓▁▁▁▁▏▕▒▒████▒▒",
                        "░░▒▒██▓▓░░▏▕██▓▓▒▒▓▓░░▏▕▒▒▒▒░░▒▒",
                        "▏▕██▓▓▒▒▒▒▏▕▓▓▒▒░░▒▒▒▒░░▁▁▁▁▒▒░░",
                        "▓▓▓▓▒▒░░▒▒░░▏▕░░▒▒▒▒░░▏▕▓▓▒▒▔▔▔▔",
                        "▏▕▒▒▁▁▁▁░░▒▒░░▁▁░░▁▁▁▁▒▒██▓▓▒▒░░"];
const tntArt = ["▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "████████████████████████████████",
                "████▔▔▔▔▔▔██▏▕████▏▕██▔▔▔▔▔▔████",
                "██████▏▕████▏▕▔▔██▏▕████▏▕██████",
                "██████▏▕████▏▕██▁▁▏▕████▏▕██████",
                "██████▏▕████▏▕████▏▕████▏▕██████",
                "████████████████████████████████",
                "▒▒▒▒░░░░▒▒▒▒░░░░▒▒▒▒░░░░▒▒▒▒░░░░",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
                "▒▒▒▒▒▒░░▒▒▒▒▒▒░░▒▒▒▒▒▒░░▒▒▒▒▒▒░░"];
const cowArtInverted = ["██████▓▓▓▓▓▓▓▓██",
                        "██████▓▓▓▓▓▓████",
                        "▓▓▓▓██▓▓▓▓██▓▓▓▓",
                        "▏▕▒▒██▓▓████▒▒▏▕",
                        "████████████████",
                        "████▓▓▓▓▓▓▓▓████",
                        "██▓▓▏▕░░░░▏▕▓▓██",
                        "██▓▓░░████░░▓▓██"];
const pigArtInverted = ["░░░░░░░░░░░░░░░░",
                        "░░░░░░░░░░░░░░░░",
                        "░░░░░░░░░░░░░░░░",
                        "▏▕▒▒░░░░░░░░▒▒▏▕",
                        "░░░░▓▓▓▓▓▓▓▓░░░░",
                        "░░░░██░░░░██░░░░",
                        "░░░░▓▓▓▓▓▓▓▓░░░░",
                        "░░░░░░░░░░░░░░░░"];
const carvedPumpkinArtInverted = ["▓▓▓▓▓▓░░▓▓▓▓▓▓░░░░▓▓▓▓▓▓░░░░▓▓░░",
                                  "▒▒▒▒▒▒░░▓▓▒▒▒▒▓▓░░▒▒▒▒▓▓░░▒▒▒▒░░",
                                  "▓▓▒▒▒▒░░▔▔▔▔▓▓▒▒░░▓▓▔▔▒▒░░▓▓▒▒░░",
                                  "░░▒▒▒▒░░▏▕▔▔▏▕▒▒░░▔▔▔▔▔▔▓▓░░▒▒▓▓",
                                  "░░▒▒▒▒▏▕▔▔▔▔▔▔▒▒░░▏▕▔▔▔▔▏▕░░▒▒▓▓",
                                  "░░▒▒▒▒▏▕▔▔▔▔▔▔▒▒░░▏▕▔▔▔▔▔▔░░▒▒▒▒",
                                  "░░▒▒▒▒▏▕▔▔▔▔▔▔▓▓░░▏▕▔▔▔▔▔▔▔▔▒▒▒▒",
                                  "░░▒▒▒▒▒▒▔▔▔▔▒▒▓▓░░▒▒▔▔▔▔▔▔▔▔▒▒▒▒",
                                  "░░▒▒▒▒▒▒▒▒▒▒▓▓▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                                  "░░▒▒▒▒▔▔░░▔▔▓▓▒▒▔▔▓▓▓▓▔▔░░▔▔▒▒▒▒",
                                  "░░▒▒▔▔▁▁▁▁▁▁▏▕▁▁▁▁▏▕▁▁▁▁▏▕▁▁▒▒▒▒",
                                  "░░▒▒▏▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▒▒",
                                  "░░▓▓▒▒▏▕▁▁▒▒▁▁▁▁▓▓▁▁▁▁▁▁▓▓▁▁▁▁▓▓",
                                  "░░▓▓▒▒▁▁▒▒▒▒▁▁▒▒░░▒▒▒▒▁▁██▒▒▒▒░░",
                                  "██░░▓▓██▓▓▓▓░░░░░░▓▓░░░░██░░▓▓██",
                                  "██░░░░██░░▓▓░░░░██░░░░████░░░░██"];
const villagerArtInverted = ["░░░░░░░░░░░░░░░░",
                             "░░░░░░░░░░░░░░░░",
                             "░░░░░░░░░░░░░░░░",
                             "░░░░░░░░░░░░░░░░",
                             "░░░░░░░░░░░░░░░░",
                             "░░▔▔▔▔▔▔▔▔▔▔▔▔░░",
                             "░░▒▒▓▓░░░░▓▓▒▒░░",
                             "▓▓░░░░▓▓▓▓░░░░▓▓",
                             "▓▓░░██▓▓▓▓██░░▓▓",
                             "▓▓░░░░▓▓▓▓░░░░▓▓",
                             "▔▔▔▔▔▔▓▓▓▓▔▔▔▔▔▔"];
const ironGolemArtInverted = ["▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                              "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                              "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                              "▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                              "████████████████",
                              "▒▒▔▔▔▔▒▒▓▓▔▔▔▔▒▒",
                              "▒▒░░▏▕▒▒▒▒▏▕░░▒▒",
                              "▒▒████▓▓▓▓████▒▒",
                              "▒▒▒▒▒▒▓▓▓▓▓▓▓▓▒▒",
                              "▒▒▒▒▒▒▓▓██▒▒▒▒▒▒",
                              "▔▔▔▔▔▔████▔▔▔▔▔▔"];
const endermanArtInverted = ["██░░████████░░██",
                             "██░░░░████░░░░██",
                             "░░██░░░░░░░░██░░",
                             "████░░░░░░░░████",
                             "▒▒▓▓▒▒░░░░▒▒▓▓▒▒",
                             "░░████░░░░████░░",
                             "██░░░░████░░░░██",
                             "████████████████"];
const spiderArtInverted = ["████░░░░░░░░▔▔██",
                           "░░░░▏▕░░░░██░░░░",
                           "██░░░░░░░░░░░░▒▒",
                           "▏▕░░▒▒██▒▒██░░██",
                           "░░░░██▁▁░░▁▁░░░░",
                           "░░░░░░░░░░░░░░░░",
                           "░░▓▓▏▕░░░░▏▕▓▓░░",
                           "▏▕▓▓▏▕░░░░▏▕▓▓▏▕"];
const creeperArtInverted = ["▓▓░░▓▓▓▓▒▒▓▓▓▓░░",
                            "░░▓▓▓▓▓▓░░▓▓▓▓▒▒",
                            "▓▓████▓▓░░████▒▒",
                            "▓▓██▏▕▓▓▓▓▏▕██▓▓",
                            "▓▓▓▓▓▓████▒▒░░▓▓",
                            "▓▓░░██▔▔▔▔██▓▓▒▒",
                            "▒▒░░▁▁▁▁▁▁▁▁▓▓░░",
                            "▓▓▓▓██▓▓▓▓██░░▓▓"];
const ghastArtInverted = ["▓▓▓▓▓▓▓▓▓▓░░░░░░▓▓▓▓░░░░░░▓▓▓▓▓▓",
                          "▓▓░░░░░░░░██░░░░░░░░██░░░░░░░░▓▓",
                          "▓▓░░░░████░░░░░░░░░░░░████░░░░▓▓",
                          "▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓",
                          "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
                          "░░░░██▁▁▁▁▁▁▒▒░░░░▒▒▁▁▁▁▁▁██░░░░",
                          "▓▓░░░░░░████▓▓░░░░▓▓████░░░░░░▓▓",
                          "▓▓░░░░░░██░░▓▓░░░░▓▓░░██░░░░░░░░",
                          "▓▓░░░░░░██░░░░░░░░░░░░░░░░░░░░▓▓",
                          "██████░░░░░░░░░░░░░░░░██░░██████",
                          "▓▓▓▓░░░░██░░░░░░░░░░░░░░░░░░▓▓▓▓",
                          "████░░░░░░░░░░░░░░░░░░░░░░░░████",
                          "▓▓░░░░░░░░░░▒▒▁▁▁▁▒▒░░░░░░░░░░▓▓",
                          "██░░░░░░░░░░░░░░░░░░░░░░░░░░░░██",
                          "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
                          "▓▓▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓"];
const skeletonArtInverted = ["░░░░▓▓░░░░░░░░░░",
                             "░░▒▒▒▒▓▓▒▒▒▒▒▒░░",
                             "▒▒▒▒▒▒░░▒▒▒▒▒▒▒▒",
                             "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                             "▒▒▁▁▁▁▒▒▒▒▁▁▁▁▒▒",
                             "░░░░▒▒▓▓▓▓░░░░░░",
                             "▓▓▁▁▁▁▁▁▁▁▁▁▁▁▓▓",
                             "░░░░▒▒▒▒▒▒▒▒░░░░"];
const slimeArtInverted = ["▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
                          "▓▓░░░░░░░░░░░░▓▓",
                          "▓▓████░░░░████▓▓",
                          "▓▓██▏▕░░░░▏▕██▓▓",
                          "▓▓░░░░░░░░░░░░▓▓",
                          "▓▓░░░░░░▏▕░░░░▓▓",
                          "▓▓░░░░░░░░░░░░▓▓",
                          "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"];
const zombieArtInverted = ["████████████████",
                           "██████░░░░██████",
                           "██░░░░░░░░░░░░██",
                           "░░░░░░░░░░░░░░░░",
                           "░░▁▁▁▁░░░░▁▁▁▁░░",
                           "██░░░░▔▔▔▔░░░░██",
                           "████▏▕████▏▕████",
                           "████▁▁▁▁▁▁▁▁████"];
const witherArtInverted = ["██████▏▕▔▔▏▕████",
                           "████████░░░░████",
                           "██░░░░░░░░░░░░░░",
                           "▔▔▔▔▔▔░░░░▔▔▔▔▔▔",
                           "░░▒▒▒▒░░░░▒▒▒▒░░",
                           "░░░░░░░░░░░░░░▏▕",
                           "░░▏▕▒▒▒▒▒▒▒▒▏▕▏▕",
                           "▁▁▔▔▁▁▁▁▏▕▁▁▔▔▁▁"];
const grassArtInverted = ["░░▒▒▒▒▒▒░░▒▒░░▒▒▒▒▒▒░░▒▒░░▒▒▒▒▒▒",
                          "░░▒▒░░▒▒░░▏▕░░▒▒░░▒▒░░▒▒░░▒▒░░▒▒",
                          "▒▒▏▕░░▒▒░░▏▕▒▒▏▕░░░░▒▒░░▏▕▒▒▒▒▏▕",
                          "▏▕▓▓▁▁▁▁▒▒▁▁▁▁▁▁▒▒▏▕▒▒▏▕██▁▁▔▔██",
                          "▓▓██▓▓▒▒▏▕▓▓████▔▔▁▁▔▔▓▓██▓▓▏▕██",
                          "██▏▕▓▓▓▓██▓▓▁▁▁▁▁▁████▏▕██████▒▒",
                          "▒▒██████▒▒████▒▒▒▒██▒▒▒▒██▓▓██▓▓",
                          "████▒▒▒▒▓▓▓▓████▓▓▏▕▓▓▓▓████▓▓▓▓",
                          "▓▓████▓▓██▓▓██▏▕██▓▓▓▓██████▏▕██",
                          "██▓▓▏▕████▁▁▁▁██████████▒▒▒▒██▓▓",
                          "██▓▓██▒▒▒▒██▒▒▓▓▏▕▒▒▒▒▏▕▓▓▓▓▒▒██",
                          "▓▓████▓▓▓▓▒▒██▓▓▓▓▓▓▓▓██▏▕▓▓██▏▕",
                          "██▏▕▓▓██▓▓▓▓▒▒██████████████▒▒▒▒",
                          "██▓▓████████▓▓▓▓██▏▕▒▒▏▕██▒▒▓▓▓▓",
                          "▓▓██▏▕▒▒██▏▕██▏▕▒▒▒▒██▓▓████▓▓▓▓",
                          "▓▓██▒▒▓▓▓▓██▒▒██▓▓▓▓████▓▓▓▓██▏▕"];
const cobblestoneArtInverted = ["██▔▔▒▒░░▔▔▔▔▔▔▒▒░░▒▒▓▓▔▔▓▓░░▒▒▓▓",
                                "▏▕▒▒░░▓▓▓▓▏▕░░░░▒▒▓▓▓▓▏▕▔▔▓▓██▓▓",
                                "▏▕▒▒▓▓▒▒██▏▕▒▒▓▓▓▓▒▒██▁▁▁▁▁▁▓▓██",
                                "▏▕▔▔▓▓██▁▁▁▁▓▓██▓▓██▏▕▓▓▒▒▓▓▔▔▏▕",
                                "▏▕██▏▕▓▓░░▒▒▏▕▓▓▔▔▔▔░░▒▒▒▒▒▒▓▓▏▕",
                                "░░██▒▒░░▓▓▓▓██▔▔▏▕▓▓▓▓░░▒▒▓▓██▓▓",
                                "▒▒▓▓▏▕▓▓▒▒▓▓▓▓██▁▁▁▁██▒▒▓▓██▏▕░░",
                                "▓▓▓▓████▓▓▓▓██▏▕▓▓░░▒▒▏▕██▓▓▏▕▓▓",
                                "██▏▕░░▒▒████▏▕▓▓░░▓▓▓▓▓▓▔▔▔▔▁▁██",
                                "▏▕░░▒▒▓▓██▓▓████▓▓▓▓▏▕██▏▕▓▓▒▒▏▕",
                                "▓▓██▓▓██▓▓▔▔▔▔▔▔▔▔████▔▔▁▁▒▒▒▒░░",
                                "▓▓████▁▁▁▁██▓▓░░▒▒▁▁▁▁▏▕▓▓░░░░▓▓",
                                "██▓▓░░▒▒██▏▕░░▒▒▓▓▒▒██▏▕▓▓▓▓██▓▓",
                                "▏▕░░▒▒▓▓▓▓▏▕▒▒▓▓██▓▓▓▓██▁▁▁▁▓▓██",
                                "▒▒▒▒▓▓██▓▓██▏▕██▓▓▓▓██▏▕▒▒▓▓▔▔▔▔",
                                "▏▕▓▓▁▁▁▁██▓▓██▁▁██▁▁▁▁▓▓░░▒▒▓▓██"];
const tntArtInverted = ["░░░░░░▓▓░░░░░░▓▓░░░░░░▓▓░░░░░░▓▓",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                        "▒▒▒▒▔▔▔▔▔▔▒▒▏▕▒▒▒▒▏▕▒▒▔▔▔▔▔▔▒▒▒▒",
                        "▒▒▒▒▒▒▏▕▒▒▒▒▏▕▔▔▒▒▏▕▒▒▒▒▏▕▒▒▒▒▒▒",
                        "▒▒▒▒▒▒▏▕▒▒▒▒▏▕▒▒▁▁▏▕▒▒▒▒▏▕▒▒▒▒▒▒",
                        "▒▒▒▒▒▒▏▕▒▒▒▒▏▕▒▒▒▒▏▕▒▒▒▒▏▕▒▒▒▒▒▒",
                        "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
                        "▓▓▓▓████▓▓▓▓████▓▓▓▓████▓▓▓▓████",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
                        "▓▓▓▓▓▓██▓▓▓▓▓▓██▓▓▓▓▓▓██▓▓▓▓▓▓██"];

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
var currentSongElapsedFormatted = "00:00"; // changes with the amount of song being played
var currentSongDurationFormatted = "00:00"; // gets updated when currentSongDuration is updated
var currentSongDuration = 0; // this changes after each song is loaded
var currentSongIndex = null;
var currentSongName = null; // extracted from the file name/end of URL
var previousSongIndex = null; // grabs current when changing successfully
var autoplayActive = false;
var autoplayOption = AUTOPLAY_OFF;
var repeatOption = false; // allows for repeat of one song
var sustainOption = true; // makes notes end according to the midi file
var artDisplaying = false;

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
        } else if (sustainOption && (currentEvent == "Note off" /*|| (currentEvent == "Note on" && event.velocity == 0)*/)) MPP.release(currentNote); // end note
    }
    if (!ended && !Player.isPlaying()) {
        ended = true;
        paused = false;
        if (!repeatOption) currentSongIndex = null;
        currentSongName = null;
    } else {
        var timeRemaining = Player.getSongTimeRemaining();
        var timeElapsed = currentSongDuration - (timeRemaining > 0 ? timeRemaining : 0);
        currentSongElapsedFormatted = timeSizeFormat(secondsToHms(timeElapsed), currentSongDurationFormatted);
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

// Check if the color is light or dark
var getContrast = function (hexcolor){

    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === '#') {
        hexcolor = hexcolor.slice(1);
    }

    // If a three-character hexcode, make six-character
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(function (hex) {
            return hex + hex;
        }).join('');
    }

    // Convert to RGB value
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);

    // Get YIQ ratio
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    //return (yiq >= 128) ? 'black' : 'white';
    // tweaked for correct visibility on MPP
    return (yiq >= (255/9)*5) ? 'black' : 'white';

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

// Sends art and tracks art being displayed
var mppArtSend = function(strArray, initialDelay) {
    artDisplaying = true;
    var newDelay = mppChatMultiSend(strArray, null, 0);
    setTimeout(function() {artDisplaying = false}, newDelay);
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

// Gets song from array and plays it
var playSong = function(songIndex) {
    // stop any current songs from playing
    stopSong();
    // play song if it loaded correctly
    try {
        // load song
        Player.loadDataUri(SONG_MIDIS[songIndex]);
        // changes song
        previousSongIndex = currentSongIndex;
        currentSongIndex = songIndex;
        currentSongName = SONG_NAMES[songIndex];
        currentSongDuration = Player.getSongTime();
        currentSongDurationFormatted = timeClearZeros(secondsToHms(currentSongDuration));
        ended = false;
        stopped = false;
        // nice delay before next song
        setTimeout(function() {
            Player.play();
            currentSongElapsedFormatted = timeSizeFormat(secondsToHms(0), currentSongDurationFormatted);
            mppChatSend(PRE_PLAY + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted) + " Now playing " + quoteString(currentSongName), 0);
        }, (autoplayOption != AUTOPLAY_OFF) ? REPEAT_DELAY : 0);
    } catch(error) {
        // reload the previous working file if there is one
        if (previousSongIndex != null) Player.loadDataUri(SONG_MIDIS[previousSongIndex]);
        mppChatSend(PRE_ERROR + " (play) " + error, 0);
    }
}

// plays a random song, but not the same song twice in a row
var playRandom = function() {
    var newSongIndex = currentSongIndex;
    // ignore empty elements
    var testName = "";
    while (testName == "" || newSongIndex == currentSongIndex) {
        if (autoplayOption == AUTOPLAY_RANDOM || autoplayOption == AUTOPLAY_OFF) newSongIndex = randomNumber(0, SONG_LENGTH - 1);
        else if (autoplayOption == AUTOPLAY_ORDERED) {
            newSongIndex = currentSongIndex + 1;
            if (newSongIndex == SONG_LENGTH) newSongIndex = 0;
        }
        testName = "" + SONG_NAMES[newSongIndex];
    }
    playSong(newSongIndex);
}

// Get the string/value to the autoplay option
var getAutoplayString = function(choice) {
    var typeString;
    switch(choice) {
        case AUTOPLAY_OFF: typeString = "off"; break;
        case AUTOPLAY_RANDOM: typeString = "random"; break;
        case AUTOPLAY_ORDERED: typeString = "ordered"; break;
        default: typeString = "unknown"; break; // shouldn't ever get here
    }
    return typeString;
}
var getAutoplayValue = function(choice) {
    var valid = null;
    switch (choice.toLowerCase()) {
        case "false": case "off": case "no": case "0": valid = 0; break;
        case "random": case "1": valid = 1; break;
        case "ordered": case "2": valid = 2; break;
    }
    return valid;
}

// Turns autoplay onto certain modes
var toggleAutoplay = function(choice) {
    // need to set different intervals for different types
    if (choice == AUTOPLAY_RANDOM || choice == AUTOPLAY_ORDERED) autoplayActive = true;
    else autoplayActive = false;
    autoplayOption = choice;
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

// Makes the bot the only one to play or turns it off
var setOwnerOnlyPlay = function(choice) {
    var isOwner = MPP.client.isOwner();
    if (isOwner && exists(choice) && (choice == true || choice == false)) {
        var set = {crownsolo: choice};
        MPP.client.sendArray([{m: "chset", set: set}]);
        console.log("Solo play set to: " + choice.toString());
        return true;
    } else {
        if (!isOwner) console.log(NOT_OWNER);
        else console.log("Invalid choice was entered. Solo play wasn't set.");
        return false
    }
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
var help = function(command, userId, yourId) {
    var isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(COMMANDS, LIST_BULLET + PREFIX, true)
                             + (exists(isOwner) && isOwner ? ' ' + formattedCommands(ROOM_OWNER_COMMANDS, LIST_BULLET + PREFIX, true) : '')
                             + (userId == yourId ? " | Bot Owner Commands: " + formattedCommands(BOT_OWNER_COMMANDS, LIST_BULLET + PREFIX, true) : ''), 0);
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
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(COMMANDS, commandIndex), 0);
        else cmdNotFound(command);
    }
}
var about = function() {
    mppChatSend(PRE_ABOUT + ' ' + BOT_DESCRIPTION + ' ' + BOT_AUTHOR + ' ' + BOT_NAMESPACE, 0);
}
var link = function() {
    mppChatSend(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
}
var play = function(args, argsString) {
    var error = PRE_ERROR + " (play)";
    // args should contain one number related to a song
    if (args == null || args == "") {
        if (autoplayOption == AUTOPLAY_OFF) playRandom();
        else mppChatSend(error + " No song entered", 0);
    } else {
        var valid = null;
        // check which song was picked, and validate it
        var choice = args[0];
        switch (argsString.toLowerCase()) {
            case "key": choice = "1"; break;
            case "door": choice = "2"; break;
            case "subwoofer": case "lullaby": case "subwoofer lullaby": choice = "3"; break;
            case "death": choice = "4"; break;
            case "living": case "living mice": choice = "5"; break;
            case "moog": case "city": case "moog city": choice = "6"; break;
            case "haggstrom": choice = "7"; break;
            case "mine": case "craft": case "minecraft": choice = "8"; break;
            case "equinoxe": choice = "10"; break;
            case "on": case "venus": case "mice on": case "on venus": case "mice on venus": choice = "11"; break;
            case "dry": case "dry hands": choice = "12"; break;
            case "wet": case "wet hands": choice = "13"; break;
            case "clark": choice = "14"; break;
            case "chris": choice = "15"; break;
            case "excuse": choice = "17"; break;
            case "sweden": choice = "18"; break;
            case "danny": choice = "21"; break;
            case "beginning": choice = "22"; break;
            case "droopy": case "likes": case "ricochet": case "droopy likes": case "likes ricochet": case "droopy likes ricochet": choice = "23"; break;
        }
        switch (choice) {
            case "1": case "01":
            case "2": case "02":
            case "3": case "03":
            case "4": case "04":
            case "5": case "05":
            case "6": case "06":
            case "7": case "07":
            case "8": case "08":
            case "10":
            case "11":
            case "12":
            case "13":
            case "14":
            case "15":
            case "17":
            case "18":
            case "21":
            case "22":
            case "23": valid = parseInt(choice); playSong(valid - 1); break;
            default: mppChatSend(error + " Invalid song selection", 0); break;
        }
    }
}
var skip = function() {
    // skips the current song if on autoplay
    if (autoplayOption != AUTOPLAY_OFF) {
        if (ended) mppChatSend(PRE_SKIP + ' ' + NO_SONG, 0);
        else {
            mppChatSend(PRE_SKIP + " Skipped song", 0);
            Player.stop();
            ended = true;
        }
    } else mppChatSend(PRE_ERROR + " (skip) Need to be on random or ordered autoplay mode", 0);
}
var stop = function() {
    // stops the current song
    if (ended) mppChatSend(PRE_STOP + ' ' + NO_SONG, 0);
    else {
        stopSong();
        paused = false;
        mppChatSend(PRE_STOP + " Stopped playing " + quoteString(currentSongName), 0);
        currentSongIndex = currentSongName = null;
    }
}
var pause = function() {
    // pauses the current song
    var title = PRE_PAUSE + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
    if (ended) mppChatSend(title + ' ' + NO_SONG, 0);
    else if (paused) mppChatSend(title + " The song is already paused", 0);
    else {
        Player.pause();
        paused = true;
        mppChatSend(title + " Paused " + quoteString(currentSongName), 0);
    }
}
var resume = function() {
    // resumes the current song
    var title = PRE_RESUME + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
    if (ended) mppChatSend(title + ' ' + NO_SONG, 0);
    else if (paused) {
        Player.play();
        paused = false;
        mppChatSend(title + " Resumed " + quoteString(currentSongName), 0);
    } else mppChatSend(title + " The song is already playing", 0);
}
var song = function() {
    // shows current song playing
    var title = PRE_SONG + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
    if (exists(currentSongName) && currentSongName != "") {
        mppChatSend(title + " Currently " + (paused ? "paused on" : "playing") + ' ' + quoteString(currentSongName), 0);
    } else mppChatSend(title + ' ' + NO_SONG, 0);
}
var album = function() {
    // show list of songs available
    mppChatSend(PRE_ALBUM, 0);
    mppChatMultiSend(SONG_NAMES, null, chatDelay);
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
var autoplay = function(choice) {
    // changes the type of autoplay
    var currentAutoplay = getAutoplayString(autoplayOption);

    if (!exists(choice) || choice == "") mppChatSend(PRE_AUTOPLAY + " Autoplay is currently set to " + currentAutoplay, 0);
    else if (getAutoplayValue(choice) == autoplayOption) mppChatSend(PRE_AUTOPLAY + " Autoplay is already set to " + currentAutoplay, 0);
    else {
        var valid = getAutoplayValue(choice);
        if (valid != null) {
            stopped = false;
            toggleAutoplay(valid);
            mppChatSend(PRE_AUTOPLAY + " Autoplay set to " + getAutoplayString(valid), 0);
        } else mppChatSend(PRE_ERROR + " (autoplay) Invalid autoplay choice", 0);
    }
}
var art = function(name, yourParticipant) {
    // sends Minecraft mob ASCII art, when some isn't already being displayed
    if (exists(name) && !artDisplaying) {
        // depending on color, show normal or inverted art
        var userColor = yourParticipant.color;
        var colorIsDark = getContrast(userColor) == 'black';
        switch(name.toLowerCase()) {
            case "cow": mppArtSend(colorIsDark ? cowArt : cowArtInverted, 0); break;
            case "pig": mppArtSend(colorIsDark ? pigArt : pigArtInverted, 0); break;
            case "carved": case "pumpkin": case "carved pumpkin": mppArtSend(colorIsDark ? carvedPumpkinArt : carvedPumpkinArtInverted, 0); break;
            case "villager": mppArtSend(colorIsDark ? villagerArt : villagerArtInverted, 0); break;
            case "iron": case "golem": case "iron golem": mppArtSend(colorIsDark ? ironGolemArt : ironGolemArtInverted, 0); break;
            case "ender": case "enderman": mppArtSend(colorIsDark ? endermanArt : endermanArtInverted, 0); break;
            case "spider": mppArtSend(colorIsDark ? spiderArt : spiderArtInverted, 0); break;
            case "creep": case "creeper": mppArtSend(colorIsDark ? creeperArt : creeperArtInverted, 0); break;
            case "ghast": mppArtSend(colorIsDark ? ghastArt : ghastArtInverted, 0); break;
            case "skele": case "skeleton": mppArtSend(colorIsDark ? skeletonArt : skeletonArtInverted, 0); break;
            case "slime": mppArtSend(colorIsDark ? slimeArt : slimeArtInverted, 0); break;
            case "zombie": mppArtSend(colorIsDark ? zombieArt : zombieArtInverted, 0); break;
            case "wither": mppArtSend(colorIsDark ? witherArt : witherArtInverted, 0); break;
            case "grass": case "dirt": mppArtSend(colorIsDark ? grassArt : grassArtInverted, 0); break;
            case "cobble": case "stone": case "cobblestone": mppArtSend(colorIsDark ? cobblestoneArt : cobblestoneArtInverted, 0); break;
            case "tnt": mppArtSend(colorIsDark ? tntArt : tntArtInverted, 0); break;
            default: mppChatSend(PRE_ERROR + " (art) There is no art for " + quoteString(name), 0); break;
        }
    } else if (!artDisplaying) mppChatSend(PRE_ART + " Your choices are " + ART_CHOICES, 0);
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

    // check if ping
    if (pinging && input == PRE_PING) {
        pinging = false;
        pingTime = Date.now() - pingTime;
        mppChatSend("Pong! [" + pingTime + "ms]", 0 );
    }

    var participant = msg.p;
    var username = participant.name;
    var userId = participant._id;
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
            case "help": case "h": if (!preventsPlaying) help(argumentsString, userId, yourId); break;
            case "about": case "ab": if (!preventsPlaying) about(); break;
            case "link": case "li": if (!preventsPlaying) link(); break;
            case "play": case "p": if (active && !preventsPlaying) play(arguments, argumentsString); break;
            case "skip": case "sk": if (active && !preventsPlaying) skip(); break;
            case "stop": case "s": if (active && !preventsPlaying) stop(); break;
            case "pause": case "pa": if (active && !preventsPlaying) pause(); break;
            case "resume": case "r": if (active && !preventsPlaying) resume(); break;
            case "song": case "so": if (!preventsPlaying) song(); break;
            case "repeat": case "re": if (active && !preventsPlaying) repeat(); break;
            case "sustain": case "ss": if (active && !preventsPlaying) sustain(); break;
            case "autoplay": case "ap": if (active && !preventsPlaying) autoplay(argumentsString); break;
            case "album": case "al": case "list": if (active) album(); break;
            case "art": if (active) art(argumentsString, yourParticipant); break;
            case "roomcolor": case "rc": if (active) roomcolor(argumentsString); break;
            case "roomcolor1": case "rc1": if (active) roomcolor1(argumentsString); break;
            case "roomcolor2": case "rc2": if (active) roomcolor2(argumentsString); break;
            case "roomcolors": case "rcs": if (active) roomcolors(arguments); break;
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
    var newRoom = MPP.client.channel._id;
    if (currentRoom != newRoom) {
        currentRoom = MPP.client.channel._id;
        // stop any songs that might have been playing before changing rooms
        if (currentRoom.toUpperCase().indexOf(BOT_ROOM_KEYPHRASE) == -1) stopSong();
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

// Stuff that needs to be done by intervals (e.g. autoplay/repeat)
var repeatingTasks = setInterval(function() {
    preventsPlaying = MPP.client.preventsPlaying();
    if (preventsPlaying) return;
    // do autoplay
    if (!repeatOption && autoplayOption != AUTOPLAY_OFF && ended && !stopped) playRandom();
    // do repeat
    else if (repeatOption && ended && !stopped && exists(currentSongIndex)) {
        ended = false;
        // nice delay before playing song again
        setTimeout(function() {Player.play()}, REPEAT_DELAY);
    }
}, 1);

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
                if (currentRoom.toUpperCase().indexOf(BOT_ROOM_KEYPHRASE) >= 0) {
                    active = true;
                    autoplayOption = AUTOPLAY_RANDOM;
                    setRoomColors(BOT_ROOM_COLORS[0], BOT_ROOM_COLORS[1]);
                    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
                    if (BOT_SOLO_PLAY) setOwnerOnlyPlay(BOT_SOLO_PLAY);
                    if (CHANGE_NAME) setOwnerUsername(BOT_USERNAME);
                    console.log(PRE_MSG + " Online!");
                }
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);