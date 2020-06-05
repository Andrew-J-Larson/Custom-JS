// ==UserScript==
// @name         Poolside FM - Minecraft DLC
// @namespace    https://thealiendrew.github.io/
// @version      0.1.2
// @description  Allows toggling the video to a playable version of Minecraft Classic!
// @author       AlienDrew
// @match        https://poolside.fm/*
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Poolside%20FM/Poolside-FM-Minecraft-DLC.user.js
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjVJivzgAAAEzklEQVRYR71X/VNUZRT2P2iaycBBbaTLusgCYsKCwnJhYfkSiUlh+RIQEkRkRUEjJ5wYjbRpGiuBEcpv8ws1Q9NynNKKaZqpmfqpv+Zpn0Nn5+1yN0DLnXnmvPdj3/Oc5zzn7t5ly57tY0W/Tjz3j/X+TDMO3tuC4UfbcPRWPZ4XEWv0TiPevLQZE7Pd+Pj7ndhzvQij9+qx73YIzePZ/xsRq+HUBrSf82PX5XxB65lswfH7DTj8ba1g8G6VYGo28p8RsSKTwViyd25US/V9N0tw/OdWdFzIw+hsC3pvFKP/yzLBB980CQ58VYGeS8GnJmK1TeZhx+cb0X0lgPBEhmw+9uMuUaHriwLsPJ+LT590ynkeX/vzbZDg7quF2H+nXIjyWtvZHJx82LloIlbr6VzUj6cLIrdKBSe/axeQzJlfI5Jw/KcuHPq6Gu/drROQDHH2t30CXiN6rtmCujEfak544xKxDl/eiu2n0qQCVkkJmYRG2zsdFLl5/eIfA0Lg2Mx2aQ03P/pDI5qn5jxCldgSfuejR61Cgp5Rwjwef7JnHhHL7l6LQKcFSj90Jdq/6MYcs08ed0iigZlKcXrTZBZaPnsN+88VyyTwHiam7LyuU0EVSJKtYlKatH+6EmsLE+AJJLgTaBzajLqBHAR7UoUIJWc1BNcmqBR7zM2pDiukV966v1VaQv9oC6mur2Ql1pWsEFgFL80nkJ2SiK5jISFAlPSlgqo0jc0ZkdARfPd2LYjOi5sw9UuvqEXTkcjI4zCGHtQIib6rZfDaifDYy5Ff40VmxWqBKwHbtoVAca8HpZHUOQI9KQh0J6NhMD9GhGrQH8SJB42izoXfD+DDhy0CJifp1KJEqdZbHJX8bwKB2nUg1iS8MF+Big2vYpM3SVA5kCHgesvB9Wg/UoQdw4Uo7U2Tpx2rpw9Igt5g9Uw+Ml2HlMDLyK5IhrXixTm5o5FVUwGuifRXlru3oCO0HkP1+bHkSmDbsB9tR2xUDWZGVbGkNYfOVwoBVt8ykSNS51ZZ2Fi+JkYgvXxlLKkvlLQ4AiTBxIw1fo+0gMdl/T50jARlndexCsG9XthdHqSVJIGbE/YbPpFcK9eKNfp8PhBxFWBCTaxR20ICuiaBwt1zLcusjJoqKiuTE1xnlK+SmJWcEKvaXLsSiLzuF/lJIhwOCxFNqDEUCsn1f5yv9sSSmBUzoSbVdVVOCghXAk22TwgQWr0mYySUgJLjOSalrIwFvtWSwCTCYxJg5HUiLgG3FqgqjKxc79G1Sq2ba9SkSojnVYm4BMzKnSqoOqoGI89xY63eTKLJTGJ6rjQref4YsgU6hqb0OhHmZCg5EnD22e/3CylNxug8zo0q6fwLZ5GAVqWyq8wqu6mKnlOJnX12M6Cq4UqAT0ImMKsz+216wVRITWZWypao6WhQpwL/akLtsbaDke5XDzi9oJurGZ2uJwGzHVy7eoDPAa1Mq3WaUhVi1GeFm+tNVZwPIx67KaAvFhaJxJsGUx29xyRgOl5bYD6Q3Hof741GTMkq1YiMqozpjXiO1/FcqOKFXqli06ETYhJxPgecci+l4kUTUQJqRue48djtD8dCCRZ73eK4ml7Q8eMUuLl7sRsv9T5pDY0Y78dlqRs+7f3P/Hr+FzIf4ieGYVVoAAAAAElFTkSuQmCC
// @grant        none
// @run-at       document-end
// @noframes
// ==/UserScript==

