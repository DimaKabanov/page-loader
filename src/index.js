import url from 'url';
import _ from 'lodash/fp';
import axios from 'axios';
import cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';

const attrMap = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getLocalResourcesLinks = (html) => {
  const dom = cheerio.load(html);

  const tags = _.keys(attrMap)
    .map((tagName) => dom(tagName).toArray())
    .flat();

  const localLinks = tags
    .map((tag) => {
      const { tagName } = dom(tag).get(0);
      const link = dom(tag).attr(attrMap[tagName]);
      return { tagName, link };
    })
    .filter(({ link }) => !_.isEmpty(link))
    .filter(({ link }) => _.isNull(url.parse(link).host));

  return localLinks;
};

const pageLoader = (pageUrl, outputPath = process.cwd()) => {
  const { hostname, pathname } = url.parse(pageUrl);

  const fileName = _.words(`${hostname}${pathname}`).join('-');
  const fileExt = '.html';
  const destinationPath = path.join(outputPath, `${fileName}${fileExt}`);

  return axios.get(pageUrl)
    .then(({ data }) => {
      const localResourcesLinks = getLocalResourcesLinks(data);
      console.log(localResourcesLinks);
      return fs.writeFile(destinationPath, data);
    });
};

export default pageLoader;
