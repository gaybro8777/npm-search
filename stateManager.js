import algoliaIndex from './algoliaIndex.js';
import c from './config.js';
import ms from 'ms';
import log from './log.js';

const defaultState = {
  seq: c.seq,
};

export default {
  check() {
    if (c.seq !== null) return this.reset();
    return this
      .get()
      .then(
        state => state === undefined ?
          this.reset()
          : state
      );
  },
  get() {
    const start = Date.now();

    return algoliaIndex
      .getSettings()
      .then(({userData}) => userData)
      .then(userData => {
        log.info('Getting state from Algolia took %s', ms(Date.now() - start));
        return userData;
      });
  },
  set(state) {
    const start = Date.now();

    return algoliaIndex
      .setSettings({userData: state})
      .then(({taskID}) => algoliaIndex.waitTask(taskID))
      .then(() => {
        log.info('Setting state on Algolia took %s', ms(Date.now() - start));
      })
      .then(this.get);
  },
  reset() {
    return this.set(defaultState);
  },
  save(partial) {
    return this
      .get()
      .then(
        (current = defaultState) => this.set({...current, ...partial})
      );
  },
};
