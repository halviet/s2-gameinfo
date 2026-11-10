import {assert, describe, expect, it} from 'vitest';
import {parseGI} from './index';

describe('parseGI', () => {
    it('reads the original root name and nested blocks in order', () => {
        const {root} = parseGI('"CustomRoot" { "First" {} Second { flag } }');
        assert(root.kind === 'block');
        expect(root.key).toBe('CustomRoot');
        expect(root.entries).toMatchObject([
            {key: 'First', kind: 'block', entries: []},
            {key: 'Second', kind: 'block', entries: [{key: 'flag', kind: 'flag'}]},
        ]);
    });

    it.each([
        ['plain', 'plain'],
        ['path/to/file', 'path/to/file'],
        ['value_*VALUE*', 'value_*VALUE*'],
        ['http://example.com', 'http://example.com'],
        ['""', ''],
        ['"42"', '42'],
        ['"true"', 'true'],
        ['42', 42],
        ['-2.5', -2.5],
        ['1e-7', 1e-7],
        ['9007199254740993', '9007199254740993'],
        ['9e999', '9e999'],
        ['true', true],
        ['false', false],
        [String.raw`"test\value"`, 'test\\value'],
        [String.raw`"test\\value"`, 'test\\value'],
        [String.raw`"\"value\""`, '"value"'],
        [String.raw`"first\nsecond\tend"`, 'first\nsecond\tend'],
    ])('reads scalar %j', (input, expected) => {
        const {root} = parseGI('test ' + input);
        assert(root.kind === 'value');
        expect(root.value).toBe(expected);
    });

    it('preserves leading, inline, before-close, and trailing comments', () => {
        const {root, trailingComments} = parseGI(
            '// header\nGameInfo {\n // above\n x value [$WIN32] /* one\n two */\n // before close\n} // after root\n // footer',
        );
        assert(root.kind === 'block');
        const child = root.entries[0];
        assert(child?.kind === 'value');
        expect(root.leadingComments).toEqual(['header']);
        expect(child.leadingComments).toEqual(['above']);
        expect(child.inlineComments).toEqual([{style: 'block', text: 'one\ntwo'}]);
        expect(root.beforeCloseComments).toEqual(['before close']);
        expect(root.inlineComments).toEqual(['after root']);
        expect(trailingComments).toEqual(['footer']);
    });

    it.each([
        ['GameInfo { fps_max /* cap */ 120 }', /Comments between a key and its value or block/],
        ['GameInfo // block\n{}', /Comments between a key and its value or block/],
        ['GameInfo { Game citadel /* platform */ [$WIN32] }', /Comments before a condition/],
        ['GameInfo { Feature {} // platform\n[$WIN32] }', /Comments before a condition/],
    ])('rejects comments between entry tokens in %j', (input, error) => {
        expect(() => parseGI(input)).toThrow(error);
    });

    it('keeps conditions on blocks', () => {
        const {root} = parseGI('GameInfo { Feature {} [$WIN32] }');
        assert(root.kind === 'block');
        expect(root.entries[0]).toMatchObject({kind: 'block', condition: '$WIN32'});
    });

    it.each(['GameInfo', 'GameInfo }', 'GameInfo // no value'])('rejects a missing root value in %j', input => {
        expect(() => parseGI(input)).toThrow(/Expected value/);
    });

    it.each([
        ['GameInfo {} GameInfo {}', /Unexpected trailing content/],
        ['GameInfo {} /* incomplete', /Unterminated block comment/],
        ['GameInfo { key "value', /Unterminated string/],
        ['GameInfo { key value [$WIN32\n}', /Expected closing '\]' for condition/],
        ['GameInfo { key value [$WIN32', /Expected closing '\]' for condition/],
        ['GameInfo {', /Expected key/],
        ['', /Expected key/],
    ])('rejects malformed input %j', (input, error) => {
        expect(() => parseGI(input)).toThrow(error);
    });

    it('reports excessive nesting before exhausting the call stack', () => {
        expect(() => parseGI('block {'.repeat(514) + '}'.repeat(514))).toThrow(/Maximum nesting depth/);
    });
});
