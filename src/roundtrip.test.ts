import {assert, describe, expect, it} from 'vitest';
import {composeGI, parseGI} from './index';

const source = [
    '// File header',
    'GameInfo',
    '{',
    '    // Camera settings',
    '    // Keep this preset gentle.',
    '    wobble 0 // default',
    '    // Before the closing brace',
    '} // root inline',
    '// File footer',
    '',
].join('\r\n');

describe('document round trips', () => {
    it('normalizes spacing and preserves an empty comment inside a comment group', () => {
        const input = '\nGameInfo\t{\n\n\t//Fps limit  \n    //   \n \t//   Set to 0 for unlimited\n\n fps_max\t 60\t//default  \n}\n\n';
        const document = parseGI(input);
        assert(document.root.kind === 'block');
        expect(document.root.entries[0]).toEqual({
            kind: 'value',
            key: 'fps_max',
            value: 60,
            leadingComments: [null, 'Fps limit', '', 'Set to 0 for unlimited', null],
            inlineComments: ['default'],
        });
        expect(composeGI(document)).toBe([
            'GameInfo',
            '{',
            '',
            '    // Fps limit',
            '    //',
            '    // Set to 0 for unlimited',
            '',
            '    fps_max 60 // default',
            '}',
            '',
        ].join('\n'));
        expect(composeGI(document, {stripComments: true})).toBe('GameInfo\n{\n\n    fps_max 60\n}\n');
    });

    it('keeps blank-line separators throughout a document and collapses excess blank lines', () => {
        const input = '\r\n\r\n// Header\r\n\t\r\n\r\nGameInfo\r\n\r\n{\r\n    first 1\r\n\r\n\r\n    second 2\r\n\r\n}\r\n\r\n// Footer\r\n\r\n';
        const expected = '// Header\n\nGameInfo\n{\n    first 1\n\n    second 2\n\n}\n\n// Footer\n';
        expect(composeGI(parseGI(input))).toBe(expected);
        expect(composeGI(parseGI(expected))).toBe(expected);
    });

    it('retains comments and normalizes line endings after a JSON round trip', () => {
        const document = JSON.parse(JSON.stringify(parseGI(source)));
        expect(composeGI(document)).toBe(source.replaceAll('\r\n', '\n'));
    });

    it('reads and edits leading and inline comments without moving nearby comments', () => {
        const document = parseGI(source);
        assert(document.root.kind === 'block');
        const entry = document.root.entries[0];
        assert(entry?.kind === 'value');

        expect(entry.leadingComments).toEqual(['Camera settings', 'Keep this preset gentle.']);
        expect(entry.inlineComments).toEqual(['default']);

        entry.leadingComments![0] = ' Camera controls';
        entry.inlineComments![0] = ' overridden';
        entry.value = 1;

        expect(composeGI(document)).toBe(source
            .replaceAll('\r\n', '\n')
            .replace('Camera settings', 'Camera controls')
            .replace('wobble 0 // default', 'wobble 1 // overridden'));
    });

    it('strips comments at every depth and keeps comment-like strings', () => {
        const document = parseGI([
            '// header',
            'GameInfo {',
            '    Nested {',
            '        /* above */ url "https://example.com/*asset*/" // after value',
            '    } // after block',
            '    /* before close */',
            '} // root inline',
            '// footer',
        ].join('\n'));
        const stripped = composeGI(document, {stripComments: true});

        expect(stripped).not.toMatch(/header|above|after value|after block|before close|root inline|footer/);
        expect(stripped).toContain('"https://example.com/*asset*/"');
        expect(composeGI(parseGI(stripped))).toBe(stripped);
        expect(composeGI(document)).toContain('// header');
    });

    it('keeps repeated keys interleaved with their own conditions and comments', () => {
        const input = 'GameInfo {\n Game citadel [$WIN32] // first\n Mod citadel\n Game core // second\n}';
        const document = parseGI(input);
        assert(document.root.kind === 'block');
        const [first, mod, second] = document.root.entries;
        assert(first?.kind === 'value' && second?.kind === 'value');
        expect([first.key, mod?.key, second.key]).toEqual(['Game', 'Mod', 'Game']);
        expect(first.condition).toBe('$WIN32');
        expect(second.inlineComments).toEqual(['second']);
        expect(parseGI(composeGI(document))).toEqual(document);
    });

    it.each([
        '\uFEFF"GameInfo" { "value" 001 other 9007199254740993 }\r\n',
        'GameInfo { item { __type duplicate values first values second extra keep } }',
        'GameInfo { constructor ctor __proto__ first __proto__ second toString text }',
        'GameInfo { value true other 1e-7 leading -0.00 }',
        'GameInfo { key "C:\\files\\test"[$WIN32\t] }',
        'GameInfo { flag }',
        'name "value" /* footer */',
    ])('preserves values and order while normalizing %j', input => {
        const document = parseGI(input);
        const composed = composeGI(JSON.parse(JSON.stringify(document)));
        expect(parseGI(composed)).toEqual(document);
        expect(composeGI(parseGI(composed))).toBe(composed);
    });

    it('keeps an unsafe integer unquoted without rounding it', () => {
        expect(composeGI(parseGI('id 9007199254740993'))).toBe('id 9007199254740993\n');
    });

    it('normalizes multiline block comments without changing their contents on each pass', () => {
        const document = parseGI('GameInfo {\n   /* one\n      two */\nkey 1 /* inline\n      block */\n}');
        expect(parseGI(composeGI(document))).toEqual(document);
    });
});
