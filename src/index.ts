import fs from "node:fs/promises";
import type { EncodingOption } from "node:fs";

import glob from "fast-glob";
import katex from "katex";
import * as htmlParser from "node-html-parser";

export type RenderMathOpts = {
  ignoreRegExp?: RegExp;
  inlineRegExp?: RegExp;
  displayRegExp?: RegExp;
};

const defaultRenderMathOpts = {
  ignoreRegExp: /(<code>[^]*?<\/code>|<pre>[^]*?<\/pre>)/gm,
  displayRegExp: /(?:\${2})([^]*?)(?:\${2})/gm,
  inlineRegExp: /(?:\$)([^]*?)(?:\$)/gm,
};

export function renderMath(str: string, opts: RenderMathOpts) {
  const parsedOpts = { ...defaultRenderMathOpts, ...opts };

  let matches = 0;

  const rendered = str
    .split(parsedOpts.ignoreRegExp)
    .map((subStr) => {
      if (!subStr.match(parsedOpts.ignoreRegExp)) {
        for (const regExp of [
          parsedOpts.displayRegExp,
          parsedOpts.inlineRegExp,
        ]) {
          subStr = subStr.replace(regExp, (_, p1) => {
            matches += 1;
            return katex.renderToString(p1);
          });
        }
      }

      return subStr;
    })
    .join("");

  return { rendered, matches };
}

export type ParseHtmlOpts = RenderMathOpts & {
  querySelector?: string;
};

const defaultParseHtmlOpts = {
  ...defaultRenderMathOpts,
  querySelector: "h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table, dl",
};

export function parseHtml(html: string, opts: ParseHtmlOpts = {}) {
  const parsedOpts = { ...defaultParseHtmlOpts, ...opts };

  let totalMatches = 0;

  const root = htmlParser.parse(html);
  const elements = root.querySelectorAll(parsedOpts.querySelector);

  for (const el of elements) {
    const innerHtml = el.innerHTML;
    const { rendered, matches } = renderMath(innerHtml, { ...parsedOpts });

    if (matches > 0) {
      totalMatches += matches;
      el.innerHTML = rendered;
    }
  }

  return { html: root.toString(), matches: totalMatches };
}

export type ParseHtmlFilesOpts = ParseHtmlOpts & {
  encoding?: EncodingOption;
  fastGlobOpts?: glob.Options;
  log?: boolean;
};

const defaultParseHtmlFilesOpts: ParseHtmlFilesOpts = {
  ...defaultRenderMathOpts,
  ...defaultParseHtmlOpts,
  encoding: "utf-8" as EncodingOption,
  fastGlobOpts: {},
  log: false,
};

export async function parseHtmlFiles(
  sources: string | string[] = ["**/*.html", "!node_modules/**"],
  opts: ParseHtmlFilesOpts = {}
) {
  const parsedOpts = { ...defaultParseHtmlFilesOpts, ...opts };

  const stream = glob.stream(sources, parsedOpts.fastGlobOpts);

  if (parsedOpts.log) {
    console.log(`rendering KaTeX math expressions in ${sources}`);
  }

  for await (const entry of stream) {
    const html = (await fs.readFile(entry, parsedOpts.encoding)).toString();
    const { html: parsedHtml, matches } = parseHtml(html, { ...parsedOpts });

    if (matches > 0) {
      await fs.writeFile(entry, parsedHtml, parsedOpts.encoding);

      if (parsedOpts.log) {
        console.log(`rendered ${matches} expression(s) in ${entry}`);
      }
    }
  }
}
