/* eslint-disable import/no-extraneous-dependencies */
// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import { Editor, CompositeDecorator, EditorState } from 'draft-js';
import RawContentState from 'draft-js-raw-content-state';
import {
  replacePlaceholders,
  createPlaceholder,
  createPlaceholderEntity,
  applyPlaceholderEntityToSelection,
  mergePlaceholdersWithExisting,
  findPlaceholderStrategy,
  removePlaceholderEntities,
  PlaceholderDecorator,
} from './src';
import PlaceholderDashboard from './src/PlaceholderDashboard';
import './styles.css';

const compositeDecorator = new CompositeDecorator([
  {
    strategy: findPlaceholderStrategy,
    component: PlaceholderDecorator,
  },
]);

class MyEditor extends React.Component {
  constructor(props) {
    super(props.editorState);
    this.state = {
      editorState: props.editorState,
      placeholders: props.placeholders,
      decoratorOn: false,
    };

    this.onChange = editorState => this.setState({ editorState });
    this.setDomEditorRef = ref => this.domEditor = ref;
  }

  componentWillMount() {
    const placeholders = mergePlaceholdersWithExisting(
      this.state.editorState,
      this.props.placeholders,
    );

    this.setState({ placeholders }, this.replaceEntities);
  }

  componentDidMount() {
    this.domEditor.focus();
  }

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
    const editorState = removePlaceholderEntities(this.state.editorState, name);
    this.setState({ placeholders, editorState });
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

  toggleDecorators = () => {
    const decorator = this.state.decoratorOn
      ? compositeDecorator
      : null;
    const editorState = EditorState.set(this.state.editorState, { decorator });
    this.setState({ editorState, decoratorOn: !this.state.decoratorOn });
  };

  render() {
    return (
      <div
        className="wrapper"
        onClick={this.props.setActiveEditor}
      >
        {this.props.isActive && <div className="sidebar">
          <button onClick={this.toggleDecorators}>
            Toggle Decorator {this.state.decoratorOn ? 'on' : 'off'}
          </button>
          <PlaceholderDashboard
            placeholders={this.state.placeholders}
            onChange={this.updatePlaceholder}
            replaceEntities={this.replaceEntities}
            addPlaceholder={this.addPlaceholder}
            removePlaceholder={this.removePlaceholder}
            applyPlaceholder={this.applyPlaceholder}
          />
        </div>
        }
        <div className="editor-wrapper">
          <div>
            <h2 className="editor-header">Editor {this.props.editorKey}</h2>
            <div
              className="editor"
              onClick={this.focus}
            >
              <Editor
                ref={this.setDomEditorRef}
                editorState={this.state.editorState}
                onChange={this.onChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      activeEditor: 1,
    };
  }

  setActiveEditor = id => () => {
    if (id === this.state.activeEditor) return;
    this.setState({ activeEditor: id });
  };

  render() {
    const placeholders1 = [
      createPlaceholder('chance', 'Could'),
      createPlaceholder('product', 'Green Coffee'),
      createPlaceholder('goal', 'running faster'),
    ];

    const chance = createPlaceholderEntity(placeholders1[0]);
    const product = createPlaceholderEntity(placeholders1[1]);
    const goal = createPlaceholderEntity(placeholders1[2]);
    const existing = createPlaceholderEntity(createPlaceholder(
      'existing',
      'already existing and not in placholders')
    );

    const editorState1 = new RawContentState()
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
      .addBlock('x')
      .addEntity(existing, 0, 3)
      .toEditorState(compositeDecorator);

    const placeholders2 = [
      createPlaceholder('chance', 'Will'),
      createPlaceholder('product', 'Garcinia Extreme'),
      createPlaceholder('goal', 'loosing weight'),
    ];

    const chance2 = createPlaceholderEntity(placeholders1[0]);
    const product2 = createPlaceholderEntity(placeholders1[1]);
    const goal2 = createPlaceholderEntity(placeholders1[2]);
    const existing2 = createPlaceholderEntity(createPlaceholder(
      'existing',
      'already existing and not in placholders')
    );

    const editorState2 = new RawContentState()
      .addBlock('May Help With', 'header-two')
      .addEntity(chance2, 0, 3)
      .addBlock('goal', 'header-two')
      .addEntity(goal2, 0, 4)
      .addBlock('BL Demo Product is a triple-threat natural health supplement.')
      .addEntity(product2, 0, 15)
      .addBlock('In conjunction with a lower calorie diet and regular exercise, BL Demo Product may be just what you need.')
      .addEntity(product2, 63, 15)
      .addBlock('May Manage Stress', 'unordered-list-item')
      .addEntity(chance2, 0, 3)
      .addBlock('May Suppress Appetite', 'unordered-list-item')
      .addEntity(chance2, 0, 3)
      .addBlock('May Improve Vitality And Energy', 'unordered-list-item')
      .addEntity(chance2, 0, 3)
      .addBlock('x')
      .addEntity(existing2, 0, 3)
      .toEditorState(compositeDecorator);
    return (
      <div>
        <div className="content">
          <MyEditor
            editorKey={1}
            setActiveEditor={this.setActiveEditor(1)}
            isActive={this.state.activeEditor === 1}
            editorState={editorState1}
            placeholders={placeholders1}
          />
          <MyEditor
            editorKey={2}
            setActiveEditor={this.setActiveEditor(2)}
            isActive={this.state.activeEditor === 2}
            editorState={editorState2}
            placeholders={placeholders2}
          />
          <MyEditor
            editorKey={3}
            setActiveEditor={this.setActiveEditor(3)}
            isActive={this.state.activeEditor === 3}
            editorState={editorState1}
            placeholders={placeholders1}
          />
          <MyEditor
            editorKey={4}
            setActiveEditor={this.setActiveEditor(4)}
            isActive={this.state.activeEditor === 4}
            editorState={editorState2}
            placeholders={placeholders2}
          />
          <MyEditor
            editorKey={5}
            setActiveEditor={this.setActiveEditor(5)}
            isActive={this.state.activeEditor === 5}
            editorState={editorState1}
            placeholders={placeholders1}
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.querySelector('.container'));
