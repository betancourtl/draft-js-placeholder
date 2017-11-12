/* eslint-disable import/no-extraneous-dependencies */
// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import { Editor, CompositeDecorator } from 'draft-js';
import RawContentState from 'draft-js-raw-content-state';
import {
  replacePlaceholders,
  createPlaceholder,
  createPlaceholderEntity,
} from './src';
import PlaceholderDashboard from './src/PlaceholderDashboard';
import { findPlaceholderStrategy, logRaw, PlaceholderDecorator } from "./src/index";

const initialPlaceholders = [
  createPlaceholder('firstName', 'Luis'),
  createPlaceholder('lastName', 'Betancourt'),
  createPlaceholder('job', 'programmer'),
];

const entity1 = createPlaceholderEntity(createPlaceholder('firstName', 'Cristian'));
const entity2 = createPlaceholderEntity(createPlaceholder('lastName', 'Graziano'));
const entity3 = createPlaceholderEntity(createPlaceholder('job', 'student'));

const compositeDecorator = new CompositeDecorator([
  {
    strategy: findPlaceholderStrategy,
    component: PlaceholderDecorator,
  },
]);

const initialEditorState = new RawContentState()
  .addBlock('Block 1')
  .addEntity(entity1)
  .addBlock('Block 1')
  .addEntity(entity1)
  .toEditorState(compositeDecorator);

class MyEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      editorState: initialEditorState,
      placeholders: initialPlaceholders,
    };

    this.onChange = editorState => this.setState({ editorState });
  }

  replaceEntities = () => {
    this.setState({
      editorState: replacePlaceholders(this.state.editorState, this.state.placeholders),
    });
  };

  addPlaceholder = (name = '', value = '') => {
    const oldPlaceholders = this.state.placeholders;
    const createName = (_name, placeholders, index = 0) => {
      const found = placeholders.find(x => x.name === _name);
      if (found) {
        return createName(`placeholder${index}`, placeholders, index + 1);
      }
      return _name;
    };

    const placeholders = [
      ...oldPlaceholders,
      createPlaceholder(createName(name, oldPlaceholders), value),
    ];

    this.setState({ placeholders });
  };

  updatePlaceholder = index => value => {
    const placeholders = [...this.state.placeholders];
    placeholders[index].value = value;
    this.setState({ placeholders });
  };

  render() {
    // logRaw(this.state.editorState);
    return (
      <div>
        <PlaceholderDashboard
          placeholders={this.state.placeholders}
          onChange={this.updatePlaceholder}
          replaceEntities={this.replaceEntities}
          addPlaceholder={this.addPlaceholder}
        />
        <div
          style={{ marginTop: '20px' }}
          onDoubleClick={() => logRaw(this.state.editorState)}
        >
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<MyEditor/>, document.querySelector('.container'));
