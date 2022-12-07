// ==UserScript==
// @name         [Dark Reader] Dark Scrollbar for Dark Websites
// @namespace    https://thealiendrew.github.io/
// @version      1.4.7
// @description  Enables a dark scrollbar for every dark website in Dark Reader's list of global dark websites.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        http*://*/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Any%20-%20For%20Dark%20Reader/Dark%20Scrollbar%20for%20Dark%20Websites.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Any%20-%20For%20Dark%20Reader/Dark%20Scrollbar%20for%20Dark%20Websites.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=darkreader.org
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @require      https://unpkg.com/xregexp/xregexp-all.js
// @resource     css https://raw.githubusercontent.com/TheAlienDrew/User-Styles/main/!-User-Styles/Any/Global-Dark-Scrollbar.user.css
// @resource     config https://raw.githubusercontent.com/darkreader/darkreader/main/src/config/dark-sites.config
// ==/UserScript==

/* globals XRegExp */

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

// dark-site.config via https://github.com/darkreader/darkreader/blob/master/src/config/

// First make sure we were able to grab the required resources
if (!GM_getResourceText('css') || !GM_getResourceText('config')) {throw "Error: resources didn't load in time, or some point to a dead link."}

// required variables
const INTERVAL_SPEED = 0; // needs to act like for loop (no delay), but non-blocking
const dark_scrollbar = GM_getResourceText('css'); // gets updated dark scrollbar source (so I don't have to manually update this script all the time)
const dark_sites = GM_getResourceText('config').split('\n'); // gets all sites and puts them in an array
const current_domain = window.location.host;
const current_url = (current_domain + window.location.pathname).replace(/\/$/, ""); // get host and pathname without trailing slash
let is_dark = false;

// loop through dark_sites and see if the current URL matches
let darkSiteIndex = 0;
let checkDarkSites = setInterval(function() {
    // only check if the entry is not blank (like in the case with the last line of some config files)
    if (darkSiteIndex < dark_sites.length && dark_sites[darkSiteIndex]) {
        // note:
        // `$` = end of url; must match to end
        // `*` = url can end in any way; preceeding must match
        // `/` = it must match beyond the domain; url can end in any way

        let dark_url = dark_sites[darkSiteIndex];

        // check dark url for special characters $ or *
        if (dark_url.includes('$')) {
            // string compare both urls for a match without trailing /
            if (current_url.localeCompare(dark_url.split('$')[0].replace(/\/$/, "")) == 0) { is_dark = true; }
        } else if (dark_url.includes('*')) {
            // string compare both urls without special character
            if (current_url.localeCompare(dark_url.split('*')[0]) == 0) { is_dark = true; }
            // only if the current_url is still possible
            else if (current_url.length > dark_url.length - 1) {
                // string compare both urls substringed current_url and without trailing * and /
                if (current_url.substring(0, dark_url.length - 1).localeCompare(dark_url.split('*')[0].replace(/\/$/, "")) == 0) { is_dark = true; }
            }
        } else if (dark_url.includes('/')) { // comparing to full link
            // compare strings without possible trailing slash on dark_url
            let dark_verify = dark_url.replace(/\/$/, "");
            // string compare both urls for a match
            if (current_url.localeCompare(dark_verify) == 0) { is_dark = true; }
            // only if the current_url is still possible
            else if (current_url.length > dark_verify.length) {
                // string compare both urls substringed current_url and without trailing slash
                if (current_url.substring(0, dark_verify.length).localeCompare(dark_verify) == 0) { is_dark = true; }
            }
        } else { // comparing to domain
            // find dark_url in the current_url
            if (current_domain == dark_url) { is_dark = true; }
        }
    } else {
        clearInterval(checkDarkSites);

        // enable dark scrollbar accordingly
        if (is_dark) {
            // captures everything in first bracket pair (e.g. between "@-moz-document ... { ... }")                                                                                  console.log("in 'is_dark'"); // TODO
            let dark_scrollbar_fixed = XRegExp.matchRecursive(dark_scrollbar, '\\{', '\\}', 'g');

            GM_addStyle(dark_scrollbar_fixed);
        }
    }

    darkSiteIndex++;
}, INTERVAL_SPEED);
