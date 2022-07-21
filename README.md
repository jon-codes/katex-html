# katex-html

Render math expressions with KaTeX in HTML.

## Install

```bash
npm install -g katex-html
```

## CLI

```bash
npx katex-html
```

```
Usage: katex-html [options] [sources...]

Render math expressions with KaTeX in HTML.

Arguments:
  sources                  glob pattern(s) of source files (default: ["**/*.html","!node_modules/**"])

Options:
  -V, --version            output the version number
  -e, --encoding <string>  encoding of source files
  -q --query <string>      css selector query
  -i --ignore <tags>       comma separated list of tags to ignore
  -h, --help               display help for command
```

## Development

### Install dependencies

```
npm install
```

### Build

```
npm run build
```
