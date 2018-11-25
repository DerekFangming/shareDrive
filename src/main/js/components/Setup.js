import React, {Component} from 'react';
import Config from 'Config';
import {sha256, sha} from '../utils/Utils';

export default class Setup extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	errMsg: '',
	    	sendingSetup: false
	    };
	    alert(sha("xie"))
//	    sha256("xie").then(function (hashedPassword) {
//	    	alert(hashedPassword)
//	    })
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
					            <input id="usrname" type="text" className="form-control" placeholder="Admin's username"></input>
					        </div>
			
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">The password of the admin account.</p>
					        	<input id="pwd" type="password" className="form-control" placeholder="Admin's password"></input>
					        </div>
					        
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">Confirm password.</p>
					        	<input id="pwdConfirm" type="password" className="form-control" placeholder="Confirm admin's password"></input>
					        </div>
					        
					        <div className="form-group mb-4">
					        	<p className="font-weight-light mb-0">The path on your hard drive that you want to share. For example, D:/share/</p>
					        	<input id="path" type="text" className="form-control" placeholder="Root path"></input>
					        </div>

					        {this.state.sendingSetup ? (
					        	<button type="button" className="btn btn-primary mt-4 btn-block disabled"><span className="fa fa-refresh fa-spin fa-1x fa-fw"></span></button>
					        ) : (
					        	<button type="button" className="btn btn-primary mt-4 btn-block">Submit</button>
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