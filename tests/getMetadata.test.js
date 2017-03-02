// Tests for parse.js
const {assert} = require('chai');
const {getProvider, getMetadata, metadataRules} = require('../parser');
const {stringToDom, makeUrlAbsolute, parseUrl} = require('./test-utils');

describe('Get Provider Tests', function() {
  it('gets a provider with no subdomain', function() {
    assert.equal(getProvider(parseUrl('https://example.com/this/?id=that')), 'example');
  });

  it('removes www as a subdomain', function() {
    assert.equal(getProvider(parseUrl('https://www.example.com/this/?id=that')), 'example');
  });

  it('removes www1 as a subdomain', function() {
    assert.equal(getProvider(parseUrl('https://www1.example.com/this/?id=that')), 'example');
  });

  it('preserves non-www subdomains', function() {
    assert.equal(getProvider(parseUrl('https://things.example.com/this/?id=that')), 'things example');
  });

  it('removes secondary TLDs', function() {
    assert.equal(getProvider(parseUrl('https://things.example.co.uk/this/?id=that')), 'things example');
  });
});

describe('Get Metadata Tests', function() {
  const sampleDescription = 'A test page.';
  const sampleIcon = 'http://www.example.com/favicon.ico';
  const sampleImageHTTP = 'http://www.example.com/image.png';
  const sampleImageHTTPS = 'https://www.example.com/secure_image.png';
  const sampleTitle = 'Page Title';
  const sampleType = 'article';
  const sampleUrl = 'http://www.example.com/';
  const sampleProviderName = 'Example Provider';

  const sampleHtml = `
    <html>
    <head>
      <meta property="og:description" content="${sampleDescription}" />
      <link rel="icon" href="${sampleIcon}" />
      <meta property="og:image" content="${sampleImageHTTP}" />
      <meta property="og:image:url" content="${sampleImageHTTP}" />
      <meta property="og:image:secure_url" content="${sampleImageHTTPS}" />
      <meta property="og:title" content="${sampleTitle}" />
      <meta property="og:type" content="${sampleType}" />
      <meta property="og:url" content="${sampleUrl}" />
      <meta property="og:site_name" content="${sampleProviderName}" />
    </head>
    </html>
  `;

  it('parses metadata', () => {
    const doc = stringToDom(sampleHtml);
    const metadata = getMetadata(doc, sampleUrl, metadataRules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.description, sampleDescription, `Unable to find ${sampleDescription} in ${sampleHtml}`);
    assert.equal(metadata.icon_url, sampleIcon, `Unable to find ${sampleIcon} in ${sampleHtml}`);
    assert.equal(metadata.image_url, sampleImageHTTPS, `Unable to find ${sampleImageHTTPS} in ${sampleHtml}`);
    assert.equal(metadata.title, sampleTitle, `Unable to find ${sampleTitle} in ${sampleHtml}`);
    assert.equal(metadata.type, sampleType, `Unable to find ${sampleType} in ${sampleHtml}`);
    assert.equal(metadata.url, sampleUrl, `Unable to find ${sampleUrl} in ${sampleHtml}`);
    assert.equal(metadata.provider, sampleProviderName, `Unable to find ${sampleProviderName} in ${sampleHtml}`);
  });

  it('uses absolute URLs when url parameter passed in', () => {
    const relativeHtml = `
      <html>
      <head>
        <meta property="og:description" content="${sampleDescription}" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image" content="/image.png" />
        <meta property="og:title" content="${sampleTitle}" />
        <meta property="og:type" content="${sampleType}" />
        <meta property="og:url" content="${sampleUrl}" />
      </head>
      </html>
    `;

    const doc = stringToDom(relativeHtml);
    const metadata = getMetadata(doc, sampleUrl, metadataRules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.icon_url, sampleIcon, `Unable to find ${sampleIcon} in ${relativeHtml}`);
    assert.equal(metadata.image_url, sampleImageHTTP, `Unable to find ${sampleImageHTTP} in ${relativeHtml}`);
  });

  it('adds a provider when URL passed in', () => {
      const emptyHtml = `
        <html>
        <head>
        </head>
        </html>
    `;

    const sampleProvider = 'example';
    const doc = stringToDom(emptyHtml);
    const metadata = getMetadata(doc, sampleUrl, metadataRules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.provider, sampleProvider, `Unable to find ${sampleProvider} in ${sampleUrl}`);
  });

  it('prefers open graph site name over URL based provider', () => {
      const sampleProvider = 'OpenGraph Site Name';
      const providerHtml = `
        <html>
        <head>
          <meta property="og:site_name" content="${sampleProvider}" />
        </head>
        </html>
    `;

    const doc = stringToDom(providerHtml);
    const metadata = getMetadata(doc, sampleUrl, metadataRules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.provider, sampleProvider, `Unable to find ${sampleProvider} in ${providerHtml}`);
  });

  it('uses default favicon when no favicon is found', () => {
    const noIconHtml = `
      <html>
      <head>
      </head>
      </html>
    `;

    const doc = stringToDom(noIconHtml);
    const metadata = getMetadata(doc, sampleUrl, metadataRules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.icon_url, sampleIcon, `Unable to find ${sampleIcon} in ${metadata.icon_url}`);
  });
  it('falls back on provided url when no canonical url found', () => {
    const html = `
      <html>
      <head>
      </head>
      </html>
    `;

    const doc = stringToDom(html);
    const metadata = getMetadata(doc, sampleUrl, metadataRules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.url, sampleUrl, `Unable to find ${sampleUrl} in ${JSON.stringify(metadata)}`);
  });

  it('allows custom rules', () => {
    const doc = stringToDom(sampleHtml);
    const rules = {
      title: metadataRules.title,
      description: metadataRules.description
    };

    const metadata = getMetadata(doc, sampleUrl, rules, makeUrlAbsolute, parseUrl);

    assert.equal(metadata.url, sampleUrl, 'Error finding URL');
    assert.equal(metadata.title, sampleTitle, 'Error finding title');
    assert.equal(metadata.description, sampleDescription, 'Error finding description');
  });

  it('allows to create groups of rules', () => {
    const doc = stringToDom(sampleHtml);
    const rules = {
      openGraph: {
        title: metadataRules.title,
        description: metadataRules.description,
        type: metadataRules.type,
        url: metadataRules.url
      },
      media: {
        icon: metadataRules.icon_url,
        image: metadataRules.image_url
      }
    };

    const metadata = getMetadata(doc, sampleUrl, rules, makeUrlAbsolute, parseUrl);
    assert.isObject(metadata.openGraph);
    assert.isObject(metadata.media);

    assert.equal(metadata.openGraph.title, sampleTitle, 'Error finding title');
    assert.equal(metadata.openGraph.description, sampleDescription, 'Error finding description');
    assert.equal(metadata.openGraph.type, sampleType, 'Error finding type');
    assert.equal(metadata.openGraph.url, sampleUrl, 'Error finding url');

    assert.equal(metadata.media.icon, sampleIcon, 'Error finding icon');
    assert.equal(metadata.media.image, sampleImageHTTPS, 'Error finding image');
  });

});
