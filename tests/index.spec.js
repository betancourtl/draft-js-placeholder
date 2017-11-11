import { expect } from 'chai';
import { RawContentState } from 'draft-js-raw-content-state';
import {
  createPlaceholderEntity,
  replacePlaceholders,
  createPlaceholder,
} from '../src';

describe('replacePlaceholdersDataWith', () => {
  const mentions = [
    createPlaceholder('firstName', 'Luis'),
    createPlaceholder('lastName', 'Betancourt'),
  ];

  const entity1 = createPlaceholderEntity(createPlaceholder('firstName', 'Cristian'));
  const entity2 = createPlaceholderEntity(createPlaceholder('lastName', 'Graziano'));
  const editorState = new RawContentState()
    .addBlock('Cristian Graziano')
    .addEntity(entity1, 0, 8)
    .addEntity(entity2, 9, 17)
    .toEditorState();

  it('should return a new editorState', () => {
    const newEditorState = replacePlaceholders(editorState, mentions);
    const blockText = newEditorState.getCurrentContent().getFirstBlock().getText();
    expect(blockText).to.equal('Luis Betancourt');
  });
});
