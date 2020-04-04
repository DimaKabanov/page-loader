import { promises as fs } from 'fs';
import { URL } from 'url';
import path from 'path';
import _ from 'lodash';
import 'axios-debug-log';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';

const tags = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const log = debug('page-loader');

const replaceDelimetrInLink = (link) => link |> _.words |> ((words) => words.join('-'));

const makeAssetFileName = (link) => {
  const { dir, base } = path.parse(link);
  const updatedLocalLink = replaceDelimetrInLink(dir);
  const assetsFileName = _.trim(`${updatedLocalLink}-${base}`, '-');
  return assetsFileName;
};

const isLocalLink = (link) => {
  const domainName = 'https://example.ru';
  const absoluteUrl = new URL(domainName);
  const verifiableUrl = new URL(link, domainName);
  const isLocal = verifiableUrl.hostname === absoluteUrl.hostname;

  return isLocal;
};

const replaceAssetLinksInHTML = (html, assetsDirName) => {
  const dom = cheerio.load(html);
  Object.entries(tags).forEach(([tagName, attr]) => {
    dom(tagName)
      .filter((i, tag) => isLocalLink(dom(tag).attr(attr)))
      .each((i, tag) => {
        const assetLink = dom(tag).attr(attr);
        const assetsFileName = makeAssetFileName(assetLink);
        const assetsFullPath = path.join(assetsDirName, assetsFileName);
        dom(tag).attr(attr, assetsFullPath);
      });
  });

  return dom.html();
};

const getAssetLinksFromHTML = (html, pageUrl) => {
  const dom = cheerio.load(html);
  const assetLinks = Object.entries(tags).map(([tagName, attr]) => (
    dom(tagName)
      .filter((i, tag) => {
        const assetLink = dom(tag).attr(attr);
        return isLocalLink(assetLink);
      })
      .map((i, tag) => {
        const localLink = dom(tag).attr(attr);
        const fullLink = new URL(localLink, pageUrl);
        return { localLink, fullLink };
      })
      .get()
  )).flat();

  return assetLinks;
};

export default (pageUrl, outputPath = process.cwd()) => {
  const updatedPageUrl = new URL(pageUrl)
    |> (({ hostname, pathname }) => path.join(hostname, pathname))
    |> replaceDelimetrInLink;

  const indexFileName = `${updatedPageUrl}.html`;
  const assetsDirName = `${updatedPageUrl}_files`;
  const indexPageFullPath = path.join(outputPath, indexFileName);
  const assetsDirFullPath = path.join(outputPath, assetsDirName);

  let html = null;
  let assetLinks = null;
  let assetPromises = [];

  const getAssetPromises = () => {
    assetLinks = getAssetLinksFromHTML(html, pageUrl);
    const assetTasks = new Listr(assetLinks.map(({ fullLink }) => ({
      title: `Download - ${fullLink.toString()}`,
      task: () => {
        const promise = axios.get(fullLink.toString(), { responseType: 'arraybuffer' });
        assetPromises = [...assetPromises, promise];
      },
    })));
    return assetTasks.run();
  };

  const writeAssets = (assets) => {
    const promises = assets.map(({ data }, index) => {
      const { localLink } = assetLinks[index];
      const assetFileName = makeAssetFileName(localLink);
      const assetFullPath = path.join(assetsDirFullPath, assetFileName);
      return fs.writeFile(assetFullPath, data);
    });
    return Promise.all(promises);
  };

  return axios.get(pageUrl)
    .then((response) => { html = response.data; })
    .then(() => log('Download HTML file by path', pageUrl))
    .then(() => fs.writeFile(indexPageFullPath, replaceAssetLinksInHTML(html, assetsDirName)))
    .then(() => log('Write new HTML file by path', indexPageFullPath))
    .then(() => fs.mkdir(assetsDirFullPath))
    .then(() => log('Create assets folder by path', assetsDirFullPath))
    .then(getAssetPromises)
    .then(() => Promise.all(assetPromises))
    .then(writeAssets)
    .then(() => assetLinks.forEach(({ localLink }) => log('Create asset file', makeAssetFileName(localLink))));
};
