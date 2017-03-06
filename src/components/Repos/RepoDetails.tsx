import { IGroup } from '../../interfaces/IGroup';
import { IRepo } from '../../interfaces/IRepo';

import * as React from 'react';
import * as moment from 'moment';
import { basename } from 'path';
import { exec } from 'child_process';
import { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
const Isvg = require('react-inlinesvg');

import actions from '../../actions';
import { renderLog } from '../../helpers/logger';

const openInGitGui = (repo) => {
  exec(`cd ${ repo.dir } && git gui`);
};

const openInGitK = (repo) => {
  exec(`cd ${ repo.dir } && gitk`);
};

const updateDate = (repo, el) => {
  setTimeout(() => {
    if (el && el.innerHTML) {
      el.innerHTML = moment(repo.lastUpdate).fromNow();
      updateDate(repo, el);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

const RepoDetailsComponent: any = ({repo, actions}: { repo: IRepo, actions: any }) => {
  if (!repo) {
    renderLog('REPO DETAILS EMPTY');
    return <div></div>;
  }

  renderLog('REPO DETAILS', repo.name || basename(repo.dir));

  let cls = '';

  if (repo.behind) {
    cls = 'behind';
  } else if (repo.ahead) {
    cls = 'ahead';
  } else if (repo.modified && repo.modified.length) {
    cls = 'modified';
  }

  const modified = repo.modified && repo.modified.map(file => (
    <li key={ file } onClick={ actions.fileDiff.bind(null, `${repo.dir}/${file}`) }>
      { file }
    </li>
  ));

  const untracked = repo.untracked && repo.untracked.map(file => (
    <li key={ file } onClick={ actions.fileDiff.bind(null, `${repo.dir}/${file}`) }>
      { file }
    </li>
  ));

  return (
    <div className={ 'repo-details ' + cls + (repo.progressing ? ' progressing' : '') }>
      <h2 className='header'>
        Details of repo: { repo.name ? repo.name : basename(repo.dir) } @ { repo.branch }
      </h2>

      <i className='icon icon-x' title='Delete this repo' onClick={ actions.hideRepoDetails.bind(null) }>
        <Isvg src='./svg/x.svg'/>
      </i>


      <div className='content'>
        <h4 className='status'>
          { repo.ahead ?
            <span className='ahead'>Ahead: { repo.ahead } </span> : ''
          }

          { repo.behind ?
            <span className='behind'>Behind: { repo.behind } </span> : ''
          }
        </h4>

        { repo.modified && repo.modified.length ?
          <div>
            <h4>Modified: { repo.modified.length }</h4>
            <ul>
              { modified }
            </ul>
          </div> : ''
        }

        { repo.untracked && repo.untracked.length ?
          <div>
            <h4>Untracked: { repo.untracked.length }</h4>
            <ul>
              { untracked }
            </ul>
          </div> : ''
        }

        <p className='updated' title='Updated from now' ref={ updateDate.bind(null, repo) }>
          Updated: { moment(repo.lastUpdate).fromNow() }
        </p>

      </div>

      <footer className='footer'>
        <button onClick={ openInGitGui.bind(null, repo) } className='button'>
          <i className='icon icon-add'>
            <Isvg src='./svg/git-icon.svg'/>
          </i>

          <span>Open in git gui</span>
        </button>

        <button onClick={ openInGitK.bind(null, repo) } className='button'>
          <i className='icon icon-add'>
            <Isvg src='./svg/git-icon.svg'/>
          </i>

          <span>Open in gitk</span>
        </button>
      </footer>

    </div>
  );
};

RepoDetailsComponent.propTypes = {
  actions: PropTypes.object.isRequired
};


const mapStateToProps = (state, ownProps = {}) => {
  const repo = state.repos.filter(r => r.id === state.app.repoShown)[0];

  return { repo };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(actions, dispatch)
});

const RepoDetails = connect(
  mapStateToProps,
  mapDispatchToProps
)(RepoDetailsComponent);

export default RepoDetails;
