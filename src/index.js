import { promises as fs } from 'fs';
import url from 'url';
import path from 'path';
import _ from 'lodash';
import axios from 'axios';
import cheerio from 'cheerio';

const tags = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getUpdatedLink = (link) => {
  const extname = path.extname(link);
  const updatedLink = link
    |> _.words
    |> _.dropRight
    |> ((words) => words.join('-'))
    |> ((name) => `${name}${extname}`);

  return updatedLink;
};

const getUpdatedHtml = (html, localLinks, assetsDirName) => {
  const dom = cheerio.load(html);
  localLinks.forEach(({ name, link }) => {
    const attr = tags[name];
    const resourseName = getUpdatedLink(link);
    const destAssetsPath = path.join(assetsDirName, resourseName);
    dom(`${name}[${attr}='${link}']`).attr(attr, destAssetsPath);
  });

  return dom.html();
};

const getLocalLinks = (html) => {
  const dom = cheerio.load(html);
  const links = _.keys(tags)
    .map((tagName) => dom(tagName).toArray())
    .flat()
    .map((tag) => {
      const name = dom(tag).get(0).tagName;
      const link = dom(tag).attr(tags[name]);
      return { name, link };
    })
    .filter((tag) => _.isNull(url.parse(tag.link).host));

  return links;
};

const pageLoader = (pageUrl, outputPath = process.cwd()) => {
  const { protocol, hostname, pathname } = url.parse(pageUrl);
  const indexPageName = getUpdatedLink(`${hostname}${pathname}.html`);
  const assetsDirName = _.replace(indexPageName, '.html', '_files');
  const assetsDirPath = path.join(outputPath, assetsDirName);
  const destIndexPagePath = path.join(outputPath, indexPageName);
  let localLinks = null;
  let assets = null;

  return axios.get(pageUrl)
    .then((response) => {
      const { data } = response;
      localLinks = getLocalLinks(data);
      const updatedHtml = getUpdatedHtml(data, localLinks, assetsDirName);
      fs.writeFile(destIndexPagePath, updatedHtml);
      const promises = localLinks.map(({ link }) => {
        const fullLink = url.format({
          protocol,
          hostname,
          pathname: path.join(pathname, link),
        });
        return axios.get(fullLink);
      });
      return Promise.all(promises);
    })
    .then((responses) => {
      assets = responses.map(({ data }) => data);
      return fs.mkdir(assetsDirPath);
    })
    .then(() => {
      const a = _.zipWith(localLinks, assets, (link, asset) => _.set(link, 'data', asset));
      const promises = a.map(({ link, data }) => {
        const assetPath = getUpdatedLink(link);
        const assetFullPath = path.join(assetsDirPath, assetPath);
        return fs.writeFile(assetFullPath, data);
      });
      return Promise.all(promises);
    });
};

export default pageLoader;
