import React from 'react';
import './styles.css';

const Placeholder = props => {
  return (
    <div>
      <input
        type="text"
        defaultValue={props.name}
        disabled
      />
      <input
        type="text"
        onChange={e => props.onChange(e.target.value)}
        onKeyDown={e => e.keyCode === 13 && props.onEnter()}
        value={props.value}
      />
      <button onClick={() => props.applyPlaceholder(props.name, props.value)}>
        Add
      </button>
      <button onClick={() => props.removePlaceholder(props.name)}>
        Remove
      </button>
    </div>
  );
};

class PlaceholderDashboard extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
    };
  }

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
                applyPlaceholder={this.props.applyPlaceholder}
                removePlaceholder={this.props.removePlaceholder}
                key={i}
                name={item.name}
                value={item.value}
              />
            );
          })
        }
        <div>
          <input
            type="text"
            value={this.state.value}
            onChange={e => this.setState({ name: e.target.value })}
            onKeyDown={e => e.keyCode === 13 && this.props.addPlaceholder(this.state.name)}
          />
          <button
            onClick={() => this.props.addPlaceholder(this.state.name)}
          >
            Add Placeholder
          </button>
        </div>
      </div>
    );
  }
}

export default PlaceholderDashboard;
