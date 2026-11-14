# s2-gameinfo

[![npm version](https://img.shields.io/npm/v/s2-gameinfo.svg)](https://www.npmjs.com/package/s2-gameinfo)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Parse and compose Valve Source 2 `gameinfo.gi` files with TypeScript

A lightweight, zero-dependency library for handling Valve's KeyValues (`gameinfo.gi`) format used in Source 2 engine games.

## Installation

```bash
npm install s2-gameinfo
```

## Quick Start

```ts
import { parseGI, composeGI, findGIValueEntry } from 's2-gameinfo';
import { readFileSync, writeFileSync } from 'node:fs';

const content = readFileSync('gameinfo.gi', 'utf-8');
const document = parseGI(content);

const fps = findGIValueEntry(document, 'ConVars', 'fps_max');
if (fps) {
    fps.value = '400';
    if (fps.inlineComments?.length) fps.inlineComments[0] = 'FPS cap for this preset';
}

writeFileSync('gameinfo_modified.gi', composeGI(document));
```

### Document format

`parseGI` returns a JSON-serializable `GIDocument` with a `root` entry. Blocks hold an
ordered `entries` array, so each occurrence of a repeated key has its own value,
condition, and comments.

#### From GameInfo text to JSON

```text
GameInfo
{
    FileSystem
    {
        SearchPaths
        {
            // Game paths
            //
            // Local and shared content

            Game "citadel/addons" // Mods
            Game "citadel" [$WIN32]
            Game "core"
        }
    }
}
```

```json
{
  "root": {
    "kind": "block",
    "key": "GameInfo",
    "entries": [
      {
        "kind": "block",
        "key": "FileSystem",
        "entries": [
          {
            "kind": "block",
            "key": "SearchPaths",
            "entries": [
              {
                "kind": "value",
                "key": "Game",
                "value": "citadel/addons",
                "leadingComments": ["Game paths", "", "Local and shared content", null],
                "inlineComments": ["Mods"]
              },
              { "kind": "value", "key": "Game", "value": "citadel", "condition": "$WIN32" },
              { "kind": "value", "key": "Game", "value": "core" }
            ]
          }
        ]
      }
    ]
  }
}
```

#### Entry and comment fields

| `kind` | Fields besides `key` | Input |
| --- | --- | --- |
| `block` | `entries` holds the children in file order | `SearchPaths { Game "core" }` |
| `value` | `value` holds a string, number, or boolean | `fps_max 120` |
| `flag` | A final key by itself before a closing brace | `Flags { enabled }` |

Values and blocks can have a `condition` stored without the brackets. Optional
comment fields appear only when the parser has something to store there.

| Document value | Meaning |
| --- | --- |
| `leadingComments` | Comments and blank lines before an entry |
| `inlineComments` | Comments after an entry on the same line |
| `"Game paths"` | A `// Game paths` comment |
| `""` | A bare `//` comment line |
| `null` | A blank line |
| `{ "style": "block", "text": "Note" }` | A `/* Note */` block comment |

`beforeCloseComments` holds comments before a block's closing brace, and
`trailingComments` holds comments after the root.

Place comments above an entry or after its value, condition, or closing brace.
`parseGI` rejects comments between a key and its value or opening brace, and between
a value or closing brace and its condition.

Quoted values stay strings, so `"120"` parses as a string and `120` parses as a number.
Unquoted `true` and `false` become booleans. Unsafe integers and overflowing numbers
stay strings, with `numberSource` preserving their unquoted spelling.

#### Composing the document

`composeGI` writes the entries in order with four-space indentation, LF line endings,
and a single blank line at each separator between entries or comments. It also inserts a blank line
before an active line that would immediately follow a comment ending in a backslash.
This keeps Deadlock from skipping the next line.

Use `composeGI(document, { stripComments: true })` to omit comments. Quoted strings
containing comment markers remain intact. Parsing and composing support up to
512 levels of nesting below the root.

## Navigation

Pass each key as a separate argument. Lookups start inside the document root or a block
you pass directly. Keys match exactly, including case.

```ts
import { findGIEntry, findGIEntries, findGIValueEntry } from 's2-gameinfo';

// Read a nested value.
const fpsMax = findGIValueEntry(document, 'ConVars', 'fps_max')?.value;

// Find a block, then look up a setting inside it.
const conVars = findGIEntry(document, 'ConVars');
if (conVars?.kind === 'block') {
    console.log(findGIValueEntry(conVars, 'fps_max_ui')?.value);
}

// List repeated Game entries in file order.
const games = findGIEntries(document, 'FileSystem', 'SearchPaths', 'Game');
for (const game of games) {
    if (game.kind === 'value') console.log(game.value);
}
```

The first-match helpers return `undefined` for a missing path. The all-match helper
returns an empty array. Entries are editable references to the parsed document.

## ConVar lookup

`findConVar` matches an exact name and returns its description, default value
as text, and flags, or `undefined` for an unknown name.

```ts
import { findConVar } from 's2-gameinfo';

const info = findConVar('fps_max');
```

```json
{
  "name": "fps_max",
  "description": "Frame rate limiter.  0=no limit.  Does not apply to dedicated server.",
  "defaultValue": "400",
  "flags": ["a", "release"]
}
```

## Commented-out ConVars

```ts
import { composeGI, findGIValueEntry, parseGI } from 's2-gameinfo';

const content = 'GameInfo { ConVars {\n// fps_max 120\n} }';
const document = parseGI(content, { parseCommentedConVars: true });
const fps = findGIValueEntry(document, 'ConVars', 'fps_max');
console.log(fps);
```

The parsed entry looks like this.

```json
{
  "key": "fps_max",
  "kind": "value",
  "value": 120,
  "commentedOut": true
}
```

`composeGI(document)` initially writes `// fps_max 120`. Enable the setting and
compose again to write it as an active ConVar.

```ts
if (fps) fps.commentedOut = false;
console.log(composeGI(document));
```

```text
GameInfo
{
    ConVars
    {
        fps_max 120
    }
}
```

The parser option defaults to off. When enabled, standalone `//` lines inside
`ConVars` blocks can become value entries with `commentedOut: true`. The parser
requires a known name and a syntactically valid scalar. Values follow the same
parsing rules as active entries. Navigation includes these entries in source order.
`composeGI` writes them as comments, or omits them with `stripComments: true`.

## Supported Games

Tested with and supports:
- Deadlock

Not affiliated with Valve Corporation. Source, Source 2, Steam, Dota 2, Counter-Strike, and Deadlock are trademarks of Valve Corporation.
