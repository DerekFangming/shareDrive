import React, {Component} from 'react';
import {getAccessToken} from './utils/Utils';
import Config from 'Config';
import ReactDOM from 'react-dom';
import Header from './components/Header';
import Container from './components/Container';
import BlankHeader from './components/BlankHeader'
import Login from './components/Login'

class App extends Component {
	
	constructor() {
		super();
		let token = getAccessToken()
		this.state= {
			accessToken: token
		}
		this.header = React.createRef();
		this.container = React.createRef();
	}
	
	updateSearchPathHandler = (file) => {
		this.header.current.updateSearchPathHandler(file);
	}
	
	updateSearchResultHandler = (fileList, searchedPathFile) => {
		this.container.current.updateSearchResultHandler(fileList, searchedPathFile);
	}
	
	loginSuccessHanlder = () => {
		let token = getAccessToken()
		if (token != '') {
			this.setState({accessToken: token})
		}
	}
	
	logoutHandler = () => {
		document.cookie = Config.usernameCookieKey + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		document.cookie = Config.passwordCookieKey + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		document.cookie = Config.adminCookieKey + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		
		let token = getAccessToken()
		if (token == '') {
			this.setState({accessToken: ''})
		}
	}
	
	render () {
		return (
			<div>
				{ this.state.accessToken == '' ? (
					<div>
						<BlankHeader />
						<Login loginSuccessHanlder={this.loginSuccessHanlder} />
					</div>
				) : (
					<div>
						<Header ref={this.header} updateSearchResultHandler={this.updateSearchResultHandler} logoutHandler={this.logoutHandler} />
						<Container ref={this.container} updateSearchPathHandler={this.updateSearchPathHandler} />
					</div>
				)}
			</div>
		);
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('react')
)

