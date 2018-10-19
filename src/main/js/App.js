import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Header from './components/Header';
import Container from './components/Container';

class App extends Component {
	
	constructor() {
		super();
		this.header = React.createRef();
		this.container = React.createRef();
	}
	
	updateSearchPathHandler = (file) => {
		this.header.current.updateSearchPathHandler(file);
	}
	
	render () {
		return (
			<div>
				<Header ref={this.header} />
				<Container ref={this.container} updateSearchPathHandler={this.updateSearchPathHandler} />
			</div>
		);
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('react')
)

