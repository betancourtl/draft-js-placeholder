import React from 'react';
import './styles.css';

const Placeholder = props => {
  return (
    <div>
      <input
        type="text"
        defaultValue={props.name}
      />
      <input
        type="text"
        onChange={e => props.onChange(e.target.value)}
        onKeyDown={e => e.keyCode === 13 && props.onEnter()}
        value={props.value}
      />
    </div>
  );
};

class PlaceholderDashboard extends React.Component {
  render() {
    const { placeholders } = this.props;
    return (
      <div className="placeholder-dashboard">
        {
          placeholders.map((item, i) => {
            return (
              <Placeholder
                onChange={this.props.onChange(i)}
                onEnter={this.props.replaceEntities}
                key={i}
                name={item.name}
                value={item.value}
              />
            );
          })
        }
        <button onClick={this.props.replaceEntities}>
          replace entities
        </button>
        <button onClick={() => this.props.addPlaceholder()}>
          Add Placeholder
        </button>
      </div>
    );
  }
}

export default PlaceholderDashboard;
