import algoliaIndex from './algoliaIndex.js';
import formatPkg from './formatPkg.js';
import log from './log.js';
import npm from './npm.js';
import ms from 'ms';

export default function saveChangesAndState(seq, changes) {
  const rawPkgs = changes
    .filter(result => result.doc.name !== undefined) // must be a document
    .map(result => formatPkg(result.doc))
    .filter(pkg => pkg !== undefined);

  if (rawPkgs.length === 0) {
    log.info('No pkgs found in changes.');
    return Promise.resolve();
  }

  return addMetaData(rawPkgs)
    .then(pkgs => {
      const start = Date.now();
      return algoliaIndex.saveObjects(pkgs).then(res => {
        log.info('Saving objects on Algolia took %s', ms(Date.now() - start));
        return res;
      });
    })
    .then(({taskID}) => algoliaIndex.waitTask(taskID))
    .then(() => log.info('Found and saved %d packages', rawPkgs.length));
}

function addMetaData(pkgs) {
  return npm.getDownloads(pkgs);
}
