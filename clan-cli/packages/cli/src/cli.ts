#!/usr/bin/env bun
import { runCli } from "./cli/parse.ts";

const code = await runCli(process.argv);
process.exit(code);
