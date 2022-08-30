// ==UserScript==
// @name         Cheap Apartments Sort
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  try to take over the world!
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://www.apartmentlist.com/shortlist
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Apartment%20List/Cheap-Apartments-Sort.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Apartment%20List/Cheap-Apartments-Sort.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=apartmentlist.com
// @grant        GM_addStyle
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

// Constant Datatypes

const propertyDatatype = {
  element: null,
  price: null
}

// Constant Times

const intervalLoop = 200;

// Constant Selectors/IDs

const getPriceSelector = 'div > div > a[href^="/shortlist/"] > div > div:last-child';
const propertyElementsSelector = `[id^="loaded-property-card-"]`;
const navbarId = 'header-navbar';
const cheapPropertiesSortId = 'cheapPropertiesSort';
const cheapPropertiesLeftId = 'cheapPropertiesLeft';
const cheapPropertiesRightId = 'cheapPropertiesRight';
const cheapPropertiesPageTextId = 'cheapPropertiesPageText';

// Constant CSS

const cheapPropertySortCSS = "#cheapPropertiesSort{user-select:none;display:inline-block;margin:0;border-radius:15px;border:1px solid #000;font-weight:700;font-size:smaller;background-color:#3c3;color:#fff}#cheapPropertiesSort button{border:none;border-radius:100%;outline:0;text-align:center;text-decoration:none;display:inline-block;padding:.33rem .5rem;background:0 0}#cheapPropertiesSort button:not(:disabled){cursor:pointer;color:#fff}#cheapPropertiesSort button:not(:disabled):hover{background:#29a329}#cheapPropertiesSort button:not(:disabled):active{background:#70db70}";

// Main

let properties = []; // array that will contain the sorted properties

// get all property cards
let propertyElements = document.body.querySelectorAll(propertyElementsSelector);
// look through each property card and save element reference and price (in format that can easily be checked against, see datatype)
for (let i = 0; i < propertyElements.length; i++) {
  let addProperty = Object.assign({}, propertyDatatype);
  addProperty.element = propertyElements[i];
  addProperty.price = ((addProperty.element).querySelector(getPriceSelector).innerText).replace('$', '').replace(',', '');
  properties.push(addProperty);
  let priceEnd = addProperty.price.indexOf('\n');
  addProperty.price = (addProperty.price).substring(0, priceEnd != -1 ? priceEnd : (addProperty.price).length);
}

delete propertyElements; // no need to keep this anymore

// sort properties from lowest to highest price, places without a price come first
properties.sort(function(a, b) {
  if(a.price === Infinity) return 1;
  else if(isNaN(a.price)) return -1;
  else return a.price - b.price;
});

// start adding the sort buttons to sift through cheap options
GM_addStyle(cheapPropertySortCSS);

// create the basic button layout with IDs
let cheapPropertiesSortElement = document.createElement('div');
cheapPropertiesSortElement.id = cheapPropertiesSortId;
cheapPropertiesSortElement.innerHTML = '<button type="button" id="'+cheapPropertiesLeftId+'" disabled>&#9664;</button> Cheapest<label id="'+cheapPropertiesPageTextId+'"></label> <button type="button" id="'+cheapPropertiesRightId+'" disabled>&#9654;</button>'

// need to add the button somewhere, chose right after logo in the first navbar element
let firstNavbarElement = document.querySelector('#'+navbarId+' > div > div:first-of-type');
firstNavbarElement.appendChild(cheapPropertiesSortElement);

// get buttons and assign functions required to traverse the cheap properties list
let propertyLeftBtn = document.getElementById(cheapPropertiesLeftId);
let propertyRightBtn = document.getElementById(cheapPropertiesRightId);
let propertyPageTxt = document.getElementById(cheapPropertiesPageTextId);

let currentIndex = 0; // index updates with each left or right button click

// enables/disables buttons and updates entry label after each button click
// also scrolls the next cheap property into view
let updatePropertyButtons = function() {
  if (properties.length <= 0 && (!propertyLeftBtn.disabled || !propertyLeftBtn.disabled)) {
    propertyLeftBtn.disabled = true;
    propertyRightBtn.disabled = true;
    propertyPageTxt.innerText = '';
  } else {
    if (currentIndex <= 0 && !propertyLeftBtn.disabled) propertyLeftBtn.disabled = true;
    else if (currentIndex > 0 && propertyLeftBtn.disabled) propertyLeftBtn.disabled = false;
    if (currentIndex >= (properties.length - 1) && !propertyRightBtn.disabled) propertyRightBtn.disabled = true;
    else if (currentIndex < (properties.length - 1) && propertyRightBtn.disabled) propertyRightBtn.disabled = false;
  }
  (properties[currentIndex]).element.scrollIntoView(true);
  propertyPageTxt.innerText = " (" + (currentIndex + 1) + ")";
};

updatePropertyButtons(); // need to activate at least once to initialize the buttons/entry label

// functions for buttons, updates index then updates buttons
propertyLeftBtn.onclick = function() {
  currentIndex--;
  updatePropertyButtons();
};
propertyRightBtn.onclick = function() {
  currentIndex++;
  updatePropertyButtons();
};
