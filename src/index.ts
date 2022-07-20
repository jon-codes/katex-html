import fs from "node:fs/promises";
import type { EncodingOption } from "node:fs";

import glob from "fast-glob";
import katex from "katex";
import * as htmlParser from "node-html-parser";

type RenderMathOpts = {
  ignorePattern?: string;
  inlineMathPattern?: string;
  displayMathPattern?: string;
};

const defaultRenderMathOpts = {
  ignorePattern: "(<code>[^]*?</code>|<pre>[^]*?</pre>)",
  displayMathPattern: "(?:\\${2})([^]*?)(?:\\${2})",
  inlineMathPattern: "(?:\\$)([^]*?)(?:\\$)",
};

function renderMath(str: string, opts: RenderMathOpts) {
  const parsedOpts = { ...defaultRenderMathOpts, ...opts };

  const ignoreRegExp = new RegExp(parsedOpts.ignorePattern, "g");
  const displayMathRegExp = new RegExp(parsedOpts.displayMathPattern, "g");
  const inlineMathRegExp = new RegExp(parsedOpts.inlineMathPattern, "g");

  return str
    .split(ignoreRegExp)
    .map((subStr) => {
      if (!subStr.match(ignoreRegExp)) {
        for (const regExp of [displayMathRegExp, inlineMathRegExp]) {
          subStr = subStr.replace(regExp, (_, p1) => {
            return katex.renderToString(p1);
          });
        }
      }
    })
    .join("");
}

type ParseHtmlOpts = RenderMathOpts & {
  querySelector?: string;
};

const defaultParseHtmlOpts = {
  ...defaultRenderMathOpts,
  querySelector: "h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table, dl",
};

function parseHtml(html: string, opts: ParseHtmlOpts = {}) {
  const parsedOpts = { ...defaultParseHtmlOpts, ...opts };

  const root = htmlParser.parse(html);
  const elements = root.querySelectorAll(parsedOpts.querySelector);

  for (const el of elements) {
    const innerHtml = el.innerHTML;
    const newInnerHtml = renderMath(innerHtml, { ...parsedOpts });

    if (innerHtml !== newInnerHtml) {
      el.innerHTML = newInnerHtml;
    }
  }

  return root.toString();
}

type ParseHtmlFilesOpts = ParseHtmlOpts & {
  encoding?: EncodingOption;
  fastGlobOpts?: glob.Options;
};

const defaultParseHtmlFilesOpts: ParseHtmlFilesOpts = {
  ...defaultRenderMathOpts,
  ...defaultParseHtmlOpts,
  encoding: "utf-8" as EncodingOption,
  fastGlobOpts: {},
};

async function parseHtmlFiles(
  patterns: string | string[],
  opts: ParseHtmlFilesOpts = {}
) {
  const parsedOpts = { ...defaultParseHtmlFilesOpts, ...opts };

  const stream = glob.stream(patterns, parsedOpts.fastGlobOpts);

  for await (const entry of stream) {
    const html = (await fs.readFile(entry, parsedOpts.encoding)).toString();
    const parsedHtml = parseHtml(html, { ...parsedOpts });

    if (html !== parsedHtml) {
      await fs.writeFile(entry, parsedHtml, parsedOpts.encoding);
    }
  }
}

export { renderMath, parseHtml, parseHtmlFiles };
