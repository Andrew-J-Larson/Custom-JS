// ==UserScript==
// @name         Minecraft Music Bot
// @namespace    https://thealiendrew.github.io/
// @version      2.3.2
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

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const INNER_ROOM_COLOR = 0; // used in room color settings (DON'T CHANGE)
const OUTER_ROOM_COLOR = 1; // used in room color settings (DON'T CHANGE)
const PERCUSSION_CHANNEL = 10; // (DON'T CHANGE)

// Bot constant settings
const ALLOW_ALL_INTRUMENTS = false; // removes percussion instruments (turning this on makes a lot of MIDIs sound bad)
const BOT_ROOM_COLORS = ["#44673B", "#18110b"]; // these are the colors the bot will set the room to by default
const BOT_SOLO_PLAY = true; // sets what play mode when the bot boots up on an owned room

// Bot custom constants
const PREFIX = "/";
const PREFIX_LENGTH = PREFIX.length;
const ART_CHOICES = "cow, pig, carved pumpkin, villager, iron golem, enderman, spider, creeper, ghast, skeleton, slime, zombie, wither, grass, cobblestone, or tnt";
const ADDITIONAL_FEEDBACK_INFO = ", including links to other Minecraft songs as MIDIs or sheet music"; // must keep the comma
const BOT_KEYWORD = "MINECRAFT"; // this is used for auto enabling the public commands in a room that contains the keyword (character case doesn't matter)
const BOT_ACTIVATOR = BOT_KEYWORD.toLowerCase();
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS library."
const BOT_MUSIC_CREDIT = "Music is by C418 from his Minecraft Volume Alpha album (https://c418.bandcamp.com/album/minecraft-volume-alpha).";
const BOT_MIDI_CREDIT = "All songs here are from MIDIs I professionally transcribed from the official sheet music book (https://www.google.com/books/edition/_/ywHUngEACAAJ).";
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const BASE_COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["ping", "gets the milliseconds response time"]
];
const BOT_COMMANDS = [
    ["play (song)", "plays a specific song by name or number, no entry plays a random song"],
    ["skip", "skips the current song (if autoplay is on)"],
    ["stop", "stops all music from playing (this stops autoplay too)"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat", "toggles repeating current song on or off"],
    ["sustain", "toggles how sustain is controlled via either MIDI or by MPP"],
    ["autoplay (choice)", "your choices are off, random, or ordered, no entry shows current setting"],
    ["album", "shows the list of available songs"],
    ["art (choice)", "displays ascii art, no choice shows the choices"]
];
const BOT_OWNER_COMMANDS = [
    [BOT_ACTIVATOR, "toggles the public bot commands on or off"]
];
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_PING = PRE_MSG + "[Ping]";
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
const PRE_PUBLIC = PRE_MSG + "[Public]";
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

var public = false; // turn off the public bot commands if needed
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

// Set the public bot commands on or off (only from bot)
var setPublic = function(userId, yourId) {
    if (userId != yourId) return;
    public = !public;
    mppChatSend(PRE_PUBLIC + " Public bot commands were turned " + (public ? "on" : "off"));
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
            mppChatSend(PRE_PLAY + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted) + " Now playing " + quoteString(currentSongName));
        }, (autoplayOption != AUTOPLAY_OFF) ? REPEAT_DELAY : 0);
    } catch(error) {
        // reload the previous working file if there is one
        if (previousSongIndex != null) Player.loadDataUri(SONG_MIDIS[previousSongIndex]);
        mppChatSend(PRE_ERROR + " (play) " + error);
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
    mppChatSend(PRE_LIMITED + " You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the bot");
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    var error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (public) mppChatSend(error);
    else console.log(error);
}

