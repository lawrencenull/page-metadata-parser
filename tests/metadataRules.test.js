// Tests for parse.js
const {assert} = require('chai');
const {buildRuleset, metadataRules} = require('../parser');
const {stringToDom, makeUrlAbsolute, parseUrl} = require('./test-utils');

function buildHTML(tag) {
  return `
    <html>
      <head>
        ${tag}
      </head>
    </html>
  `;
}

function ruleTest(testName, testRule, expected, testTag) {
  it(`finds ${testName}`, () => {
    const html = buildHTML(testTag);
    const doc = stringToDom(html);
    const rule = buildRuleset(testName, testRule.rules, testRule.processors);
    const found = rule(doc, {
      url: 'http://www.example.com/',
      makeUrlAbsolute,
      parseUrl,
    });
    assert.deepEqual(found, expected, `Unable to find ${testName} in ${html}`);
  });
}


describe('Title Rule Tests', function() {
  const pageTitle = 'Page Title';

  const ruleTests = [
    ['og:title', `<meta property="og:title" content="${pageTitle}" />`],
    ['twitter:title', `<meta name="twitter:title" content="${pageTitle}" />`],
    ['twitter:title', `<meta property="twitter:title" content="${pageTitle}" />`],
    ['hdl', `<meta name="hdl" content="${pageTitle}" />`],
    ['title', `<title>${pageTitle}</title>`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.title, pageTitle, testTag));
});


describe('Canonical URL Rule Tests', function() {
  const pageUrl = 'http://www.example.com/page.html';
  const relativeUrl = '/page.html';

  const ruleTests = [
    ['og:url', `<meta property="og:url" content="${pageUrl}" />`],
    ['rel=canonical', `<link rel="canonical" href="${pageUrl}" />`],
    ['relative canonical', `<link rel="canonical" href="${relativeUrl}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.url, pageUrl, testTag));
});


describe('Icon Rule Tests', function() {
  const pageIcon = 'http://www.example.com/favicon.ico';
  const relativeIcon = '/favicon.ico';

  const ruleTests = [
    ['apple-touch-icon', `<link rel="apple-touch-icon" href="${pageIcon}" />`],
    ['apple-touch-icon-precomposed', `<link rel="apple-touch-icon-precomposed" href="${pageIcon}" />`],
    ['icon', `<link rel="icon" href="${pageIcon}" />`],
    ['fluid-icon', `<link rel="fluid-icon" href="${pageIcon}" />`],
    ['shortcut icon', `<link rel="shortcut icon" href="${pageIcon}" />`],
    ['Shortcut Icon', `<link rel="Shortcut Icon" href="${pageIcon}" />`],
    ['mask-icon', `<link rel="mask-icon" href="${pageIcon}" />`],
    ['relative icon', `<link rel="icon" href="${relativeIcon}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.icon_url, pageIcon, testTag));

  it('prefers higher resolution icons', () => {
    const html = `
      <html>
        <head>
          <link rel="icon" href="small.png" sizes="16x16">
          <link rel="icon" href="large.png" sizes="32x32">
          <link rel="icon" href="any.png" sizes="any">
        </head>
      </html>
    `;
    const doc = stringToDom(html);
    const rule = buildRuleset('Largest Icon', metadataRules.icon_url.rules, metadataRules.icon_url.processors, metadataRules.icon_url.scorers);
    const found = rule(doc, {
      url: 'http://www.example.com/',
      makeUrlAbsolute,
      parseUrl,
    });
    assert.deepEqual(found, 'http://www.example.com/large.png', 'icon_rules did not prefer the largest icon');
  });
});


describe('Image Rule Tests', function() {
  const pageImage = 'http://www.example.com/image.png';
  const relativeImage = '/image.png';

  const ruleTests = [
    ['og:image', `<meta property="og:image" content="${pageImage}" />`],
    ['og:image:url', `<meta property="og:image:url" content="${pageImage}" /> `],
    ['og:image:secure_url', `<meta property="og:image:secure_url" content="${pageImage}" /> `],
    ['twitter:image', `<meta name="twitter:image" content="${pageImage}" />`],
    ['twitter:image', `<meta property="twitter:image" content="${pageImage}" />`],
    ['thumbnail', `<meta name="thumbnail" content="${pageImage}" />`],
    ['relative image', `<meta name="thumbnail" content="${relativeImage}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.image_url, pageImage, testTag));
});


describe('Description Rule Tests', function() {
  const pageDescription = 'Example page description.';

  const ruleTests = [
    ['og:description', `<meta property="og:description" content="${pageDescription}" />`],
    ['description', `<meta name="description" content="${pageDescription}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.description, pageDescription, testTag));
});


describe('Type Rule Tests', function() {
  const pageType = 'article';

  const ruleTests = [
    ['og:type', `<meta property="og:type" content="${pageType}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.type, pageType, testTag));
});


describe('Keywords Rule Tests', function() {
  const keywords = ['Cats', 'Kitties', 'Meow'];

  const ruleTests = [
    ['keywords', `<meta name="keywords" content="${keywords.join(', ')}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.keywords, keywords, testTag));
});

describe('Provider Rule Tests', function() {
  const provider = 'Example provider';

  const ruleTests = [
    ['og:type', `<meta property="og:site_name" content="${provider}" />`],
  ];

  ruleTests.map(([testName, testTag]) => ruleTest(testName, metadataRules.provider, provider, testTag));
});
