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

function addcss(css) {
  let head = document.getElementsByTagName('head')[0];
  let s = document.createElement('style');
  s.setAttribute('type', 'text/css');
  if (s.styleSheet) {   // IE
    s.styleSheet.cssText = css;
  } else {                // the world
    s.appendChild(document.createTextNode(css));
  }
  head.appendChild(s);
}

let cssStyleRainbow = `
  .rainbow-hue-animate {
    -webkit-animation: filter-animation 8s infinite;
    animation: filter-animation 8s infinite;
  }
  @-webkit-keyframes filter-animation {
    0% {
      -webkit-filter: hue-rotate(0deg);
    }
    50% {
      -webkit-filter: hue-rotate(100deg);
    }
    100% {
      -webkit-filter: hue-rotate(0deg);
    }
  }
  @keyframes filter-animation {
    0% {
      filter: hue-rotate(0deg);
    }
    50% {
      filter: hue-rotate(100deg);
    }
    100% {
      filter: hue-rotate(0deg);
    }
  }
`

addcss(cssStyleRainbow);
document.body.classList.add('rainbow-hue-animate');
