import * as React from 'react';
import { Repo, StateRepo } from './Repo';
import Sortable = require('sortablejs');

// let Sortable = require('react-sortablejs');

export interface ReposProps {
  reloadRepo: any;
  pullRepo: any;

  deleteRepo: any;
  reorderRepo: any;

  reorderGroup: any;
  deleteGroup: any;
  startEditGroup: any;
  editGroup: any;
  repos: { title: string, repos: StateRepo[] }[];
}

export class Repos extends React.Component<ReposProps, {}> {
  sortableRepos (el) {
    if (el) {
      setTimeout(() => {
        let options = {
          animation: 150,
          handle: '.title',
          draggable: '.repo-el',
          forceFallback: true,
          group: 'shared-repos',
          onUpdate: this.onUpdateRepo.bind(this),
          onAdd: this.onAddRepo.bind(this)
        };

        Sortable.create(el, options);
      }, 200);

    }
  }

  onUpdateRepo(event) {
    this.props.reorderRepo({
      from: Number(event.from.getAttribute('data-repos-id')),
      to: Number(event.to.getAttribute('data-repos-id')),
      oldIndex: event.oldIndex,
      newIndex: event.newIndex
    });
  }

  onAddRepo(event) {
    /**
     * Put dragged element back to `from` node.
     * It's needed to avoid React VIRTUAL DOM cleanup.
     * Otherwise You will get error `can't remove element...`
     */
    event.from.appendChild(event.item);

    this.props.reorderRepo({
      from: Number(event.from.getAttribute('data-repos-id')),
      to: Number(event.to.getAttribute('data-repos-id')),
      oldIndex: event.oldIndex,
      newIndex: event.newIndex
    });
  }

  sortableGroups (el) {
    if (el) {
      let options = {
        animation: 150,
        handle: '.mover',
        draggable: '.message',
        // forceFallback: true,
        onUpdate: this.onUpdateGroup.bind(this),
      };

      Sortable.create(el, options);
    }
  }

  onChangeGroupName (id, e) {
    if (e.key === 'Enter') {
      this.props.editGroup(id, e.target.value);
    }
  }

  onUpdateGroup(event) {
    this.props.reorderGroup({
      oldIndex: event.oldIndex,
      newIndex: event.newIndex
    });
  }

  renderRepos(repos) {
    return repos.map(repo => {
      return (<Repo key={repo.dir}
                    repo={repo}
                    onRefresh={this.props.reloadRepo}
                    onDelete={this.props.deleteRepo}
                    onPull={this.props.pullRepo}
                  />);
    });
  }

  renderReposGroups(groups) {
    return groups.map((group, id) => {
      let groupTitle = (<span onClick={ this.props.startEditGroup.bind(this, id) }>
                          { group.title }
                        </span>);
      if (group.editing) {
        groupTitle = <input onKeyPress={ this.onChangeGroupName.bind(this, id) } className='input' defaultValue={ group.title }/>;
      }

      return (
        <div className='message' key={ group.title }>
          <div className='message-header control is-grouped'>
            <p className='control mover icon is-small'>
              <i className='fa fa-arrows-v' />
            </p>

            <p className='control  is-expanded'>
              { groupTitle }
            </p>

            <p className='control'>
              <button onClick={ this.props.deleteGroup.bind(this, id) } className='delete' style={{float: 'right'}} />
            </p>
          </div>
          <div className='message-body'>
            <div className='repos columns is-multiline'
              data-repos-id={ id }
              ref={ this.sortableRepos.bind(this) }
              >
              { this.renderRepos(group.repos) }
            </div>
          </div>
        </div>);
    });
  }

  render() {
    return (
      <div>
        <div className='repos-box' ref={ this.sortableGroups.bind(this) }>
          { this.renderReposGroups(this.props.repos) }
        </div>
      </div>
    );
  }
}
