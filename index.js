// @flow
import React from 'react';
import ReactDOM from 'react-dom';

class Editor extends React.Component {
  render() {
    return (
      <div>
        Hello
      </div>
    );
  }
}

ReactDOM.render(<Editor/>, document.querySelector('.container'));
