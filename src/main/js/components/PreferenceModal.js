import React, {Component} from 'react';
import Config from 'Config';
import {getCookie, sha256, getAccessToken, getUUID} from '../utils/Utils';

export default class PreferenceModal extends Component {
	
	constructor() {
		super();
		this.state = {
			errMsg: '',
			curPassword: '',
			newPassword: '',
			confirmPassword: '',
			changingPwd: false,
			manageErrMsg: '',
			managingUser: false,
			userList: [],
			newUserList: [],
			showNoUserMsg: false
	    };
	}
	
	changePassword = () => {
		let newPwd = this.state.newPassword.trim()
		let confirmPwd = this.state.confirmPassword.trim()
		const that = this
		
		if (newPwd == '') {
			this.setState({errMsg: 'New password cannot be empty'})
		} else if (newPwd != confirmPwd) {
			this.setState({errMsg: 'The two new passwords do not match'})
		} else {
			this.setState({errMsg: '', changingPwd: true})
			
			fetch(window.location.href + 'api/change_password', {
				method: 'POST',
				headers: {
			    	'Accept': 'application/json',
			    	'Content-Type': 'application/json'
			    },
			    body: JSON.stringify({username : getCookie(Config.usernameCookieKey), previousHashcode: sha256(this.state.curPassword), newHashcode: sha256(newPwd)})
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
		}
	}
	
	loadUserList = () => {
		if (getCookie(Config.adminCookieKey) == "true") {
			const that = this
			this.setState({managingUser: true, manageErrMsg: '', userList: [], newUserList: []})
			fetch(window.location.href + 'api/get_user_list', {
				method: 'POST',
				headers: {
			    	'Accept': 'application/json',
			    	'Content-Type': 'application/json',
			    	'Authorization': getAccessToken(),
			    	'Identity': getCookie(Config.usernameCookieKey)
			    },
			    body: JSON.stringify({})
			})
			.then(function (response) {
				if (response.status == 200) {
					response.json().then(function(json) {
						if (json.error == '') {
							that.setState({ managingUser: false, manageErrMsg: '', userList: json.userList});
						} else {
							that.setState({ managingUser: false, manageErrMsg: json.error });
						}
					})
				} else {
					that.setState({ managingUser: false, manageErrMsg: 'Internal server error. Please try again later' });
				}
			});
		}
	}
	
	cancelBtnHandler = () => {
		this.setState({errMsg: '', manageErrMsg: '', userList: [], newUserList: []});
		$('#preferenceModal').modal('hide');
	}
	
	updateUsername = (user, newUsername) => {
		let index = this.state.newUserList.findIndex((u) => {
			return u.key == user.key
		});
		
		if (index != -1) {
			user.username = newUsername
			let newNewUserList = this.state.newUserList.slice()
			newNewUserList[index] = user
			
			this.setState({
				newUserList: newNewUserList
			});
		}
	}
	
	updatePassword = (user, newPassword) => {
		if (typeof user.key != "undefined") {
			let index = this.state.newUserList.findIndex((u) => {
				return u.key == user.key
			});
			
			if (index != -1) {
				user.password = newPassword
				let newNewUserList = this.state.newUserList.slice()
				newNewUserList[index] = user
				
				this.setState({ newUserList: newNewUserList });
			}
		} else {
			let index = this.state.userList.findIndex((u) => {
				return u.username == user.username
			});
			
			if (index != -1) {
				user.password = newPassword
				let newUserList = this.state.userList.slice()
				newUserList[index] = user
				
				this.setState({ userList: newUserList });
			}
		}
	}
	
	deleteUser = (user) => {
		if (typeof user.key != "undefined") {
			let index = this.state.newUserList.findIndex((u) => {
				return u.key == user.key
			});
			
			if (index != -1) {
				let newNewUserList = this.state.newUserList.slice()
				newNewUserList.splice(index, 1);
				this.setState({ newUserList: newNewUserList });
			}
		} else {
			let index = this.state.userList.findIndex((u) => {
				return u.username == user.username
			});
			
			if (index != -1) {
				let newUserList = this.state.userList.slice()
				newUserList.splice(index, 1);
				this.setState({ userList: newUserList });
			}
		}
	}
	
	addUser = () => {
		this.setState({manageErrMsg: ''})
		let index = this.state.newUserList.findIndex((u) => {
			return u.username.trim() == ''
		});
		
		if (index == -1) {
			let newNewUserList = this.state.newUserList.slice()
			newNewUserList.push({username: '', password: '', key: getUUID() })
			this.setState({
				newUserList: newNewUserList
			});
		} else {
			this.setState({manageErrMsg: 'Please fill in the empty user first before adding a new one'})
		}
	}
	
	saveUserChanges = () => {
		this.setState({manageErrMsg: ''})
		
		let newUsernames = []
		for (let user of this.state.newUserList) {
			if (user.username.trim() == '' || user.password.trim() == '') {
				this.setState({manageErrMsg: 'Username and password for new users must not be empty.'})
				return
			}
			let existingIndex = this.state.userList.findIndex((u) => { return u.username == user.username });
			let newIndex = newUsernames.indexOf(user.username)
			if (existingIndex != -1 || newIndex != -1) {
				this.setState({manageErrMsg: 'Username has to be unique. User with username "' + user.username + '" appears more than once'})
				return
			}
			newUsernames.push(user.username)
		}
		
		this.setState({managingUser: true})
		const that = this
		
		this.encodePasswords(this.state.userList)
		this.encodePasswords(this.state.newUserList)
		
		fetch(window.location.href + 'api/update_user_list', {
			method: 'POST',
			headers: {
		    	'Accept': 'application/json',
		    	'Content-Type': 'application/json',
		    	'Authorization': getAccessToken(),
		    	'Identity': getCookie(Config.usernameCookieKey)
		    },
		    body: JSON.stringify({existingUsers: that.state.userList, newUsers: that.state.newUserList})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						that.setState({ managingUser: false, manageErrMsg: ''});
						$('#preferenceModal').modal('hide');
					} else {
						that.setState({ managingUser: false, manageErrMsg: json.error });
					}
				})
			} else {
				that.setState({ managingUser: false, manageErrMsg: 'Internal server error. Please try again later' });
			}
		});
	}
	
	encodePasswords = (userList) => {
	    for (let user of userList) {
	    	if (user.password != '') {
		    	user.password = sha256(user.password)
	    	}
	    }
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
										<button type="button" className="btn btn-success float-right mr-2" onClick={this.changePassword} >Save</button>
									)}
									
								</div>
							</div>
							
							{(() => {
								if (getCookie(Config.adminCookieKey) == "true") {
									return(
										<>
											<hr></hr>
											<div className="row">
												<div className="col-12">
													<p>Manage Users</p>
												</div>
												
												<div className={this.state.manageErrMsg == "" ? "d-none" : "col-12"}>
													<div className="alert alert-danger" role="alert">
														{this.state.manageErrMsg}
													</div>
												</div>
												
												<div className={this.state.userList.length == 0 && this.state.newUserList.length == 0 ? "col-12" : "d-none"}>
													<div className="alert alert-success" role="alert">
														No users found other than the master user. Click on the Add User button below to create new user accounts.
													</div>
												</div>
												
												{this.state.userList.map(user =>
													<div className="col-12 my-1" key={user.username}>
														<div className="input-group">
														  <input type="text" className="form-control" placeholder="Username" value={user.username} readOnly></input>
														  <input type="password" className="form-control " placeholder="Password" value={user.password}
															  onChange={(e) => this.updatePassword(user, e.target.value)}></input>
														    <div className="input-group-append">
														    	<button className="btn btn-outline-danger" type="button" onClick={() => this.deleteUser(user) }>Delete</button>
														    </div>
														</div>
													</div>
												)}
												
												{this.state.newUserList.map(user =>
													<div className="col-12 my-1" key={user.key}>
														<div className="input-group">
														  <input type="text" className="form-control" placeholder="Username" onChange={(e) => this.updateUsername(user, e.target.value)}></input>
														  <input type="password" className="form-control " placeholder="Password" onChange={(e) => this.updatePassword(user, e.target.value)}></input>
														    <div className="input-group-append">
														    	<button className="btn btn-outline-danger" type="button" onClick={() => this.deleteUser(user) }>Delete</button>
														    </div>
														</div>
													</div>
												)}
												
												
											</div>
											
											<hr></hr>
											<div className="row">
												<div className="col-12">
													<button type="button" className={this.state.managingUser? "btn btn-secondary float-right disabled" : "btn btn-secondary float-right"} onClick={this.cancelBtnHandler}>Cancel</button>
													{this.state.managingUser ? (
														<button type="button" className="btn btn-secondary float-right mr-2 disabled"> <span className="fa fa-refresh fa-spin fa-1x fa-fw"></span></button>
													): (
														<button type="button" className="btn btn-success float-right mr-2" onClick={this.saveUserChanges} >Save</button>
													)}
													<button type="button" className={this.state.managingUser? "btn btn-success float-right mr-2 disabled" : "btn btn-success float-right mr-2"}
														onClick={this.addUser }>Add User</button>
												</div>
											</div>
										</>
									)
								}
							})()}
							
							
							
						</div>
					</div>
				</div>
			</div>
		)
	}
	
}