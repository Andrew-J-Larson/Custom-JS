// ==UserScript==
// @name         PSU - DARS Clarified Credits Earned
// @namespace    https://andrew-larson.dev/
// @version      1.1.5
// @description  This will show the total number of credits earned, and how much of the earned credits were taken from PSU or external sources, along with showing the total amount from external sources (which may not have been transferred).
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://app.banner.pdx.edu/uachieve_selfservice/audit/read.html*
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/PSU%20Degree%20Audit%20Reporting%20System/DARS-Clarified-Credits-Earned.user.js
// @grant        none
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (andrew.j.larson18+github@gmail.com)
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

let allCourseElementsWithDuplicatesAndZeroCreditAndInProgress = document.querySelectorAll('.takenCourse');
let allCoursesWithDuplicatesAndZeroCreditAndInProgress = [];
let allCoursesAndZeroCreditAndInProgress = [];
let allCoursesAndInProgress = [];
let finishedCourses = [];
let total = { all: { courses: 0, credits: 0 }, uni: { courses: 0, credits: 0 }, precedesTransferGrade: { courses: 0, credits: 0 }, noTransferGradeUsed: { courses: 0, credits: 0 }, transferred: { courses: 0, credits: 0 } };

/* A course object
 *
 * term
 * course
 * credit
 * grade
 * conditionCode (ccode)
 * description
 */

// change all elements to array of course objects with important information
for (let i = 0; i < allCourseElementsWithDuplicatesAndZeroCreditAndInProgress.length; i++) {
    let course = { term: '', course: '', credit: 0, grade: '', conditionCode: '', description: '' };

    let courseElement = allCourseElementsWithDuplicatesAndZeroCreditAndInProgress[i];

    // convert data
    for (let j = 0; j < courseElement.childElementCount; j++) {
        let courseDataElement = courseElement.children[j];
        let courseAriaLabel = courseDataElement.ariaLabel;
        let courseDataText = '';

        // description needs to be handled differently
        if (courseAriaLabel == 'description') {
            let descLines = courseDataElement.querySelectorAll('.descLine');
            let desc = '';

            // use newlines between each new line element
            for (let k = 0; k < descLines.length; k++) {
                let descLine = descLines[k].innerText.trim().replace(/\s\s+/g, ' ');

                if (desc.length > 0) desc += '\n' + descLine;
                else desc = descLine;
            }

            course.description = desc;
        } else {
            courseDataText = courseDataElement.innerText.trim().replace(/\s\s+/g, ' ');

            switch (courseAriaLabel) {
                case 'term': course.term = courseDataText; break;
                case 'course': course.course = courseDataText; break;
                case 'credit': course.credit = parseInt(courseDataText); break;
                case 'grade': course.grade = courseDataText; break;
                case 'condition code': course.conditionCode = courseDataText; break;
            }
        }
    }

    allCoursesWithDuplicatesAndZeroCreditAndInProgress.push(course);
}

// remove all duplicates
for (let i = 0; i < allCoursesWithDuplicatesAndZeroCreditAndInProgress.length; i++) {
    let checkingCourse = allCoursesWithDuplicatesAndZeroCreditAndInProgress[i];

    let alreadyExists = false;
    for (let j = 0; j < allCoursesAndZeroCreditAndInProgress.length; j++) {
        let doNotDuplicateCourse = allCoursesAndZeroCreditAndInProgress[j];

        if ((doNotDuplicateCourse.description == checkingCourse.description) && (doNotDuplicateCourse.term == checkingCourse.term)) alreadyExists = true;
    }

    if (!alreadyExists) allCoursesAndZeroCreditAndInProgress.push(checkingCourse);
}

// remove all zero-credit courses
for (let i = 0; i < allCoursesAndZeroCreditAndInProgress.length; i++) {
    let checkingCourse = allCoursesAndZeroCreditAndInProgress[i];

    if (checkingCourse.credit > 0) allCoursesAndInProgress.push(checkingCourse);
}

// remove all in-progress courses
for (let i = 0; i < allCoursesAndInProgress.length; i++) {
    let checkingCourse = allCoursesAndInProgress[i];

    if (checkingCourse.grade != 'RE') finishedCourses.push(checkingCourse);
}

// count the credits to the correct categories
for (let i = 0; i < finishedCourses.length; i++) {
    let checkingCourse = finishedCourses[i];
    let courseCredit = checkingCourse.credit;

    total.all.courses++;
    total.all.credits += courseCredit;
    if (checkingCourse.grade == '--') {
        total.noTransferGradeUsed.courses++;
        total.noTransferGradeUsed.credits += courseCredit;
        total.transferred.courses++;
        total.transferred.credits += courseCredit;
    } else if (checkingCourse.grade.includes('T')) {
        total.precedesTransferGrade.courses++;
        total.precedesTransferGrade.credits += courseCredit;
        total.transferred.courses++;
        total.transferred.credits += courseCredit;
    } else {
        total.uni.courses++;
        total.uni.credits += courseCredit;
    }
}

