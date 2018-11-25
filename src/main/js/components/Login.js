import React, {Component} from 'react';
import Config from 'Config';
import Popover, { ArrowContainer } from 'react-tiny-popover'
import {sha256} from '../utils/Utils';

export default class Login extends Component {

	constructor() {
	    super();
	    this.state = {
	    	loginErrMsg: '',
	    	loginPwd: '',
	    	loginUsr: '',
	    	loggingIn: false
	    };
	}
	
	login = () => {
		this.setState({
			loginErrMsg: '',
	    	loggingIn: true
		})
		
		const that = this
		
		fetch(window.location.href + 'api/login', {
			method: 'POST',
		    headers: {
		    	'Accept': 'application/json',
		    	'Content-Type': 'application/json'
		    },
		    body: JSON.stringify({username: that.state.loginUsr, hashcode : sha256(this.state.loginPwd)})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						that.setState({
							loggingIn: false
						});
						that.props.loginSuccessHanlder();
					} else {
						that.setState({
							loggingIn: false,
							loginErrMsg: json.error
						});
					}
				})
				
			} else {
				that.setState({
					loginErrMsg: 'Internal server error. Please try again later',
			    	loggingIn: false
				});
			}
		});
		
	}

	render () {
		return (
			<div className="container">
				<div className="row mt-5 justify-content-center">
					<div className="col-12 col-md-2 col-lg-4">
					</div>
					<div className="col-12 col-md-8 col-lg-4">
						<form>
					    	<p className="lead mt-5 mb-4">Please login</p>
					        <div className="form-group">
					            <input type="text" className="form-control" placeholder="Username" onChange={(e) => this.setState({loginUsr: e.target.value, loginErrMsg: ''})}></input>
					        </div>
			
					        <div className="form-group">
					        	<Popover isOpen={this.state.loginErrMsg != ''} position={'bottom'} onClickOutside={() => this.setState({loginErrMsg: ''})}
					        	content={({ position, targetRect, popoverRect }) => (
									<ArrowContainer position={position} targetRect={targetRect} popoverRect={popoverRect}
							        	arrowColor={'#F8D7DA'} arrowSize={10}>
										<div className="alert alert-danger py-2" role="alert">
											{this.state.loginErrMsg}
										</div>
									</ArrowContainer>
								)} >
									<input className="form-control" type="password" placeholder="Password" 
										onChange={(e) => this.setState({loginPwd: e.target.value, loginErrMsg: ''})} onKeyPress={(e) => { if (e.key === 'Enter') this.login()} }>
									</input>
						        </Popover>
					        </div>
					        
					        { this.state.loggingIn ? (
								<button type="button" className="btn btn-primary mt-4 btn-block disabled">
									<span className="fa fa-refresh fa-spin fa-1x fa-fw"></span>
								</button>
							) : (
								<button type="button" className="btn btn-primary mt-4 btn-block" onClick={this.login}>Login</button>
							)}
					        
					    </form>
					</div>
					<div className="col-12 col-md-2 col-lg-4">
					</div>
				</div>
			</div>
		)
	}
}

