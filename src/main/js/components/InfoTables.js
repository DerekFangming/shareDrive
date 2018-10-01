import React, {Component} from 'react';

class InfoTables extends Component {
	render () {
		return (
			<div className="col-md-4">
				<div className="card my-4">
					<h5 className="card-header">Storage</h5>
					<div className="card-body">
						<p className="card-text">400 GB of 600 GB used</p>
						<div className="progress">
							<div className="progress-bar" role="progressbar" style={{width:'25%'}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
						</div>
					</div>
				</div>
				<div className="card my-4">
					<h5 className="card-header">Categories</h5>
					<div className="card-body">
						<div className="row">
							<div className="col-lg-6">
								<ul className="list-unstyled mb-0">
									<li>
										<a href="#">Web Design</a>
									</li>
									<li>
										<a href="#">HTML</a>
									</li>
									<li>
										<a href="#">Freebies</a>
									</li>
								</ul>
							</div>
							<div className="col-lg-6">
								<ul className="list-unstyled mb-0">
									<li>
										<a href="#">JavaScript</a>
									</li>
									<li>
										<a href="#">CSS</a>
									</li>
									<li>
										<a href="#">Tutorials</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default InfoTables;
