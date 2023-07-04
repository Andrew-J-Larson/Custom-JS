// ==UserScript==
// @name         YouTube - Scrollable Suggestions
// @namespace    https://thealiendrew.github.io/
// @version      1.9.2
// @description  Converts the side video suggestions into a confined scrollable list, so you can watch your video while looking at suggestions.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://*.youtube.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/main/!-User-Scripts/YouTube/Scrollable-Suggestions.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/main/!-User-Scripts/YouTube/Scrollable-Suggestions.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @require      https://code.jquery.com/jquery.min.js
// @require      https://code.jquery.com/ui/1.13.2/jquery-ui.min.js
// @require      https://cdn.jsdelivr.net/gh/meetselva/attrchange@66f69103f3a5842b7f1deaaccf2894f8ee8b5774/js/attrchange.js
// @noframes
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (thealiendrew@gmail.com)

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

// basic
const scriptShortName = 'YTscrollSuggest';
const fastDelay = 100; // in milliseconds

// initial load
const thumbnailsLoadInitial = 20;
const thumbnailsLoadMust = 10;

// selectors
//const pageSelector        = 'ytd-app';
const headerSelector = '#masthead-container';
const leftSelector = '#primary';
const leftInSelector = leftSelector + '-inner';
const rightSelector = '#secondary';
const rightInSelector = rightSelector + '-inner';
const playerSelector = '#player-container-outer';
const theaterSelector = '#player-theater-container';
const miniplayerSelector = 'button.ytp-miniplayer-button';
const sizeSelector = 'button.ytp-size-button';
const fullscreenSelector = 'button.ytp-fullscreen-button';
const panelsSelector = '#panels';
const donationsSelector = '#donation-shelf';
const chatSelector = 'ytd-live-chat-frame#chat';
const playlistSelector = '#playlist';
const adsSelector = '#player-ads';
const offerModuleSelector = '#offer-module';
const sugContainSelector = '#related > ytd-watch-next-secondary-results-renderer > #items';
const suggestionsSelector = sugContainSelector + ' > ytd-item-section-renderer > #contents';
const autoPlaySelector = 'ytd-compact-autoplay-renderer';
const autoRelatedSelector = 'yt-related-chip-cloud-renderer';
const notAutoPlaySelector = ':not(.ytd-compact-autoplay-renderer)';
const itemThumbSelector = 'ytd-thumbnail:not(.ytd-rich-metadata-renderer)';
const videoPlaySelector = 'ytd-compact-video-renderer';
const videoItemSelector = videoPlaySelector + notAutoPlaySelector;
const plPlaySelector = 'ytd-compact-playlist-renderer';
const plItemSelector = plPlaySelector + notAutoPlaySelector;
const radioPlaySelector = 'ytd-compact-radio-renderer';
const radioItemSelector = radioPlaySelector + notAutoPlaySelector;
const moviePlaySelector = 'ytd-compact-movie-renderer';
const movieItemSelector = moviePlaySelector + notAutoPlaySelector;
const movieItemASelector = 'a.yt-simple-endpoint.ytd-compact-movie-renderer';
const spinnerSelector = 'ytd-watch-next-secondary-results-renderer #continuations';

// misc selectors
const continuationsItemRendererSelector = 'ytd-continuation-item-renderer';

// constant strings
const miniplayerExit = 'Expand (i)';
const miniplayerEnter = 'Miniplayer (i)';
const sizeExit = 'Default view (t)';
const sizeEnter = 'Theater mode (t)';
const fullscreenExit = 'Exit full screen (f)';
const fullscreenEnter = 'Full screen (f)';

