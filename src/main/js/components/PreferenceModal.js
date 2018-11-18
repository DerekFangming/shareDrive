import React, {Component} from 'react';

export default class PreferenceModal extends Component {
	
	constructor() {
		super();
		this.state = {
	    };
		
	}
	
	render () {
		return (
			<div className="modal fade" id="preferenceModal" tabIndex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">Preference</h5>
							<button type="button" className="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
							</button>
						</div>
						
						<div className="modal-body">
							<div className="row">
								<div className="col-12">
									<p>Change Password</p>
								</div>
								<div className="col-12">
									<div className="input-group mb-3">
										<div className="input-group-prepend">
											<span className="input-group-text pr-5" id="inputGroup-sizing-default">Current Password</span>
										</div>
										<input type="password" className="form-control"></input>
									</div>
								</div>
								<div className="col-12">
								<div className="input-group mb-3">
									<div className="input-group-prepend">
										<span className="input-group-text pr-5" id="inputGroup-sizing-default">New Password <span className="pr-4"></span></span>
									</div>
									<input type="password" className="form-control" ></input>
								</div>
							</div>
							<div className="col-12">
							<div className="input-group mb-3">
								<div className="input-group-prepend">
									<span className="input-group-text" id="inputGroup-sizing-default">Confirm New Password</span>
								</div>
								<input type="password" className="form-control" ></input>
							</div>
						</div>
							</div>
						</div>
						
						<div className="modal-footer">
							<button type="button" className="btn btn-success" data-dismiss="modal" >Move</button>
							<button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
						</div>
					</div>
				</div>
			</div>
		)
	}
	
}