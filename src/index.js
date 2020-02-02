import url from 'url';
import _ from 'lodash/fp';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

const pageLoader = (urlLink, outputPath = process.cwd()) => {
  const { hostname, pathname } = url.parse(urlLink);

  const fileName = _.words(`${hostname}${pathname}`).join('-');
  const fileExt = '.html';
  const destinationPath = path.join(outputPath, `${fileName}${fileExt}`);

  return axios.get(urlLink)
    .then(({ data }) => fs.writeFile(destinationPath, data));
};

export default pageLoader;
