import { promises as fs } from 'fs';
import url, { URL } from 'url';
import path from 'path';
import _ from 'lodash';
import 'axios-debug-log';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';

const tags = [
  {
    selector: 'link[href]:not([href*="//"])',
    attr: 'href',
  },
  {
    selector: 'img[src]:not([src*="//"])',
    attr: 'src',
  },
  {
    selector: 'script[src]:not([src*="//"])',
    attr: 'src',
  },
];

const log = debug('page-loader');

const updateLink = (link) => {
  const updatedLink = link
    |> url.parse
    |> (({ hostname, pathname }) => url.format({ hostname, pathname }))
    |> _.words
    |> ((words) => words.join('-'));

  return updatedLink;
};

const makeAssetFileName = (link) => {
  const { dir, base } = path.parse(link);
  const updatedLocalLink = updateLink(dir);
  const assetsFileName = _.trim(`${updatedLocalLink}-${base}`, '-');
  return assetsFileName;
};

const updateHtml = (html, assetsDirName) => {
  const dom = cheerio.load(html);
  tags.forEach(({ selector, attr }) => {
    dom(selector).each((i, tag) => {
      const assetLink = dom(tag).attr(attr);
      const assetsFileName = makeAssetFileName(assetLink);
      const assetsFullPath = path.join(assetsDirName, assetsFileName);
      dom(tag).attr(attr, assetsFullPath);
    });
  });

  return dom.html();
};

const getAssetLinks = (html, pageUrl) => {
  const dom = cheerio.load(html);
  const assetLinks = tags.map(({ selector, attr }) => (
    dom(selector).map((i, tag) => {
      const localLink = dom(tag).attr(attr);
      const fullLink = new URL(localLink, pageUrl);
      return { localLink, fullLink };
    }).get()
  )).flat();

  return assetLinks;
};

export default (pageUrl, outputPath = process.cwd()) => {
  const updatedPageUrl = updateLink(pageUrl);
  const indexFileName = `${updatedPageUrl}.html`;
  const assetsDirName = `${updatedPageUrl}_files`;
  const indexPageFullPath = path.join(outputPath, indexFileName);
  const assetsDirFullPath = path.join(outputPath, assetsDirName);

  let html = null;
  let assetLinks = null;
  let assetPromises = [];

  const getAssetPromises = () => {
    assetLinks = getAssetLinks(html, pageUrl);
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
    .then(() => fs.writeFile(indexPageFullPath, updateHtml(html, assetsDirName)))
    .then(() => log('Write new HTML file by path', indexPageFullPath))
    .then(() => fs.mkdir(assetsDirFullPath))
    .then(() => log('Create assets folder by path', assetsDirFullPath))
    .then(getAssetPromises)
    .then(() => Promise.all(assetPromises))
    .then(writeAssets)
    .then(() => assetLinks.forEach(({ localLink }) => log('Create asset file', makeAssetFileName(localLink))));
};
