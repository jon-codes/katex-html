#!/usr/bin/env node
import { program } from "commander";
import type { EncodingOption } from "node:fs";

import { parseHtmlFiles } from ".";
import type { ParseHtmlFilesOpts } from ".";

const { name, version, description } = require("../package.json");

program
  .name(name)
  .description(description)
  .version(version)
  .argument("[sources...]", "glob pattern(s) of source files", [
    "**/*.html",
    "!node_modules/**",
  ])
  .option("-e, --encoding <string>", "encoding of source files")
  .option("-q --query <string>", "css selector query")
  .option(
    "-i --ignore <tags>",
    "comma separated list of tags to ignore",
    (value: string) => (value ? value.split(",") : value)
  )
  .action(start);

async function start(
  sources: string,
  opts: { encoding?: EncodingOption; query?: string; ignore?: string[] }
) {
  const transformedOpts: ParseHtmlFilesOpts = { log: true };

  if (opts.encoding) {
    transformedOpts.encoding = opts.encoding;
  }

  if (opts.query) {
    transformedOpts.querySelector = opts.query;
  }

  if (opts.ignore) {
    transformedOpts.ignoreRegExp = new RegExp(
      `(${opts.ignore.map((tag) => `<${tag}>[^]*?<\\/code>`).join("|")})`,
      "gm"
    );
  }

  parseHtmlFiles(sources, transformedOpts);
}

program.parse();
