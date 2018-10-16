import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Header from './components/Header';
import Container from './components/Container';

class App extends Component {
	render () {
		return (
			<div>
				<Header />
				<Container />
			</div>
		);
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('react')
)

