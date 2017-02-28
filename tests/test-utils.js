if (global.DOMParser !== undefined) {
  // We're in Firefox
  module.exports = {
    makeUrlAbsolute(base, relative) {
      return new URL(relative, base).href;
    },
    parseUrl(url) {
      return new URL(url).host;
    },
    stringToDom(str) {
      const parser = new DOMParser();
      return parser.parseFromString(str, 'text/html');
    }
  };
} else {
  // We're in Node.js
  const domino = require('domino');
  const urlparse = require('url');
  module.exports = {
    makeUrlAbsolute(base, relative) {
      const relativeParsed = urlparse.parse(relative);

      if (relativeParsed.host === null) {
        return urlparse.resolve(base, relative);
      }

      return relative;
    },
    parseUrl(url) {
      return urlparse.parse(url).hostname;
    },
    stringToDom(str) {
      return domino.createWindow(str).document;
    }
  };
}

