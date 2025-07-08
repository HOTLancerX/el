import * as cheerio from 'cheerio';
import { safeGet, resolveUrl } from '../route'; // Adjust path as needed if file structure changes

describe('API Helper Functions', () => {
  describe('safeGet', () => {
    const html = `
      <div>
        <h1>Main Title</h1>
        <p class="description">This is a description.</p>
        <img src="/image.jpg" alt="Test Image" />
        <a href="/page.html" id="link1">Link 1</a>
        <span data-custom="customValue"></span>
      </div>
    `;
    const $ = cheerio.load(html);
    const el = $('div').first();

    test('should get text content from an element', () => {
      expect(safeGet(el, 'h1', 'text')).toBe('Main Title');
    });

    test('should get an attribute from an element', () => {
      expect(safeGet(el, 'img', 'attr', 'alt')).toBe('Test Image');
    });

    test('should return empty string if element or selector not found', () => {
      expect(safeGet(el, '.nonexistent', 'text')).toBe('');
      expect(safeGet(el, 'img', 'attr', 'nonexistent-attr')).toBe('');
    });

    test('should return empty string if el is undefined', () => {
      expect(safeGet(undefined, 'h1', 'text')).toBe('');
    });

    test('should handle selectors that directly target the element passed', () => {
      const h1El = $('h1').first();
      expect(safeGet(h1El, '', 'text')).toBe('Main Title'); // No further selector
    });
  });

  describe('resolveUrl', () => {
    const baseUrl = 'https://example.com';

    test('should resolve a relative path', () => {
      expect(resolveUrl(baseUrl, '/path/to/page')).toBe('https://example.com/path/to/page');
    });

    test('should resolve a relative path starting with a segment', () => {
      expect(resolveUrl(baseUrl + '/blog', 'article1')).toBe('https://example.com/blog/article1');
    });

    test('should return absolute URL as is', () => {
      expect(resolveUrl(baseUrl, 'https://otherdomain.com/page')).toBe('https://otherdomain.com/page');
    });

    test('should return undefined if relativeUrl is undefined', () => {
      expect(resolveUrl(baseUrl, undefined)).toBeUndefined();
    });

    test('should handle base URL with trailing slash correctly', () => {
        expect(resolveUrl(baseUrl + '/', '/path')).toBe('https://example.com/path');
        expect(resolveUrl(baseUrl + '/', 'path')).toBe('https://example.com/path');
    });

    test('should handle schemaless URLs (treat as relative)', () => {
      expect(resolveUrl(baseUrl, '//anotherdomain.com/image.png')).toBe('https://anotherdomain.com/image.png');
    });
  });

  // Conceptual test for buildRssXml (would require more setup)
  // describe('buildRssXml', () => {
  //   test('should generate valid RSS XML structure', () => {
  //     const items = [
  //       { title: 'Test Item 1', link: 'https://example.com/item1', fullDescription: 'Desc 1', pubDate: new Date().toISOString(), image: 'https://example.com/img1.jpg', category: 'Test' },
  //       { title: 'Test Item 2', link: 'https://example.com/item2', fullDescription: 'Desc 2', pubDate: new Date().toISOString() },
  //     ];
  //     const xmlOutput = buildRssXml('Test Feed', 'https://example.com', 'A test feed', items, 'https://example.com/feed.xml');
  //     expect(xmlOutput).toContain('<rss version="2.0">');
  //     expect(xmlOutput).toContain('<channel>');
  //     expect(xmlOutput).toContain('<title>Test Feed</title>');
  //     expect(xmlOutput).toContain('<link>https://example.com</link>');
  //     expect(xmlOutput).toContain('<atom:link href="https://example.com/feed.xml"');
  //     expect(xmlOutput).toContain('<item>');
  //     expect(xmlOutput).toContain('<title>Test Item 1</title>');
  //     expect(xmlOutput).toContain('<guid isPermaLink="true">https://example.com/item1</guid>');
  //     expect(xmlOutput).toContain('<enclosure url="https://example.com/img1.jpg"');
  //     expect(xmlOutput).toContain('<category>Test</category>');
  //     // More assertions for structure and content
  //   });
  // });
});
