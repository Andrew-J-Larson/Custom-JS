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
