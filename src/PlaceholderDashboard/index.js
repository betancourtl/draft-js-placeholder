import React from 'react';
import './styles.css';

const Placeholder = props => {
  return (
    <div className="input-group">
      <div className="input-control">
        <label>name:</label>
        <input
          type="text"
          defaultValue={props.name}
          disabled
        />
      </div>
      <div className="input-control">
        <label>value:</label>
        <input
          type="text"
          onChange={e => props.onChange(e.target.value)}
          onKeyDown={e => e.keyCode === 13 && props.onEnter()}
          value={props.value}
        />
      </div>
      <div className="button-group">
        <button
          className="button-add"
          onClick={() => props.applyPlaceholder(props.name, props.value)}
        >
          Add
        </button>
        <button
          className="button-remove"
          onClick={() => props.removePlaceholder(props.name)}
        >
          Remove
        </button>
      </div>
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
        <div className="input-group">
          <label>Add Placeholder</label>
          <input
            type="text"
            value={this.state.value}
            onChange={e => this.setState({ name: e.target.value })}
            onKeyDown={
              e => e.keyCode === 13 && this.props.addPlaceholder(this.state.name)}
          />
          <div className="button-group">
            <button
              className="button-add"
              onClick={() => this.props.addPlaceholder(this.state.name)}
            >
              Add
            </button>
          </div>
        </div>
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
      </div>
    );
  }
}

export default PlaceholderDashboard;