// styling
const cssClassPrefix = GM_info.script.author + scriptShortName;
const standardPadding = 24; // in px
const videoItemPadding = 8; // in px
const spinnerPadding = 16; // in px
const scrollbarWidth = 17; // in px
//const videoMinWidth           = 'var(--ytd-watch-flexy-min-player-width)';
//const videoMaxWidth           = 'var(--ytd-watch-flexy-max-player-width)';
//const sidebarWidth            = 'var(--ytd-watch-flexy-sidebar-width)';
//const sidebarMinWidth         = 'var(--ytd-watch-flexy-sidebar-min-width)';
const pageColorA = 'var(--yt-spec-general-background-a)';
const pageColorB = 'var(--yt-spec-general-background-b)';
const pageColorC = 'var(--yt-spec-general-background-c)';
const cssSuggestionsClass = cssClassPrefix + 'Suggestions';
const cssSpinnerClass = cssClassPrefix + 'Spinner';
const cssSugClassSelector = '.' + cssSuggestionsClass;
const cssScrollbarSelector = '.' + cssSuggestionsClass + '::-webkit-scrollbar';
const cssSugItemClassSelector = '.' + cssSuggestionsClass + ' > *';
const cssSpinClassSelector = '.' + cssSpinnerClass;
// scroll-padding is the margin between each item
const cssSuggestionsStyle = cssSugClassSelector + ' { overflow-y: auto; scroll-snap-type: y proximity }' + cssScrollbarSelector + ' { height:auto } ' + cssScrollbarSelector + '-thumb { background-color:#ccc; border:2px solid ' + pageColorB + ' } ' + cssScrollbarSelector + '-track { background-color:' + pageColorB + ' } [dark] ' + cssScrollbarSelector + '-thumb { background-color:#333;border:2px solid ' + pageColorB + ' } [dark] ' + cssScrollbarSelector + '-track { background-color:' + pageColorB + ' }';
const cssSugItemStyle = cssSugItemClassSelector + ' { scroll-snap-align: end }';
// padding screws up the scrollbar effect, so must remove it
const cssMovieItemStyle = cssSugClassSelector + ' ' + movieItemASelector + ' { padding-right: 0px }';
// must be above everything, but not be showing so it's not awkward, and must follow scrollbar in view to activate
const cssSpinnerStyle = cssSpinClassSelector + ' { z-index: 999; position: fixed; opacity: 0 }';
const cssConstantStyle = cssSuggestionsStyle + ' ' + cssSugItemStyle + ' ' + cssMovieItemStyle + ' ' + cssSpinnerStyle;

let firstRun = true;
// need to always be changed
let suggestions, autoPlay, autoRelated, videoItem, plItem, radioItem, movieItem, movieItemA, spinner;
// these variables get set each time the video page is brought up, and when there is window changes
let visibility = document.visibilityState;
let enabledYT, disabledYT, extendedDisable;

// wait for element to show up with a position, then execute code
/* not sure why I created this function, but I'll leave it here for now
let waitForPosition = function(element, aFunction, time) {
    if (element.position() != null) {
        aFunction()
        return;
    } else {
        setTimeout(function() {
            waitForPosition(time);
        }, time);
    }
};
*/

// if the element gains or loses height do something
let detectHeightChange = function(element, aFunction) {
    let prevHeight = element.height();
    element.attrchange({
        callback: function(e) {
            let curHeight = element.height();
            if (prevHeight !== curHeight) {
                aFunction(true);
                prevHeight = curHeight;
            }
        }
    }).resizable();
};

// don't try to do anything until page is visible
$(document).on('visibilitychange', function() {
    visibility = document.visibilityState;
});

// prevent page from scolling when trying to scroll on an element
let disablePageScrolling = function(element) {
    // code via https://stackoverflow.com/a/33672757/7312536
    element.on('DOMMouseScroll mousewheel', function(ev) {
        if (enabledYT && !disabledYT) {
            let $this = $(this),
                scrollTop = this.scrollTop,
                scrollHeight = this.scrollHeight,
                height = $this.height(),
                delta = (ev.type == 'DOMMouseScroll' ?
                    ev.originalEvent.detail * -40 :
                    ev.originalEvent.wheelDelta),
                up = delta > 0;

            let prevent = function() {
                ev.stopPropagation();
                ev.preventDefault();
                ev.returnValue = false;
                return false;
            }

            if (!up && -delta > scrollHeight - height - scrollTop) {
                // Scrolling down, but this will take us past the bottom.
                $this.scrollTop(scrollHeight);
                return prevent();
            } else if (up && delta > scrollTop) {
                // Scrolling up, but this will take us past the top.
                $this.scrollTop(0);
                return prevent();
            }
        }
    });
};

