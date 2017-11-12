import { expect } from 'chai';
import { RawContentState } from 'draft-js-raw-content-state';
import {
  createPlaceholderEntity,
  findPlaceholderRanges,
  replacePlaceholders,
  createPlaceholder,
} from '../src';

describe('replacePlaceholders', () => {
  const mentions = [
    createPlaceholder('firstName', 'Luis'),
    createPlaceholder('lastName', 'Betancourt'),
    createPlaceholder('job', 'programmer'),
  ];

  const entity1 = createPlaceholderEntity(createPlaceholder('firstName', 'Cristian'));
  const entity2 = createPlaceholderEntity(createPlaceholder('lastName', 'Graziano'));
  const entity3 = createPlaceholderEntity(createPlaceholder('job', 'student'));

  it('should return a new editorState', () => {
    const editorState = new RawContentState()
      .addBlock('Cristian Graziano student')
      // .addBlock('Luis Betancourt Programmer')
      .addEntity(entity1, 0, 8)
      // 0, 4
      // diff = 4
      .addEntity(entity2, 9, 8)
      // 5, 10
      .addEntity(entity3, 18, 7)
      // 10, 10
      .toEditorState();

    const newEditorState = replacePlaceholders(editorState, mentions);
    const blockText = newEditorState.getCurrentContent().getFirstBlock().getText();
    expect(blockText).to.equal('Luis Betancourt programmer');
  });

  it('should inherit the inline styles of the first entity char on each replacement', () => {
    const editorState = new RawContentState()
      .addBlock('Cristian Graziano student')
      .addEntity(entity1, 0, 8)
      .addInlineStyle(['COLOR_RED'], 0, 8)
      .addEntity(entity2, 9, 8)
      .addEntity(entity3, 18, 7)
      .toEditorState();

    const newEditorState = replacePlaceholders(editorState, mentions);
    const color = newEditorState
      .getCurrentContent()
      .getFirstBlock()
      .getInlineStyleAt(0);
    expect(color.toJS()).to.deep.equal(['COLOR_RED']);
  });

  it('Should find placeholder ranges', () => {
    const editorState = new RawContentState()
      .addBlock('Cristian Graziano student')
      .addEntity(entity1, 0, 8)
      .addEntity(entity2, 9, 8)
      .addEntity(entity3, 18, 7)
      .toEditorState();

    let ranges = findPlaceholderRanges(
      editorState.getCurrentContent().getFirstBlock(),
      editorState.getCurrentContent()
    );

    expect(ranges.length).to.equal(3);
  });
});
