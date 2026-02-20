import {describe, it, expect} from 'vitest'
import {parseKeyValues} from "./parser";
import {readFileSync} from 'fs'
import {KVValue} from "./types";

const gameinfoSimple = './gameinfo-example/gameinfo-simple.gi'

describe('parseKeyValues', () => {
    it('single block', () => {
        const gi = kvBlock("GameInfo", kvBlock("Test", ""));
        expect(parseKeyValues(gi)).toStrictEqual({Test: {}});
    });

    it('multiple blocks', () => {
        const gi = kvBlock("GameInfo", kvBlock("Test1", ""), kvBlock("Test2"));
        expect(parseKeyValues(gi)).toStrictEqual({Test1: {}, Test2: {}});
    });

    it('quoted key', () => {
        const gi = kvBlock("GameInfo", kvPair('"test"', 1));
        expect(parseKeyValues(gi)).toStrictEqual({test: 1})
    });

    it('unquoted key', () => {
        const gi = kvBlock("GameInfo", kvPair("test", 1));
        expect(parseKeyValues(gi)).toStrictEqual({test: 1})
    });

    it('string value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", "value"));
        expect(parseKeyValues(gi)).toStrictEqual({test: "value"})
    });

    it('number value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", 10));
        expect(parseKeyValues(gi)).toStrictEqual({test: 10})
    });

    it('condition value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", '"value" [ $COND ]'));
        expect(parseKeyValues(gi, {parseConditionals: true})).toStrictEqual({test: ["value", " $COND "]})
    });

    it('do not parse condition value', () => {
        const gi = kvBlock("GameInfo", kvPair("test", '"value" [ $COND ]'));
        expect(parseKeyValues(gi, {parseConditionals: false})).toStrictEqual({test: "value"})
    });

    it('with comment', () => {
        const gi = kvBlock("GameInfo", kvPair("test", "value // Test comment"));
        expect(parseKeyValues(gi, {parseConditionals: false})).toStrictEqual({test: "value"})
    });

    it('gameinfo-simple', () => {
        const expected = {
            test_string: "string",
            test_number: 20,
            test_float: 3.0,
            test_bool: 1,
            test_conditional: ["1", " $LINUX || !$OSX "],

            string_keys: {
                string_key1: 20,
                string_key2: 1,
                string_key3: 3.0,
            },
            string_keys_and_values: {
                string_key1: "1",
                string_key2: "string",
                string_key3: "3.0",
                string_key4: "true",
            },
            unquoted_string_value: {
                "key1": "value1",
                "key2": "value2",
            },

            object_with_children: {
                children: {
                    key: "value",
                },
                parent: {
                    children: {
                        key: "value",
                    }
                }
            },

            empty_object: {},

            string_with_slash: "path/to/file"
        }

        const content = readFileSync(gameinfoSimple, 'utf-8')
        expect(parseKeyValues(content, {parseConditionals: true})).toStrictEqual(expected)
    });
})

function kvBlock(key: string, ...content: string[]): string {
    let block = `${key}\n{\n`;

    content.forEach((v) => {
        block += `${v}\n`;
    });
    block += "}";

    return block;
}

function kvPair(key: string, value: KVValue): string {
    return `${key}\t${value}`;
}
