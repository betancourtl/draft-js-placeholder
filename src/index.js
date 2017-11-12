import React from 'react';
import {
  EditorState,
  convertToRaw,
  Modifier,
  SelectionState,
  CharacterMetadata,
} from 'draft-js';
import getRangesForDraftEntity from 'draft-js/lib/getRangesForDraftEntity';

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
    [PLACEHOLDER_TYPE]: createPlaceholder(data.name, data.value),
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
  if (!key) return char;

  const data = contentState.getEntity(key).getData();
  const { name, value } = data[PLACEHOLDER_TYPE];
  const newData = placeholders.find((item = {}) => name === item.name && item.value !== value);

  // data did not change
  if (!newData) return char;

  // I think the contentState does not need to be returned because entityMap is not immutable
  contentState.mergeEntityData(key, { [PLACEHOLDER_TYPE]: { ...newData } });
  return char;
};

export const findPlaceholderRanges = (block, contentState) => {
  let ranges = [];
  let key = null;
  block.findEntityRanges(char => {
    const entityKey = char.getEntity();
    if (!entityKey) return false;
    key = entityKey;
    return contentState.getEntity(entityKey).getType() === PLACEHOLDER_TYPE;
  }, (start, end) => ranges.push({ start, end, key }));
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
    while (sliceStart < sliceEnd) {
      currentChar = chars.get(sliceStart);
      // returns the new character
      // returns a key only if the data was updated.
      const char = replacePlaceholder(contentState, placeholders, currentChar);
      chars = chars.set(sliceStart, char);
      sliceStart += 1;
    }

    const ranges = findPlaceholderRanges(block, contentState);

    // no changed keys return the chars
    if (!ranges.length) {
      return block.set('characterList', chars);
    }

    const blockKey = block.getKey();

    const result = ranges.reduce((acc, { start, end, key }) => {
      const contentState1 = acc.contentState;
      const diff = acc.diff;
      const newStart = start - diff;
      const newEnd = end - diff;
      const currentBlock = contentState1.getBlockForKey(blockKey);
      const { value } = contentState1.getEntity(key).getData()[PLACEHOLDER_TYPE];

      const newRange = {
        anchorOffset: newStart,
        focusOffset: newEnd,
        anchorKey: blockKey,
        focusKey: blockKey,
      };

      const selection = SelectionState.createEmpty(blockKey).merge(newRange);

      const inlineStyle = currentBlock.getInlineStyleAt(start);

      const contentState2 = Modifier.replaceText(
        contentState1,
        selection,
        value || ' ', // value us empty
        inlineStyle,
        key
      );

      const newDiff = (newEnd - newStart) - value.length;
      return {
        contentState: contentState2,
        diff: newDiff + acc.diff,
      };
    }, { contentState, diff: 0 });

    return result.contentState.getBlockForKey(blockKey);
  });

  const newContentState = contentState.merge({
    blockMap: blockMap.merge(newBlocks),
  });

  const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity');
  return EditorState.set(newEditorState, { forceSelection: false });
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

export const applyPlaceholderEntityToSelection = (name, value, editorState) => {
  const contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  const startOffset = selection.getStartOffset();
  const startKey = selection.getStartKey();
  const block = contentState.getBlockForKey(startKey);
  const { type, mutability, data } = createPlaceholderEntity(createPlaceholder(name, value));
  const newContentState = contentState.createEntity(type, mutability, data);
  const key = newContentState.getLastCreatedEntityKey();

  // if selection is collapsed
  if (!selection.isCollapsed()) {
    console.log('not collapsed');
    const editorState1 = EditorState.push(
      editorState,
      Modifier.applyEntity(newContentState, selection, key),
      'apply-entity'
    );

    const collapsedSelection = selection.merge({
      anchorKey: startKey,
      focusKey: startKey,
      anchorOffset: selection.getStartOffset(),
      focusOffset: selection.getStartOffset(),
    });

    return EditorState.forceSelection(editorState1, collapsedSelection);
  }

  const entityKey = block.getEntityAt(startOffset)
    || (startOffset !== 0 && block.getEntityAt(startOffset - 1));

  if (!entityKey) {
    console.log('not entity exists');
    return EditorState.push(
      editorState,
      Modifier.applyEntity(newContentState, selection, key),
      'apply-entity'
    );
  }

  const ranges = getRangesForDraftEntity(block, entityKey);
  const range = ranges.find(({ start, end }) => startOffset >= start && startOffset <= end);

  if (range) {
    console.log('range exists');
    const newSelection = selection.merge({
      anchorKey: startKey,
      focusKey: startKey,
      anchorOffset: range.start,
      focusOffset: range.end,
    });

    const newEditorState = EditorState.push(
      editorState,
      Modifier.applyEntity(newContentState, newSelection, key),
      'apply-entity'
    );

    const collapsedSelection = newSelection.merge({
      anchorKey: startKey,
      focusKey: startKey,
      anchorOffset: range.start,
      focusOffset: range.start,
    });

    return EditorState.forceSelection(newEditorState, collapsedSelection);
  }

  console.log('no range exists');
  return EditorState.push(
    editorState,
    Modifier.applyEntity(newContentState, selection, key),
    'apply-entity'
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

export const findBlockPlaceholders = contentState => (acc, block) => {
  let placeholders = {};
  let key = null;
  block.findEntityRanges(char => {
    const entityKey = char.getEntity();
    if (!entityKey) return false;
    key = entityKey;
    return contentState.getEntity(entityKey).getType() === PLACEHOLDER_TYPE;
  }, () => {
    const placeholderData = contentState.getEntity(key).getData()[PLACEHOLDER_TYPE];
    placeholders[placeholderData.name] = placeholderData;
  });

  return { ...acc, ...placeholders };
};

export const findAllPlaceholders = editorState => {
  const contentState = editorState.getCurrentContent();
  const reduceFn = findBlockPlaceholders(contentState);

  const placeholders = contentState
    .getBlockMap()
    .reduce(reduceFn, {});

  return Object
    .keys(placeholders)
    .map(key => placeholders[key]);
};

export const mergePlaceholdersWithExisting = (editorState, placeholders) => {
  const existing = findAllPlaceholders(editorState);

  return existing.reduce((acc, val) => {
    const exists = acc.find(({ name }) => name === val.name);
    if (exists) return acc;
    return acc.concat(val);
  }, placeholders);
};

export const removePlaceholderEntities = (editorState, name) => {
  const contentState = editorState.getCurrentContent();
  const blockMap = contentState.getBlockMap();
  const newBlocks = blockMap.map(block => {
    let sliceStart = 0;
    let sliceEnd = block.getLength();

    // Get the characters of the current block
    let chars = block.getCharacterList();
    let currentChar;
    while (sliceStart < sliceEnd) {
      currentChar = chars.get(sliceStart);
      // returns the new character
      // returns a key only if the data was updated.
      const entityKey = currentChar.getEntity();
      const entityExists = entityKey && contentState.getEntity(entityKey).getData()[PLACEHOLDER_TYPE].name === name;
      console.log('entityExists :\n', entityExists);
      const char = entityExists
        ? CharacterMetadata.applyEntity(currentChar, null)
        : currentChar;
      chars = chars.set(sliceStart, char);
      sliceStart += 1;
    }

    return block.set('characterList', chars);
  });

  const newContentState = contentState.merge({
    blockMap: blockMap.merge(newBlocks),
  });

  const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity');
  return EditorState.set(newEditorState, { forceSelection: false });
};
