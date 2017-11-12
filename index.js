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
  applyPlaceholderEntityToSelection,
} from './src';
import PlaceholderDashboard from './src/PlaceholderDashboard';
import { findPlaceholderStrategy, logRaw, PlaceholderDecorator } from "./src/index";

const initialPlaceholders = [
  createPlaceholder('chance', 'Will'),
  createPlaceholder('product', 'Garcinia Extreme'),
  createPlaceholder('goal', 'loosing weight'),
];

const chance = createPlaceholderEntity(initialPlaceholders[0]);
const product = createPlaceholderEntity(initialPlaceholders[1]);
const goal = createPlaceholderEntity(initialPlaceholders[2]);

const compositeDecorator = new CompositeDecorator([
  {
    strategy: findPlaceholderStrategy,
    component: PlaceholderDecorator,
  },
]);

class MyEditor extends React.Component {
  constructor() {
    super();
    const initialEditorState = new RawContentState()
      .addBlock('May Help With', 'header-two')
      .addEntity(chance, 0, 3)
      .addBlock('goal', 'header-two')
      .addEntity(goal, 0, 4)
      .addBlock('BL Demo Product is a triple-threat natural health supplement.')
      .addEntity(product, 0, 15)
      .addBlock('In conjunction with a lower calorie diet and regular exercise, BL Demo Product may be just what you need.')
      .addEntity(product, 63, 15)
      .addBlock('May Manage Stress', 'unordered-list-item')
      .addEntity(chance, 0, 3)
      .addBlock('May Suppress Appetite', 'unordered-list-item')
      .addEntity(chance, 0, 3)
      .addBlock('May Improve Vitality And Energy', 'unordered-list-item')
      .addEntity(chance, 0, 3)
      .toEditorState(compositeDecorator);

    this.state = {
      editorState: initialEditorState,
      placeholders: initialPlaceholders,
    };

    this.onChange = editorState => this.setState({ editorState });
    this.setDomEditorRef = ref => this.domEditor = ref;
  }

  componentDidMount() {
    this.domEditor.focus();
    this.replaceEntities();
  }

  getEditorState = () => this.state.editorState;

  replaceEntities = () => {
    this.setState({
      editorState: replacePlaceholders(this.state.editorState, this.state.placeholders),
    });
  };

  addPlaceholder = (name = '', value = '') => {
    const oldPlaceholders = this.state.placeholders;
    const found = oldPlaceholders.find(x => x.name === name);
    if (found) {
      return;
    }

    const placeholders = [
      ...oldPlaceholders,
      createPlaceholder(name, value),
    ];

    this.setState({ placeholders });
  };

  removePlaceholder = (name = '') => {
    const oldPlaceholders = this.state.placeholders;
    const placeholders = oldPlaceholders.filter(x => x.name !== name);

    this.setState({ placeholders });
  };

  updatePlaceholder = index => value => {
    const placeholders = [...this.state.placeholders];
    placeholders[index].value = value;
    this.setState({ placeholders });
  };

  applyPlaceholder = (name, value) => {
    const editorState = this.state.editorState;
    const newEditorState = applyPlaceholderEntityToSelection(name, value, editorState);
    this.setState({ editorState: newEditorState }, this.replaceEntities);
  };

  render() {
    return (
      <div>
        <PlaceholderDashboard
          placeholders={this.state.placeholders}
          onChange={this.updatePlaceholder}
          replaceEntities={this.replaceEntities}
          addPlaceholder={this.addPlaceholder}
          removePlaceholder={this.removePlaceholder}
          applyPlaceholder={this.applyPlaceholder}
        />
        <div
          style={{ marginTop: '40px', border: '1px solid #ccc', background: 'white' }}
          onDoubleClick={() => logRaw(this.state.editorState)}
          onClick={this.focus}
        >
          <Editor
            ref={this.setDomEditorRef}
            editorState={this.state.editorState}
            onChange={this.onChange}
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<MyEditor/>, document.querySelector('.container'));
