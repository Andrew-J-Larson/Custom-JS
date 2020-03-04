// ==UserScript==
// @name         Youtube Sub-Scrollable "Watch Next Secondary Results"
// @namespace    https://thealiendrew.github.io/
// @version      0.1
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/YouTube/Youtube%20Sub-Scrollable%20_Watch%20Next%20Secondary%20Results_.user.js
// @description  Converts the side video suggestions into a confined scrollable list, so you can watch your video while looking at suggestions.
// @author       AlienDrew
// @match        www.youtube.com/watch?v=*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

// required function
function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}

addStyleString("ytd-watch-next-secondary-results-renderer { overflow-y: auto !important; height: 90vh;}");