// Commands
var help = function(command, userId, yourId) {
    var isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, LIST_BULLET + PREFIX, true)
                             + (public ? ' ' + formattedCommands(BOT_COMMANDS, LIST_BULLET + PREFIX, true) : '')
                             + (userId == yourId ? " | Bot Owner Commands: " + formattedCommands(BOT_OWNER_COMMANDS, LIST_BULLET + PREFIX, true) : ''));
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
var play = function(args, argsString) {
    var error = PRE_ERROR + " (play)";
    // args should contain one number related to a song
    if (args == null || args == "") {
        if (autoplayOption == AUTOPLAY_OFF) playRandom();
        else mppChatSend(error + " No song entered");
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
            default: mppChatSend(error + " Invalid song selection"); break;
        }
    }
}
var skip = function() {
    // skips the current song if on autoplay
    if (autoplayOption != AUTOPLAY_OFF) {
        if (ended) mppChatSend(PRE_SKIP + ' ' + NO_SONG);
        else {
            mppChatSend(PRE_SKIP + " Skipped song");
            Player.stop();
            ended = true;
        }
    } else mppChatSend(PRE_ERROR + " (skip) Need to be on random or ordered autoplay mode");
}
var stop = function() {
    // stops the current song
    if (ended) mppChatSend(PRE_STOP + ' ' + NO_SONG);
    else {
        stopSong();
        paused = false;
        mppChatSend(PRE_STOP + " Stopped playing " + quoteString(currentSongName));
        currentSongIndex = currentSongName = null;
    }
}
var pause = function() {
    // pauses the current song
    var title = PRE_PAUSE + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
    if (ended) mppChatSend(title + ' ' + NO_SONG);
    else if (paused) mppChatSend(title + " The song is already paused");
    else {
        Player.pause();
        paused = true;
        mppChatSend(title + " Paused " + quoteString(currentSongName));
    }
}
var resume = function() {
    // resumes the current song
    var title = PRE_RESUME + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
    if (ended) mppChatSend(title + ' ' + NO_SONG);
    else if (paused) {
        Player.play();
        paused = false;
        mppChatSend(title + " Resumed " + quoteString(currentSongName));
    } else mppChatSend(title + " The song is already playing");
}
var song = function() {
    // shows current song playing
    var title = PRE_SONG + ' ' + getSongTimesFormatted(currentSongElapsedFormatted, currentSongDurationFormatted);
    if (exists(currentSongName) && currentSongName != "") {
        mppChatSend(title + " Currently " + (paused ? "paused on" : "playing") + ' ' + quoteString(currentSongName));
    } else mppChatSend(title + ' ' + NO_SONG);
}
var album = function() {
    // show list of songs available
    mppChatSend(PRE_ALBUM);
    mppChatMultiSend(SONG_NAMES, null, chatDelay);
}
var repeat = function() {
    // turns on or off repeat
    repeatOption = !repeatOption;

    mppChatSend(PRE_REPEAT + " Repeat set to " + (repeatOption ? "" : "not") + " repeating");
}
var sustain = function() {
    // turns on or off sustain
    sustainOption = !sustainOption;

    mppChatSend(PRE_SUSTAIN + " Sustain set to " + (sustainOption ? "MIDI controlled" : "MPP controlled"));
}
var autoplay = function(choice) {
    // changes the type of autoplay
    var currentAutoplay = getAutoplayString(autoplayOption);

    if (!exists(choice) || choice == "") mppChatSend(PRE_AUTOPLAY + " Autoplay is currently set to " + currentAutoplay);
    else if (getAutoplayValue(choice) == autoplayOption) mppChatSend(PRE_AUTOPLAY + " Autoplay is already set to " + currentAutoplay);
    else {
        var valid = getAutoplayValue(choice);
        if (valid != null) {
            stopped = false;
            toggleAutoplay(valid);
            mppChatSend(PRE_AUTOPLAY + " Autoplay set to " + getAutoplayString(valid));
        } else mppChatSend(PRE_ERROR + " (autoplay) Invalid autoplay choice");
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
            default: mppChatSend(PRE_ERROR + " (art) There is no art for " + quoteString(name)); break;
        }
    } else if (!artDisplaying) mppChatSend(PRE_ART + " Your choices are " + ART_CHOICES, 0);
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
            case "feedback": case "fb": if (public) feedback(); break;
            case "ping": case "pi": if (public) ping(); break;
            case "play": case "p": if (public && !preventsPlaying) play(arguments, argumentsString); break;
            case "skip": case "sk": if (public && !preventsPlaying) skip(); break;
            case "stop": case "s": if (public && !preventsPlaying) stop(); break;
            case "pause": case "pa": if (public && !preventsPlaying) pause(); break;
            case "resume": case "r": if (public && !preventsPlaying) resume(); break;
            case "song": case "so": if (!preventsPlaying) song(); break;
            case "repeat": case "re": if (public && !preventsPlaying) repeat(); break;
            case "sustain": case "ss": if (public && !preventsPlaying) sustain(); break;
            case "autoplay": case "ap": if (public && !preventsPlaying) autoplay(argumentsString); break;
            case "album": case "al": case "list": if (public) album(); break;
            case "art": if (public) art(argumentsString, yourParticipant); break;
            case BOT_ACTIVATOR: setPublic(userId, yourId); break;
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
                if (currentRoom.toUpperCase().indexOf(BOT_KEYWORD) >= 0) {
                    public = true;
                    autoplayOption = AUTOPLAY_RANDOM;
                    if (BOT_SOLO_PLAY) setOwnerOnlyPlay(BOT_SOLO_PLAY);
                    console.log(PRE_MSG + " Online!");
                }
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);