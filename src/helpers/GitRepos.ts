import { stat } from 'fs';
import { join, basename } from 'path';

import { eachSeries } from 'async';
const simpleGit = require('simple-git');

import walk from './DirWalk';
const promisify = require('es6-promisify');

export class Repo {
  updateStatusTI: any;
  git: any;
  state: any;
  gitFetch: any;

  constructor (dir, callback) {
    this.state = {
      dir: dir,
      name: basename(dir),
      branch: '',
      ahead: 0,
      behind: 0,
      modified: [],
      added: []
    };

    this.validateDir(dir, (err) => {
      if (!err) {
        this.git = simpleGit(dir);
        // PROMISIFY THIS SHIT
        this.git.fetch = promisify(this.git.fetch.bind(this.git));
        this.git.pull = promisify(this.git.pull.bind(this.git));
        this.git.status = promisify(this.git.status.bind(this.git));
        callback(null);
      } else {
        callback(err);
      }
    });
  }

  updateStatus (params: { remoteHeads?: string[] } = undefined) {
    return this.git.status()
    .then(status => new Promise((resolve, reject) => {
      let newState = this.state;
      newState.lastUpdate = Date.now();
      newState.modified = status.modified;
      newState.ahead = status.ahead;
      newState.behind = status.behind;
      newState.branch = status.tracking ? status.tracking.replace('origin/', '') : '-';

      this.state = newState;
      resolve(newState);
    }));
  }

  fetch () {
    return this.git.fetch()
    .then(f => this.updateStatus());
  }

  refresh () {
    // git log origin/master --pretty=format:"%H"

    // this.git.listRemote(['--heads'], (err, remoteHeads) => {
    //   console.log(err, remoteHeads);
    //   this.updateStatus(callback, { remoteHeads });
    // })

    return this.git.fetch()
    .then(f => this.updateStatus());
  }

  pull () {
    return this.git.pull()
    .then(f => this.updateStatus());
  }

  remove () {
    this.git = undefined;
    clearTimeout(this.updateStatusTI);
  }

  validateDir (dir, callback) {
    stat(join(dir, '.git'), (err, rStat) => {
      callback(err);
    });
  }
};

export class Repos {
  private repos = {};

  searchRepos(dirs: string[],
              steps: (dir: string) => void,
              callback: (err: any, dirs?: string[]) => void) {

    let gitDirsToAdd = [];

    eachSeries(dirs, (dir, cb) => {
      walk(dir, steps, (err, gitDirs) => {
        gitDirsToAdd = gitDirsToAdd.concat(gitDirs);
        cb();
      }, '.git', 6);
    }, () => {
      callback(null, gitDirsToAdd);
    });
  }

  getRepo (dir) {
    return new Promise((resolve, reject) => {
      if (this.repos[dir]) {
        resolve(this.repos[dir]);
      } else {
        this.repos[dir] = new Repo(dir, err => {
          if (err) {
            this.repos[dir] = undefined;
            reject(err);
          } else {
            resolve(this.repos[dir]);
          }
        });
      }
    });
  }

  refresh (dir: string, callback) {
    this.getRepo(dir)
    .then((repo: Repo) => repo.refresh())
    .then(data => callback(null, data))
    .catch(err => callback(err));
  }

  fetch (dir: string, callback) {
    this.getRepo(dir)
    .then((repo: Repo) => repo.fetch())
    .then(data => callback(null, data))
    .catch(err => callback(err));
  }

  pull (dir: string, callback) {
    this.getRepo(dir)
    .then((repo: Repo) => repo.pull())
    .then(data => callback(null, data))
    .catch(err => callback(err));
  }
};

export default new Repos();
