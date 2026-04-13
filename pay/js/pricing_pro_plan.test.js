const fs = require('fs');
const path = require('path');

// Load the script
const scriptPath = path.join(__dirname, 'pricing_pro_plan.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Extraction logic (more robust regex)
const getHrefMatch = scriptContent.match(/function getHref\s*\(([^)]*)\)\s*\{([\s\S]*?\n)\}/);
if (!getHrefMatch) {
  throw new Error('Could not find getHref function in pricing_pro_plan.js');
}

const args = getHrefMatch[1];
const body = getHrefMatch[2];

// Create a function from the source
// We provide mocks for browser globals that the function uses
const getHref = new Function(args, `
  const location = this.location;
  const decodeURI = this.decodeURI;
  const decodeURIComponent = this.decodeURIComponent;
  const Object = this.Object;
  ${body}
`);

describe('getHref', () => {
  let context;

  beforeEach(() => {
    context = {
      location: {
        search: '',
        href: 'http://localhost/'
      },
      decodeURI: decodeURI,
      decodeURIComponent: decodeURIComponent,
      Object: Object
    };
  });

  test('should return empty object when no query string is present', () => {
    context.location.search = '';
    const result = getHref.call(context);
    expect(result).toEqual({});
  });

  test('should return empty object when query string is just ?', () => {
    context.location.search = '?';
    const result = getHref.call(context);
    expect(result).toEqual({});
  });

  test('should parse single parameter', () => {
    context.location.search = '?key=value';
    const result = getHref.call(context);
    expect(result).toEqual({ key: 'value' });
  });

  test('should parse multiple parameters', () => {
    context.location.search = '?key1=value1&key2=value2';
    const result = getHref.call(context);
    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
  });

  test('should handle encoded characters', () => {
    context.location.search = '?name=John%20Doe&city=New%20York';
    const result = getHref.call(context);
    expect(result).toEqual({ name: 'John Doe', city: 'New York' });
  });

  test('should handle parameters without values', () => {
    context.location.search = '?key1=&key2';
    const result = getHref.call(context);
    expect(result).toEqual({ key1: '', key2: '' });
  });

  test('should use passed search string instead of location.search', () => {
    context.location.search = '?wrong=data';
    const result = getHref.call(context, '?correct=data');
    expect(result).toEqual({ correct: 'data' });
  });

  test('should handle empty string as override for location.search', () => {
    context.location.search = '?key=value';
    const result = getHref.call(context, '');
    expect(result).toEqual({});
  });

  test('should handle decoded URI in location.search', () => {
    context.location.search = '?planList=[{"name":"Pro"}]';
    const result = getHref.call(context);
    expect(result).toEqual({ planList: '[{"name":"Pro"}]' });
  });
});
