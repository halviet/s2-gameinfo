import {assert, describe, expect, it} from 'vitest';
import {composeGI, parseGI} from './index';

describe('composeGI', () => {
    it('separates a line comment ending in backslashes from the next active line', () => {
        const comment = '    // END OF CONFIG ' + '\\'.repeat(2);
        const unsafe = ['GameInfo', '{', comment, '    rate', '    {', '        min "98304"', '    }', '}', ''].join('\n');
        const safe = unsafe.replace(comment + '\n', comment + '\n\n');
        const document = parseGI(unsafe);
        expect(composeGI(document)).toBe(safe);
        expect(composeGI(parseGI(safe))).toBe(safe);
        expect(composeGI(document, {stripComments: true})).toBe(unsafe.replace(comment + '\n', ''));
    });

    it('also separates an inline comment ending in a backslash without breaking consecutive comment lines', () => {
        const input = ['GameInfo', '{', '    // Title \\', '    // Subtitle', '    first 1 // Note \\', '    second 2', '}', ''].join('\n');
        expect(composeGI(parseGI(input))).toBe(input.replace('\n    second 2', '\n\n    second 2'));
    });

    it('composes a new document with readable defaults', () => {
        expect(composeGI({
            root: {
                key: 'GameInfo', kind: 'block',
                entries: [
                    {key: 'name', kind: 'value', value: 'citadel'},
                    {key: 'enabled', kind: 'value', value: false, condition: '$WIN32'},
                ],
            },
        })).toBe('GameInfo\n{\n    name "citadel"\n    enabled false [$WIN32]\n}\n');
    });

    it.each([42, 1e-7, true, false, 'say "hello"\nthen\tleave\\', '001', ''])('round-trips an edited value %j', value => {
        const document = parseGI('key 0');
        assert(document.root.kind === 'value');
        document.root.value = value;
        expect(parseGI(composeGI(document)).root).toMatchObject({key: 'key', value});
    });

    it('quotes edited keys that contain spaces', () => {
        const document = parseGI('GameInfo {key"value"other 2}');
        assert(document.root.kind === 'block');
        const [first, second] = document.root.entries;
        assert(first?.kind === 'value' && second);
        first.value = 1;
        expect(composeGI(document)).toBe('GameInfo\n{\n    key 1\n    other 2\n}\n');
        second.key = 'renamed key';
        expect(composeGI(document)).toBe('GameInfo\n{\n    key 1\n    "renamed key" 2\n}\n');
    });

    it('keeps new line comments from swallowing the next entry', () => {
        const document = parseGI('GameInfo {key 1 other 2}');
        assert(document.root.kind === 'block');
        const entry = document.root.entries[0];
        assert(entry);
        entry.inlineComments = [' new comment'];
        expect(composeGI(document)).toBe('GameInfo\n{\n    key 1 // new comment\n    other 2\n}\n');
    });

    it.each([Infinity, -Infinity, NaN, 9007199254740992])('rejects an invalid edited number %j', value => {
        expect(() => composeGI({root: {key: 'key', kind: 'value', value}})).toThrow(/finite number or a safe integer/);
    });

    it.each(['$WIN32] extra 1', '$WIN32\n', '$WIN32}'])('rejects unsafe conditional text %j', condition => {
        expect(() => composeGI({root: {key: 'key', kind: 'value', value: 1, condition}})).toThrow(/Invalid conditional/);
    });

    it('prefixes each line of edited line comments and rejects block delimiter injection', () => {
        const document = parseGI('key value // comment');
        document.root.inlineComments = ['one\n\ninjected 1'];
        expect(composeGI(document)).toBe('key "value" // one\n//\n// injected 1\n');
        document.root.inlineComments = [{style: 'block', text: 'one */ injected 1'}];
        expect(() => composeGI(document)).toThrow(/closing delimiter/);
    });
});
