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

//export default App;

//'use strict';
//
//
//const React = require('react');
//const ReactDOM = require('react-dom');
//const client = require('./client');
//
//class App extends React.Component {
//
//	constructor(props) {
//		super(props);
//		this.state = {employees: []};
//	}
//
//	componentDidMount() {
//		client({method: 'GET', path: '/hello'}).done(response => {
//			this.setState({employees: response.entity});
//		});
//	}
//
//	render() {
//		return (
//			<EmployeeList employees={this.state.employees}/>
//		)
//	}
//}
//
//class EmployeeList extends React.Component{
//	render() {
//		var employees = this.props.employees.map(employee =>
//			<Employee key={employee.id} employee={employee}/>
//		);
//		return (
//			<table>
//				<tbody>
//					<tr>
//						<th>First Name</th>
//						<th>Last Name</th>
//						<th>Description</th>
//					</tr>
//					{employees}
//				</tbody>
//			</table>
//		)
//	}
//}
//
//class Employee extends React.Component{
//	render() {
//		return (
//			<tr>
//				<td>{this.props.employee.firstName}</td>
//				<td>{this.props.employee.lastName}</td>
//				<td>{this.props.employee.description}</td>
//			</tr>
//		)
//	}
//}
//
//ReactDOM.render(
//	<App />,
//	document.getElementById('react')
//)


