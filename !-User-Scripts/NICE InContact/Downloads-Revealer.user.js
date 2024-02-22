// ==UserScript==
// @name         NICE InContact - Downloads Revealer
// @namespace    https://andrew-larson.dev/
// @version      1.0.0
// @description  Avoids needing to authenticate a logon to view the downloads available.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://downloads.incontact.com/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/NICE%20InContact/Downloads-Revealer.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/NICE%20InContact/Downloads-Revealer.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=incontact.com
// @grant        none
// @noframes
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (github@andrew-larson.dev)
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

/* globals $ */

// Need to hide the noDownloads element, and show the downloads element
$('#downloads').css("display", "block");
$('#noDownloads').css("display", "none");
