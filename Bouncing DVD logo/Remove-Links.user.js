// ==UserScript==
// @name         Bouncing DVD logo - Remove Links
// @namespace    https://thealiendrew.github.io/
// @version      1.0.1
// @description  Removes the links from the website to give it a clear view of the bounching logo.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://bouncingdvdlogo.com/
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Bouncing%20DVD%20logo/Remove-Links.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Bouncing%20DVD%20logo/Remove-Links.user.js
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAHdElNRQfkDAIJNTsyE8ajAAAEGElEQVRYw+2VTYiWVRTH/+fe+7zvzDSfMaaMk1qjVip9YRgDusiIdFESjriwDxgCaxEFhrWsqIVRRFADkS0KoVCKYMKghWHZqBholpijVtg4iSPOO68z8z7Pc+/5t5j3a2ac2tTu/d3NhXPvOZdz/udcoEaNGjX+I2TWZhosbQyrL4kwzOXoX+JUcNMsRtfsHjczjoSmg88YBQDnd/TmbNlQuHjywCEYstrdy7wOoQMGQITNs0w/9Ux7l8GhskmT4L339KHAXjjA4W5lmlTdTuJAfghI2Ynw3lYvbIlsR/djTg3gT6+i2v0bbbDhxl8WBLqBHfWqpkXqljz4AJQavbXDhqID4eJtBWGmbxTAsv7latR8ua6NMrHsog041O3F/vbi0kCXfx8ANuxrICDLB6dSBDg8S5LsQuSy6KbS85Ov6VP2og59TAJ14UckeQ7OuQxeYMqUT8OhlPk1KMQ4fE5Sn+D0VSGQ7AMFm1Do3R6cwYahdUgK+ALwPuAIDIDmqiqfYkj5HhxgsYpkwtfayMB8diUZPLdjhad69sABEZ5kSs+HYUs16EqpKbfBiXPoY6rKu/AtfeDmo/Qp3wC20ivTLhiJgKMMnuddqQYOPfRKroQF8BxVY+4CtjMlr1AT7kEG7zINPG2NANhNHwI3lR4Ah3eYBp4C0LS+n0wD90KwcIJKasKDgMUR+pR9AOZtPUGfkDvL9yEYoFde2tv/w19k7Mk3AWPxFT015dkb4LAgT1X+/Nn+H3PkJJk+VS4ABO1XNClKLZD8bi1g4PAEU3rmFsNZrGchrTry6S2V+LB4pEqm5z5YCzgBBPNG6cn7EcHh7cqJ+Pjrd5S70QEghl+dakXNDw0OehjxAGgvf7NZ7ZbDUQrF97lJAwD+6oUzvwOWfs5ud1ZERIzJYAu5E1ljRKa3ujMz7hpTHDQCVWq5z2Vs9/OlfrUiApCk6uzgYgShMh8ymWwmclHkH/983MTeJ3ESV6xWqmNMPcADQPOCzoUd8+e1tzU11GUjY6wx1xpMIH0axxPXciMjl4aH/hy+PJX4UHEgRPaeNatvX9Q+c6hdj9zQ4PHDx0YgLDkQdrz06CIAgCoAgYAWJ88Mj0665puW3NmiAgIkAJmqfu7AroHSLBBEl8gkTrxqeRbyWGsl5iv0VTrRkMaxkt1TSrKABL+6wVqLYv4FgGQzUcbZKNs8f8WGnk4RACCoVMJZK37Px4WqKrRsfOi+W+tLEUlqBMT5CW/qGhuBVCCoSEEvnDjQf7aYBAEAGwB0dt229ObO+a2N9ZiDZDw3MnTh/K9n/4gBq6x6gVgUlWkbm1qaWpubGurrM9YYQ6VPJycL+bHR/NhYPikpoSymioqNCEjFPyJGQFZ/STM/PSmuWbC4atSoUeN/42/eqprRApSVMQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMC0xMi0wMlQwOTo1Mzo0NyswMDowMMb3U/sAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMTItMDJUMDk6NTM6NDcrMDA6MDC3qutHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAABJRU5ErkJggg==
// @grant        none
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

document.querySelector('body > aside').style.display = 'none';