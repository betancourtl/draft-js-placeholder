import React from 'react';
import { EditorState, convertToRaw, Modifier, SelectionState } from 'draft-js';
import getRangesForDraftEntity from 'draft-js/lib/getRangesForDraftEntity';

// TODO: [] create a decorator component
// TODO: [] create a placeholder interface

const PLACEHOLDER_TYPE = 'placeholder';
const PLACEHOLDER_MUTABILITY = 'IMMUTABLE';

export const logRaw = editorState => {
  const raw = convertToRaw(editorState.getCurrentContent());
  console.log(JSON.stringify(raw, null, 2));
};

export const createPlaceholderEntity = (data = {}) => ({
  type: PLACEHOLDER_TYPE,
  mutability: PLACEHOLDER_MUTABILITY,
  data: {
    placeholder: createPlaceholder(data.name, data.value),
  },
});

export const createPlaceholder = (name, value) => ({
  name,
  value,
});

export const replacePlaceholder = (
  contentState,
  placeholders = [],
  char,
) => {
  const key = char.getEntity();

  // no entityKey exist
  if (!key) return { char };

  const data = contentState.getEntity(key).getData();
  const { name, value } = data.placeholder;
  const newData = placeholders.find((item = {}) => name === item.name && item.value !== value);

  // data did not change
  if (!newData) return { char };

  // I think the contentState does not need to be returned because entityMap is not immutable
  contentState.mergeEntityData(key, { placeholder: { ...newData } });
  return { char, replaced: { key, newData } };
};

export const findPlaceholderRanges = (block, contentState) => {
  let ranges = [];
  block.findEntityRanges(char => {
    const entityKey = char.getEntity();
    if (!entityKey) return false;

    return contentState.getEntity(entityKey).getType() === PLACEHOLDER_TYPE;
  }, (start, end) => ranges.push({ start, end }));
  return ranges;
};

export const replacePlaceholders = (editorState, placeholders = []) => {
  const contentState = editorState.getCurrentContent();
  const blockMap = contentState.getBlockMap();
  const newBlocks = blockMap.map(block => {
    let sliceStart = 0;
    let sliceEnd = block.getLength();

    // Get the characters of the current block
    let chars = block.getCharacterList();
    let currentChar;
    let keys = [];
    while (sliceStart < sliceEnd) {
      currentChar = chars.get(sliceStart);
      // returns the new character
      // returns a key only if the data was updated.
      const { char, replaced } = replacePlaceholder(contentState, placeholders, currentChar);
      if (replaced) keys.push(replaced);
      chars = chars.set(sliceStart, char);
      sliceStart += 1;
    }

    // no changed keys return the chars
    if (!keys.length) {
      return block.set('characterList', chars);
    }

    // text needs to be changed.
    const blockKey = block.getKey();
    // for each key replace the text
    const newContentState = keys.reduce((contentState1, replaced) => {
      const { key, newData } = replaced;
      // each of the ranges replace rance with new name;
      const newBlock = contentState1.getBlockForKey(blockKey);
      const ranges = getRangesForDraftEntity(newBlock, key);
      return ranges.reduce((reducedContentState, { start, end }) => {
        const newRange = {
          anchorOffset: start,
          focusOffset: end,
          anchorKey: blockKey,
          focusKey: blockKey,
        };

        return Modifier.replaceText(
          reducedContentState,
          SelectionState.createEmpty(block.getKey).merge(newRange),
          newData.value,
          newBlock.getInlineStyleAt(start),
          key
        );
      }, contentState1);
    }, contentState);

    return newContentState.getBlockForKey(blockKey);
  });

  const newContentState = contentState.merge({
    blockMap: blockMap.merge(newBlocks),
  });

  return EditorState.push(editorState, newContentState, 'apply-entity');
};

export const PlaceholderDecorator = props => {
  return (
    <span
      style={{
        backgroundColor: '#4e4eff',
        color: '#fff',
        borderRadius: '5px',
        padding: '2px',
        margin: '3px',
        display: 'inline-block',
      }}
    >
      {props.children}
    </span>
  );
};

export const findPlaceholderStrategy = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges(
    character => {
      const entityKey = character.getEntity();
      if (!entityKey) {
        return false;
      }

      return contentState.getEntity(entityKey).getType() === PLACEHOLDER_TYPE;
    },
    callback,
  );
};

