import {describe, it, expect} from 'vitest'
import {parseKeyValues} from "./parser";
import {readFileSync} from 'fs'
import {dirname, resolve} from 'path'
import {fileURLToPath} from 'url'

const dir = dirname(fileURLToPath(import.meta.url))
const gameinfoSimple = resolve(dir, '../gameinfo-example/gameinfo-simple.gi')

describe('parseKeyValues', () => {
    it('gameinfo-simple', () => {
        const content = readFileSync(gameinfoSimple, 'utf-8')
        expect(parseKeyValues(content, {})).toStrictEqual(expected)
    })
})

const expected = {
    test_string: "string",
    test_number: 20,
    test_float: 3.0,
    test_bool: 1,

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
