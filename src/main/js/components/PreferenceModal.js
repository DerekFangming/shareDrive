import React, {Component} from 'react';
import Config from 'Config';
import {getCookie, sha256} from '../utils/Utils';

export default class PreferenceModal extends Component {
	
	constructor() {
		super();
		this.state = {
			errMsg: '',
			curPassword: '',
			newPassword: '',
			confirmPassword: '',
			changingPwd: false
	    };
	}
	
	updatePassword = () => {
		let newPwd = this.state.newPassword.trim()
		let confirmPwd = this.state.confirmPassword.trim()
		const that = this
		
		if (newPwd == '') {
			this.setState({errMsg: 'New password cannot be empty'})
		} else if (newPwd != confirmPwd) {
			this.setState({errMsg: 'The two new passwords do not match'})
		} else {
			this.setState({errMsg: '', changingPwd: true})
			
			sha256(this.state.curPassword).then(function (hashedCurPassword) {
				sha256(newPwd).then(function (hashedNewPassword) {
					fetch(window.location.href + 'api/change_password', {
						method: 'POST',
						headers: {
					    	'Accept': 'application/json',
					    	'Content-Type': 'application/json'
					    },
					    body: JSON.stringify({username : getCookie(Config.usernameCookieKey), previousHashcode: hashedCurPassword.toUpperCase(), newHashcode: hashedNewPassword.toUpperCase()})
					})
					.then(function (response) {
						if (response.status == 200) {
							response.json().then(function(json) {
								if (json.error == '') {
									that.setState({ changingPwd: false, errMsg: '' });
									$('#preferenceModal').modal('hide');
								} else {
									that.setState({ changingPwd: false, errMsg: json.error });
								}
							})
						} else {
							that.setState({ changingPwd: false, errMsg: 'Internal server error. Please try again later' });
						}
					});
				})
			})
		}
	}
	
	loadUserList = () => {
		console.log(1)
	}
	
	cancelBtnHandler = () => {
		this.setState({errMsg: ''});
		$('#preferenceModal').modal('hide');
	}
	
	render () {
		return (
			<div className="modal fade" id="preferenceModal" tabIndex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">Preference</h5>
							<button type="button" className="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
							</button>
						</div>
						
						<div className="modal-body">
							<div className={this.state.errMsg == "" ? "d-none" : "row"}>
								<div className="col-12">
									<div className="alert alert-danger" role="alert">
										{this.state.errMsg}
									</div>
								</div>
							</div>
							<div className="row">
								<div className="col-12">
									<p>Change Password</p>
								</div>
								<div className="col-12">
									<div className="input-group mb-3">
										<div className="input-group-prepend">
											<span className="input-group-text pr-5" id="inputGroup-sizing-default">Current Password</span>
										</div>
										<input type="password" className="form-control" onChange={(e) => this.setState({curPassword: e.target.value}) }></input>
									</div>
								</div>
								<div className="col-12">
									<div className="input-group mb-3">
										<div className="input-group-prepend">
											<span className="input-group-text pr-5" id="inputGroup-sizing-default">New Password <span className="pr-4"></span></span>
										</div>
										<input type="password" className="form-control" onChange={(e) => this.setState({newPassword: e.target.value}) }></input>
									</div>
								</div>
								<div className="col-12">
									<div className="input-group mb-3">
										<div className="input-group-prepend">
											<span className="input-group-text" id="inputGroup-sizing-default">Confirm New Password</span>
										</div>
										<input type="password" className="form-control" onChange={(e) => this.setState({confirmPassword: e.target.value}) }></input>
									</div>
								</div>
							</div>
							
							<hr></hr>
							<div className="row">
								<div className="col-12">
									<button type="button" className={this.state.changingPwd? "btn btn-secondary float-right disabled" : "btn btn-secondary float-right"} onClick={this.cancelBtnHandler}>Cancel</button>
									{this.state.changingPwd ? (
											<button type="button" className="btn btn-secondary float-right mr-2 disabled"> <span className="fa fa-refresh fa-spin fa-1x fa-fw"></span></button>
									): (
											<button type="button" className="btn btn-success float-right mr-2" onClick={this.updatePassword} >Save</button>
									)}
									
								</div>
							</div>
							
							<hr></hr>
							<div className="row">
								<div className="col-12">
									<p>Manage Users</p>
								</div>
								<div className="col-12 my-1">
									<div className="input-group">
									  <input type="text" className="form-control" placeholder="Username"></input>
									  <input type="password" className="form-control " placeholder="Password"></input>
									    <div className="input-group-append">
									    	<button className="btn btn-outline-danger" type="button">Delete</button>
									    </div>
									</div>
								</div>
							</div>
							
							
						</div>
					</div>
				</div>
			</div>
		)
	}
	
}