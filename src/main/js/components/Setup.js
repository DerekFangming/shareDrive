import React, {Component} from 'react';
import Config from 'Config';
import {sha256} from '../utils/Utils';

export default class Setup extends Component {
	
	constructor() {
	    super();
	    this.state = {
    		username: '',
    		pwd: '',
    		pwdConfirm: '',
    		path: '',
	    	errMsg: '',
	    	sendingSetup: false
	    };
	}
	
	submitSetup = () => {
		if (this.state.username.trim() != this.state.username || this.state.pwd.trim() != this.state.pwd) {
    		this.setState({errMsg: "Username and password cannot start or end with space"})
    	} else if (this.state.username.trim() == "" || this.state.pwd.trim() == "") {
        	this.setState({errMsg: "Username and password cannot be empty"})
    	} else if (this.state.pwd != this.state.pwdConfirm) {
        	this.setState({errMsg: "The two passwords are not matching"})
        } else if (this.state.path.trim() == "") {
        	this.setState({errMsg: "Path cannot be empty"})
        } else {
        	this.setState({ errMsg: '', sendingSetup: true })
        	let homeDir = this.state.path.replace(/\\/g,"/");
        	const that = this
        	
        	fetch(window.location.href + 'api/initial_setup', {
    			method: 'POST',
    		    headers: {
    		    	'Accept': 'application/json',
    		    	'Content-Type': 'application/json'
    		    },
    		    body: JSON.stringify({username : this.state.username, password: sha256(this.state.pwd), homeDir: homeDir})
    		})
    		.then(function (response) {
    			if (response.status == 200) {
    				response.json().then(function(json) {
    					if (json.error == '') {
    						document.cookie = Config.setupCookieKey + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    						location.reload();
    					} else {
    						that.setState({errMsg: json.error, sendingSetup: false})
    					}
    				})
    				
    			} else {
    				that.setState({errMsg: "Internal server error. Please try again later", sendingSetup: false})
    			}
    		});
        }
		
	}
	
	render () {
		return (
			<div className="container">
				<div className="row mt-5 justify-content-center">
					<div className="col-12 col-md-2 col-lg-3">
					</div>
					<div className="col-12 col-md-8 col-lg-6">
						<form>
							<h1 className="font-weight-light mt-3 mb-5">Initial setup</h1>
							<div className={this.state.errMsg == "" ? "d-none" : "alert alert-danger"} role="alert">
								{this.state.errMsg}
							</div>
							
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">The username of the admin account.</p>
					            <input type="text" className="form-control" placeholder="Admin's username"
					            	onChange={(e) => this.setState({username: e.target.value})}></input>
					        </div>
			
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">The password of the admin account.</p>
					        	<input type="password" className="form-control" placeholder="Admin's password"
					            	onChange={(e) => this.setState({pwd: e.target.value})}></input>
					        </div>
					        
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">Confirm password.</p>
					        	<input type="password" className="form-control" placeholder="Confirm admin's password"
					            	onChange={(e) => this.setState({pwdConfirm: e.target.value})}></input>
					        </div>
					        
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">The path on your hard drive that you want to share. For example, D:/share/</p>
					        	<input type="text" className="form-control" placeholder="Root path"
					            	onChange={(e) => this.setState({path: e.target.value})}></input>
					        </div>

					        {this.state.sendingSetup ? (
					        	<button type="button" className="btn btn-primary mt-4 btn-block disabled"><span className="fa fa-refresh fa-spin fa-1x fa-fw"></span></button>
					        ) : (
					        	<button type="button" className="btn btn-primary mt-4 btn-block" onClick={this.submitSetup} >Submit</button>
					        )}
							
					    </form>
					</div>
					<div className="col-12 col-md-2 col-lg-3">
					</div>
				</div>
			</div>
		)
	}
}