/* Copyright (C) 2020  Andrew Larson (thealiendrew@gmail.com)
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

// CONSTANTS

const WAIT_TO_CHANGE = 2000;
const LOOP_TIME = 100;
const STYLE_IFRAME = "width: 100%; height: 100%; transform: none; left: auto; top: auto;";
const RETRO_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABg2lDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV+/RSoOdhBRyFCdLIiKOEoVi2ChtBVadTC59AuaNCQpLo6Ca8HBj8Wqg4uzrg6ugiD4AeLk6KToIiX+Lym0iPHguB/v7j3u3gHeZpUphn8CUFRTTyfiQi6/KoReEUQAfowgKDJDS2YWs3AdX/fw8PUuxrPcz/05+uSCwQCPQDzHNN0k3iCe2TQ1zvvEEVYWZeJz4nGdLkj8yHXJ4TfOJZu9PDOiZ9PzxBFiodTFUhezsq4QTxNHZUWlfG/OYZnzFmelWmfte/IXhgvqSobrNIeRwBKSSEGAhDoqqMJEjFaVFANp2o+7+Idsf4pcErkqYORYQA0KRNsP/ge/uzWKU5NOUjgOBF4s62MUCO0CrYZlfR9bVusE8D0DV2rHX2sCs5+kNzpa9Ajo3wYurjuatAdc7gCDT5qoi7bko+ktFoH3M/qmPDBwC/SuOb2193H6AGSpq+Ub4OAQGCtR9rrLu3u6e/v3TLu/HwcycnyvF/K0AAACi1BMVEXcJcX//////8z//5n//2b//zP//wD/zP//zMz/zJn/zGb/zDP/zAD/mf//mcz/mZn/mWb/mTP/mQD/Zv//Zsz/Zpn/Zmb/ZjP/ZgD/M///M8z/M5n/M2b/MzP/MwD/AP//AMz/AJn/AGb/ADP/AADM///M/8zM/5nM/2bM/zPM/wDMzP/MzMzMzJnMzGbMzDPMzADMmf/MmczMmZnMmWbMmTPMmQDMZv/MZszMZpnMZmbMZjPMZgDMM//MM8zMM5nMM2bMMzPMMwDMAP/MAMzMAJnMAGbMADPMAACZ//+Z/8yZ/5mZ/2aZ/zOZ/wCZzP+ZzMyZzJmZzGaZzDOZzACZmf+ZmcyZmZmZmWaZmTOZmQCZZv+ZZsyZZpmZZmaZZjOZZgCZM/+ZM8yZM5mZM2aZMzOZMwCZAP+ZAMyZAJmZAGaZADOZAABm//9m/8xm/5lm/2Zm/zNm/wBmzP9mzMxmzJlmzGZmzDNmzABmmf9mmcxmmZlmmWZmmTNmmQBmZv9mZsxmZplmZmZmZjNmZgBmM/9mM8xmM5lmM2ZmMzNmMwBmAP9mAMxmAJlmAGZmADNmAAAz//8z/8wz/5kz/2Yz/zMz/wAzzP8zzMwzzJkzzGYzzDMzzAAzmf8zmcwzmZkzmWYzmTMzmQAzZv8zZswzZpkzZmYzZjMzZgAzM/8zM8wzM5kzM2YzMzMzMwAzAP8zAMwzAJkzAGYzADMzAAAA//8A/8wA/5kA/2YA/zMA/wAAzP8AzMwAzJkAzGYAzDMAzAAAmf8AmcwAmZkAmWYAmTMAmQAAZv8AZswAZpkAZmYAZjMAZgAAM/8AM8wAM5kAM2YAMzMAMwAAAP8AAMwAAJkAAGYAADMAAAChccriAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAHdElNRQfkBgUFBh5TAa6oAAABAElEQVQ4y5WT27HCMAxEqZECXEluAapEX9uMv7acu5IcE+fBDJrAAOdoJcB5vX6rP9VX/FY9KoUflQ++VVZ8Ua54Ue7xQXF/Sui9hO1OCewlwLeLktinkIYff4cevHemYMDm+KQEprM7iUow83BKqXB2xjWE1tKJmMjVQ80qYAomB4pxR6cGdIJ51Q6i4iptIyGbjfluF6yZpiCe1QikoppCqymxDFNFvFgF4YgyBMjuRdASmhBBU1hHyG92FHgSRDMgVk+Ms9BKiNG0gacwpo+EnVIxGGfKRkgl7N3E4VRKHkvs/cDpXOvDUPJb8IrnLimAD/eWxX+yzr5JwY/3+z8GxWE1L5NCqQAAAABJRU5ErkJggg==";
const RETRO_DITHERED_ICON = "data:image/png;base64,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";

// VARIABLES

var loadedYT = false;
var isResizing = false;

var minecraft = document.createElement("iframe");
minecraft.setAttribute("frameborder", "0");
minecraft.setAttribute("scrolling", "no");
minecraft.setAttribute("allowfullscreen", "1");
minecraft.setAttribute("allow", "encrypted-media;");
minecraft.setAttribute("title", "Minecraft app");
minecraft.setAttribute("width", "100%");
minecraft.setAttribute("height", "100%");
minecraft.setAttribute("src", "https://classic.minecraft.net/");
minecraft.setAttribute("id", "widget2");
minecraft.setAttribute("style", "pointer-events: all; " + STYLE_IFRAME);

// FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Where el is the DOM element you'd like to test for visibility
function isHidden(el) {
    return (el.offsetParent === null)
}

// Converts the Poolside TV into Minecraft
var convertToMinecraft = function(webIframe, webShortcut) {
    // MORE VARIABLES
    var webInnerContent = webIframe.parentElement;
    var webInnerWrapper = webInnerContent.parentElement.children[0];
    var webWindow = webInnerWrapper.parentElement.parentElement;
    var webWindowDragHeader = webWindow.children[1];
    var webWindowTitle = webWindowDragHeader.children[2];
    var webVideoBar = webInnerContent.children[0];
    var webVideoOverlay = webInnerContent.children[2];
    var webIconImageWrapper = webShortcut.children[0];
    var webIconImage = webIconImageWrapper.children[0];
    var webIconText = webShortcut.children[1];

    // change the shortcut
    webIconImage.src = RETRO_DITHERED_ICON;
    webIconText.innerText = "Minecraft";

    // rename the window
    webWindow.id = "minecraft";
    webWindowTitle.innerText = "Minecraft";

    // style the window
    document.styleSheets[0].addRule("#minecraft.hide-graphic .inner-wrapper", "padding: 0 5px 15px 5px !important;");
    document.styleSheets[0].addRule("#minecraft.hide-graphic .handle-br", "z-index: auto !important;");
    document.styleSheets[0].addRule("#minecraft.hide-graphic:after", "display: block !important;");

    // replace the iframe
    webInnerContent.replaceChild(minecraft, webIframe);

    // fix gui on startup
    var iStyle = webWindow.getAttribute("style");
    var iPreStyle = iStyle.substring(0, iStyle.indexOf("width"));
    webWindow.style = iPreStyle + "width: 500px; height: 375px;";
    setTimeout(function() {webWindow.style = iStyle;}, WAIT_TO_CHANGE);

    // delete the video bar
    webInnerContent.removeChild(webVideoBar);

    // delete the overlay
    //webInnerContent.removeChild(webVideoOverlay);
    // or make overlay click through
    webVideoOverlay.setAttribute("style", "pointer-events: none;");

    // watch for when resizing to fix issues with it being bugged
    setInterval(function() {
        var resizeCheck = webWindow.classList.contains("resizing");
        if (resizeCheck && !isResizing) {
            isResizing = true;
            minecraft.setAttribute("style", "pointer-events: none; " + STYLE_IFRAME);
        } else if (!resizeCheck && isResizing) {
            isResizing = false;
            minecraft.setAttribute("style", "pointer-events: all; " + STYLE_IFRAME);
        }
    }, LOOP_TIME);
}

// MAIN

var waitForIframe = setInterval(function() {
    var youtubeLoader = document.querySelector('.youtube-loader');
    var theIframe = document.querySelector("#widget2");
    var theShortcut = document.querySelector("#app > div > div.section-icons.is-absolute > ul:nth-child(1) > li:nth-child(2) > div");
    if (exists(youtubeLoader)) {
        loadedYT = true;
        return;
    }
    if (exists(theIframe) && exists(theShortcut) && loadedYT && !exists(youtubeLoader) && !isHidden(theIframe)) {
        clearInterval(waitForIframe);

        convertToMinecraft(theIframe, theShortcut);
    }
}, LOOP_TIME);