// display results (which accounts for darkreader)
let colorStyleLight = 'color: rgb(255, 255, 255); background-color: rgba(0, 0, 0, 0.667)'
let colorStyleDark = 'color: rgb(0, 0, 0) !important; background-color: rgba(255, 255, 255, 0.667) !important'
let childColorStyleLight = 'color: rgb(255, 255, 255); background-color: transparent !important'
let childColorStyleDark = 'color: rgb(0, 0, 0) !important; background-color: transparent !important'
let divStyleBase = 'display: inline-block; padding: 10px; border-radius: 10px; position: fixed; right: 10px; top: 50%; transform: translateY(-50%); ';
let divStyleLight = divStyleBase + colorStyleLight;
let divStyleDark = divStyleBase + colorStyleDark;
let pStyleBase = 'margin: 0px !important; font-size: 10pt; ';
let pStyleLight = pStyleBase + childColorStyleLight;
let pStyleDark = pStyleBase + childColorStyleDark;
let pStartLight = '<p style="' + pStyleLight + '">';
let pStartDark = '<p style="' + pStyleDark + '">';
let pEnd = '</p>';
let titleStyleBase = 'font-size: 125%; font-weight: bold; text-decoration: underline; ';
let titleStyleLight = titleStyleBase + childColorStyleLight;
let titleStyleDark = titleStyleBase + childColorStyleDark;
let titleStartLight = '<span style="' + titleStyleLight + '">';
let titleStartDark = '<span style="' + titleStyleDark + '">';
let titleEnd = '</span>';
let contentStartLight = '<i style="' + childColorStyleLight + '">';
let contentStartDark = '<i style="' + childColorStyleDark + '">';
let contentEnd = '</i>';
let newline = '<br>';
let divInnerHTML = pStartLight + titleStartLight + 'Transferred' + titleEnd + newline + contentStartLight + total.transferred.credits + ' credits (from ' + total.transferred.courses + ' courses)' + contentEnd + pEnd + newline +
    pStartLight + titleStartLight + 'No Transfer Grade Used (--)' + titleEnd + newline + contentStartLight + total.noTransferGradeUsed.credits + ' credits (from ' + total.noTransferGradeUsed.courses + ' courses)' + contentEnd + pEnd +
    pStartLight + titleStartLight + 'Precedes Transfer Grade (T)' + titleEnd + newline + contentStartLight + total.precedesTransferGrade.credits + ' credits (from ' + total.precedesTransferGrade.courses + ' courses)' + contentEnd + pEnd +
    pStartLight + titleStartLight + 'Earned at PSU' + titleEnd + newline + contentStartLight + total.uni.credits + ' credits (from ' + total.uni.courses + ' courses)' + contentEnd + pEnd + newline +
    pStartLight + titleStartLight + 'Total (excluding \'--\')' + titleEnd + newline + contentStartLight + (total.all.credits - total.noTransferGradeUsed.credits) + ' credits (from ' + (total.all.courses - total.noTransferGradeUsed.courses) + ' courses)' + contentEnd + pEnd + newline +
    pStartLight + titleStartLight + 'Total' + titleEnd + newline + contentStartLight + total.all.credits + ' credits (from ' + total.all.courses + ' courses)' + contentEnd + pEnd;
let clarifiedCreditsEarned = document.createElement('div');
clarifiedCreditsEarned.style = divStyleLight;
clarifiedCreditsEarned.innerHTML = divInnerHTML;
document.body.appendChild(clarifiedCreditsEarned);

// this fixes issues with darkreader
setInterval(function () {
    let hadDarkreaderOn = document.head.querySelector('.darkreader');
    let cssText = clarifiedCreditsEarned.style.cssText;

    let needsToChangeToDark = hadDarkreaderOn && cssText.startsWith(divStyleLight),
        needsToChangeToLight = !hadDarkreaderOn && cssText.startsWith(divStyleDark);

    if (needsToChangeToDark || needsToChangeToLight) {
        clarifiedCreditsEarned.style.cssText = needsToChangeToDark ? divStyleDark : divStyleLight;

        let allP = clarifiedCreditsEarned.querySelectorAll('p');
        for (let i = 0; i < allP.length; i++) {
            let p = allP[i];

            p.style.cssText = needsToChangeToDark ? pStyleDark : pStyleLight;

            let allSpan = p.querySelectorAll('span');
            for (let j = 0; j < allSpan.length; j++) {
                allSpan[j].style.cssText = needsToChangeToDark ? titleStyleDark : titleStyleLight;
            }

            let allI = p.querySelectorAll('i');
            for (let j = 0; j < allI.length; j++) {
                allI[j].style.cssText = needsToChangeToDark ? childColorStyleDark : childColorStyleLight;
            }
        }
    }
}, 100);