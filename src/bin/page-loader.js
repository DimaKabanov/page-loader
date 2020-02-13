#!/usr/bin/env node

import commander from 'commander';
import pageLoader from '..';

commander
  .version('0.0.1')
  .arguments('<pageUrl>')
  .option('-o, --output [path]', 'output folder path')
  .description('Downloads a page from the web and puts it in the specified folder.')
  .action((pageUrl) => {
    pageLoader(pageUrl, commander.output);
  });

commander.parse(process.argv);