// check if element has an attribute
let checkAttribute = function(element, attribute) {
    let attr = element.attr(attribute);

    // For some browsers, `attr` is undefined; for others,
    // `attr` is false.  Check for both.
    if (typeof attr !== typeof undefined && attr !== false) {
        return true;
    } else return false;
};

// checks if an element is in viewport
/*
let isInViewport = function(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};
*/

// check if element has a height
let hasHeight = function(element) {
    let height = element.height();

    if (typeof height === typeof undefined || isNaN(height) || height == 0) return false;
    else return true;
};

// check if element has a width
let hasWidth = function(element) {
    let width = element.width();

    if (typeof width === typeof undefined || isNaN(width) || width == 0) return false;
    else return true;
};

// append css styling to html page
let addStyleString = function(str) {
    let node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
};

// enable/disable scrollbar function
let enableSuggestionsScroll = function(trueFalse) {
    // readdress where elements are first
    suggestions = $(suggestionsSelector).first();
    autoPlay = $(autoPlaySelector).first();
    autoRelated = $(autoRelatedSelector).first();
    videoItem = $(videoItemSelector);
    plItem = $(plItemSelector);
    radioItem = $(radioItemSelector);
    movieItem = $(movieItemSelector);
    movieItemA = $(movieItemASelector);
    spinner = $(spinnerSelector).first();

    // toggle styling
    if (trueFalse) {
        if (suggestions) suggestions.addClass(cssSuggestionsClass);
        if (spinner) spinner.addClass(cssSpinnerClass);
    } else {
        if (suggestions && suggestions.classList && suggestions.classList.contains(cssSuggestionsClass)) suggestions.removeClass(cssSuggestionsClass);
        if (spinner && spinner.classList && spinner.classList.contains(cssSpinnerClass)) spinner.removeClass(cssSpinnerClass);

        // these get dynamically changed in script
        if (suggestions) suggestions.css({ 'width': '', 'height': '', 'margin-top': '', 'position': '', 'top': '' });
        if (autoPlay) autoPlay.css({ 'width': '', 'position': '', 'top': '' });
        if (autoRelated) autoRelated.css({ 'width': '', 'position': '', 'top': '' });
        if (spinner) spinner.css({ 'width': '', 'margin-top': '', 'top': '', 'bottom': '' });
        if (videoItem) videoItem.css({ 'opacity': '', 'width': '' });
        if (plItem) plItem.css({ 'opacity': '', 'width': '' });
        if (radioItem) radioItem.css({ 'opacity': '', 'width': '' });
        if (movieItem) movieItem.css({ 'opacity': '', 'width': '' });
        if (movieItemA) movieItemA.css({ 'width': '' });
    }
};

// contains classes used to style everything
addStyleString(cssConstantStyle);

