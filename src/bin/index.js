#!/usr/bin/env node

import process from 'process';
import commander from 'commander';
import makeErrorMessage from '../errors';
import pageLoader from '..';

commander
  .version('0.0.1')
  .arguments('<pageUrl>')
  .option('-o, --output [path]', 'output folder path')
  .description('Downloads a page from the web and puts it in the specified folder.')
  .action((pageUrl) => {
    pageLoader(pageUrl, commander.output)
      .then(() => console.log(`successful page load at url ${pageUrl}`))
      .catch((error) => {
        const errorMessage = makeErrorMessage(error);
        console.error(errorMessage);
        process.exit(1);
      });
  });

commander.parse(process.argv);