// enables for the first time (from video page)
function yt_navigate_finish() {
    if (window.location.href.indexOf('youtube.com/watch?') > -1) {
        enabledYT = false;
        disabledYT = true;
        extendedDisable = false;

        // must run at least once (after the page is in view)
        let waitUntilPageInView = setInterval(function() {
            if (visibility == 'visible') {
                clearInterval(waitUntilPageInView);

                // must check to make sure the first PRELOAD suggested videos have thumbnails
                enableSuggestionsScroll(false); // needed first when dynamic loading happens
                let imagesLoaded = 0;
                let i = 0,
                    j = 0;
                let loadThumbnails = true;
                let loopingItems = setInterval(function() {
                    if (loadThumbnails) {
                        let suggestionItems = $(suggestionsSelector).first().children();
                        // make sure item exists and is in view
                        let currentItem = suggestionItems[i];
                        // go through all thumbnails that load in on the page
                        if (suggestionItems.length >= thumbnailsLoadInitial && currentItem) {
                            // current item must be video suggestion
                            if (currentItem.tagName.toLowerCase() == videoPlaySelector ||
                                currentItem.tagName.toLowerCase() == plPlaySelector ||
                                currentItem.tagName.toLowerCase() == radioPlaySelector ||
                                currentItem.tagName.toLowerCase() == moviePlaySelector) {
                                // make sure thumbnail exists
                                let thumbnailImg = currentItem.querySelector('#img');
                                if (thumbnailImg) {
                                    // make sure thumbnail adds to total needed to load
                                    if (thumbnailImg.hasAttribute('src') && thumbnailImg.src != '') {
                                        i++;

                                        // and make sure that we are in the viewPort
                                        //loadThumbnails = isInViewport(currentItem);
                                    }

                                    // make sure that we are at the second to last index, since the last element isn't a video
                                    loadThumbnails = i != (thumbnailsLoadMust - 1);
                                }
                            }
                        }
                    } else {
                        // now we can go on with the script
                        clearInterval(loopingItems);

                        // set globals
                        suggestions = $(suggestionsSelector).first();
                        autoPlay = $(autoPlaySelector).first();
                        autoRelated = $(autoRelatedSelector).first();
                        videoItem = $(videoItemSelector);
                        plItem = $(plItemSelector);
                        radioItem = $(radioItemSelector);
                        movieItem = $(movieItemSelector);
                        movieItemA = $(movieItemASelector);
                        spinner = $(spinnerSelector).first();
                        // initialize semi-globals
                        var header = $(headerSelector),
                            leftCoIn = $(leftInSelector),
                            rightContn = $(rightSelector),
                            rightCoIn = $(rightInSelector),
                            player = $(playerSelector).first(),
                            theater = $(theaterSelector).first(),
                            panels = $(panelsSelector),
                            donations = $(donationsSelector),
                            chat = $(chatSelector).first(),
                            playlist = $(playlistSelector),
                            ads = $(adsSelector),
                            offerModule = $(offerModuleSelector),
                            videoThumb = $(itemThumbSelector),
                            autoPHeight = autoPlay.length ? autoPlay.outerHeight(true) : 0,
                            autoRHeight = autoRelated.length ? autoRelated.outerHeight(true) : 0,
                            autoHeights = autoPHeight + autoRHeight,
                            vItemHeight = videoItem.height() || plItem.height() || radioItem.height() || movieItem.height(),
                            vItemHPad = vItemHeight + videoItemPadding,
                            vThumbWidth = videoThumb.outerWidth(true),
                            headHeight = header.height(),
                            contentTop = headHeight + standardPadding,
                            autosBottom = contentTop + autoHeights,
                            minHeight = vItemHeight,
                            previousScr = 0,
                            sliding = false,
                            atSugEnd = false,
                            fullscreen = false;

                        // disable page scrolling when scrollbar is active
                        disablePageScrolling(suggestions);
                        suggestions.scrollTop(0); // glitches to a different position if this isn't here
                        if (autoPlay.length) disablePageScrolling(autoPlay);
                        if (autoRelated.length) disablePageScrolling(autoRelated);
                        disablePageScrolling(spinner);

                        if (firstRun) firstRun = false;

                        // detect position changes to change size accordingly
                        window.fixDynamicSizes = function(forceRun) {
                            if (visibility == 'visible') {
                                let viewHeight = $(window).height(),
                                    viewWidth = $(window).width(),
                                    playerWidth = hasWidth(player) ? player.width() : 0,
                                    theaterEnabled = theater.children().length > 0,
                                    secondaryGone = rightCoIn.children().length <= 1;

                                disabledYT = secondaryGone || extendedDisable;

                                if (enabledYT && disabledYT) {
                                    // not disabled yet, disabling
                                    console.log(scriptShortName + ': disabling suggestions scrollbar...');
                                    enableSuggestionsScroll(false);
                                    enabledYT = false;
                                    window.fixDynamicSizes(false);
                                } else if (enabledYT && !disabledYT) {
                                    let scrTop = $(window).scrollTop(),
                                        outsidePadding = leftCoIn.position().left,
                                        resizeWidth = (viewWidth - (leftCoIn.width() + standardPadding + outsidePadding * 2)),
                                        theatherHeight = theaterEnabled ? (hasHeight(theater) ? theater.outerHeight(true) : 0) : 0,
                                        panelsHeight = hasHeight(panels) ? panels.outerHeight(true) : 0,
                                        donationsHeight = hasHeight(donations) ? (donations.outerHeight(true) + standardPadding) : 0,
                                        chatHeight = hasHeight(chat) ? chat.outerHeight(true) : 0,
                                        playlistHeight = hasHeight(playlist) ? playlist.outerHeight(true) : 0,
                                        adsHeight = hasHeight(ads) ? ads.outerHeight(true) : 0,
                                        offerModHeight = hasHeight(offerModule) ? offerModule.outerHeight(true) : 0,
                                        fillerHeight = (fullscreen ? 0 : theatherHeight) + panelsHeight + donationsHeight + chatHeight + playlistHeight + adsHeight + offerModHeight,
                                        oriPosTop = (fullscreen ? (viewHeight + standardPadding) : contentTop) + fillerHeight,
                                        oriScrTop = oriPosTop - scrTop,
                                        belowTopPos = viewHeight - oriScrTop,
                                        allInView = (belowTopPos - minHeight) >= 0;

                                    // if suggestions is or not moving
                                    if (!sliding && previousScr != scrTop) {
                                        previousScr = scrTop;
                                        if (scrTop && allInView) {
                                            sliding = true;
                                        }
                                    } else {
                                        if ((!scrTop || !allInView)) {
                                            sliding = false;
                                        }
                                    }

                                    // determine if position/size needs updating
                                    if (sliding || forceRun) {
                                        let maxHeight = (vItemHPad * Math.floor((viewHeight - (autosBottom + standardPadding)) / vItemHPad)),
                                            itemsNewWidth = resizeWidth - scrollbarWidth,
                                            movieItemANewWidth = itemsNewWidth - vThumbWidth,
                                            atContent = ((fullscreen ? viewHeight : 0) + fillerHeight - scrTop) <= 0,
                                            opacityItems = atSugEnd ? 0.33 : 1,
                                            marginTopSuggestions = autoHeights,
                                            posSuggestions = 'static',
                                            topSuggestions = 0,
                                            posAutoPlay = 'absolute',
                                            topAutoPlay = oriPosTop,
                                            posAutoRelated = 'absolute',
                                            topAutoRelated = oriPosTop + autoPHeight,
                                            marginTopSpinner = 0,
                                            topSpinner = 'auto',
                                            botSpinner = atSugEnd ? 'auto' : (viewHeight + 'px');

                                        if (atContent) {
                                            marginTopSuggestions = 0;
                                            posSuggestions = 'fixed';
                                            topSuggestions = autosBottom;
                                            posAutoPlay = 'fixed';
                                            topAutoPlay = contentTop;
                                            posAutoRelated = 'fixed';
                                            topAutoRelated = contentTop + autoPHeight;
                                            if (atSugEnd) topSpinner = contentTop + 'px';
                                        } else if (atSugEnd) topSpinner = ((contentTop + fillerHeight) - scrTop) + 'px';

                                        // just for reference, this is how to always used fixed positions, but it yields jagged movement when the video suggestions are not at the top of the screen
                                        /*
                                        if (!atContent) {
                                            marginTopSuggestions = 0;
                                            posSuggestions = 'fixed';
                                            topSuggestions = ((contentTop + fillerHeight + autoHeights) - scrTop);
                                            posAutoPlay = 'fixed';
                                            topAutoPlay = ((contentTop + fillerHeight) - scrTop);
                                            posAutoRelated = 'fixed';
                                            topAutoRelated = ((contentTop + fillerHeight + autoPHeight) - scrTop);
                                        }
                                        */

                                        // updates style for each that changes
                                        suggestions.css({ 'width': resizeWidth + 'px', 'height': maxHeight + 'px', 'margin-top': marginTopSuggestions, 'position': posSuggestions, 'top': topSuggestions + 'px' });
                                        autoPlay.css({ 'width': resizeWidth + 'px', 'position': posAutoPlay, 'top': topAutoPlay + 'px' });
                                        autoRelated.css({ 'width': resizeWidth + 'px', 'position': posAutoRelated, 'top': topAutoRelated + 'px' });
                                        spinner.css({ 'width': resizeWidth + 'px', 'margin-top': marginTopSpinner + 'px', 'top': topSpinner, 'bottom': botSpinner });
                                        // widths of items and inside of movie items must change
                                        videoItem.css({ 'opacity': opacityItems, 'width': itemsNewWidth + 'px' });
                                        plItem.css({ 'opacity': opacityItems, 'width': itemsNewWidth + 'px' });
                                        radioItem.css({ 'opacity': opacityItems, 'width': itemsNewWidth + 'px' });
                                        movieItem.css({ 'opacity': opacityItems, 'width': itemsNewWidth + 'px' });
                                        movieItemA.css({ 'width': movieItemANewWidth + 'px' });
                                    }
                                } else if (!enabledYT && !disabledYT) {
                                    // not enabled yet, enabling
                                    console.log(scriptShortName + ': enabling suggestions scrollbar...');
                                    enableSuggestionsScroll(true);
                                    enabledYT = true;
                                    window.fixDynamicSizes(true);
                                }
                            }
                        };

                        // run once for the first time
                        window.fixDynamicSizes(true);

                        // when the screen is resized also update the sidebar width
                        $(document).on('scroll', function() {
                            window.fixDynamicSizes(false);
                        });
                        $(window).on('resize', function() {
                            window.fixDynamicSizes(true);
                        });

                        // when scroll has happened and we reach a change of ending, update positions
                        suggestions.on('scroll', function() {
                            if (enabledYT && !disabledYT) {
                                let atPrevious = atSugEnd,
                                    suggestScrBottom = suggestions.scrollTop() + suggestions.innerHeight(),
                                    suggestScrHeight = suggestions[0].scrollHeight;
                                if (suggestScrBottom >= suggestScrHeight && !checkAttribute(spinner, 'hidden') && hasHeight(spinner)) atSugEnd = true;
                                else atSugEnd = false;

                                // update changes
                                if (atPrevious != atSugEnd) window.fixDynamicSizes(true);
                            }
                        });

                        // must know when miniplayer, size, and fullscreen buttons/keys are pressed
                        $(function() {
                            // button presses

                            $(miniplayerSelector).click(function() {
                                // must disable the size/position settings when going off of current page
                                extendedDisable = true;
                                window.fixDynamicSizes(true);
                            });

                            $(sizeSelector).click(function() {
                                setTimeout(function() {
                                    // don't need to update variables related to theater mode, since sizing for that is already handled
                                    window.fixDynamicSizes(true);
                                }, fastDelay);
                            });

                            $(fullscreenSelector).click(function() {
                                setTimeout(function() {
                                    let tempTitle = $(fullscreenSelector).attr('title');

                                    if (tempTitle == fullscreenEnter) fullscreen = false;
                                    else if (tempTitle == fullscreenExit) fullscreen = true;

                                    window.fixDynamicSizes(true);
                                }, fastDelay);
                            });

                            // key presses
                            $(document).on("keyup", function(e) {
                                let keyUpCode = e.which;

                                // miniplayer
                                if (keyUpCode == 73) {
                                    // must disable the size/position settings when going off of current page
                                    extendedDisable = true;
                                    window.fixDynamicSizes(true);
                                } else if (keyUpCode == 84 || keyUpCode == 70) {
                                    setTimeout(function() {
                                        // size
                                        if (keyUpCode == 70) {
                                            let tempTitle = $(fullscreenSelector).attr('title');

                                            if (tempTitle == fullscreenEnter) fullscreen = false;
                                            else if (tempTitle == fullscreenExit) fullscreen = true;
                                        }

                                        // size & fullscreen
                                        window.fixDynamicSizes(true);
                                    }, fastDelay);
                                }
                            });
                        });

                        // this must start only after the two panel view is on
                        var waitForRightHaveChildren = setInterval(function() {
                            if (rightCoIn && rightCoIn.children().length > 1) {
                                clearInterval(waitForRightHaveChildren);

                                detectHeightChange(rightContn, window.fixDynamicSizes);
                                // the chat sizing doesn't get detected for some reason, so it needs to be checked on its own
                                detectHeightChange(chat, window.fixDynamicSizes);
                            }
                        }, fastDelay);
                    }
                }, fastDelay);
            }
        }, fastDelay);
    }
}
// needed for first time run when coming from homepage
function yt_navigate_start() {
    if (firstRun && window.location.href.indexOf('youtube.com/watch?') > -1) yt_navigate_finish();
}

// needed when changing pages due to dynamic page loading
//window.addEventListener("yt-navigate-start", turnOff);
window.addEventListener("yt-navigate-start", yt_navigate_start);
window.addEventListener("yt-navigate-finish", yt_navigate_finish);

// must be executed at least once
yt_navigate_finish();