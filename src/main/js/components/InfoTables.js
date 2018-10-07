import React, {Component} from 'react';
import Config from 'Config';
import {convertSize} from '../utils/Utils'

class InfoTables extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	totalSize: 0,
	    	availableSize: 0,
	    	ratio: '0'
	    };
	}
	
	componentDidMount() {
		var that = this;
		
		fetch(Config.serverUrl + 'get_drive_status')
		.then(function (response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function (data) {
			let ratioString = ((data.totalSize - data.availableSize) * 100 / data.totalSize).toFixed(2);;
			that.setState({
				totalSize: data.totalSize,
				availableSize: data.availableSize,
		    	ratio: ratioString
			});
		});
	}
	
	render () {
		return (
			<div className="col-md-3">
				<div className="card my-4">
					<h5 className="card-header">Storage</h5>
					<div className="card-body">
						<p className="card-text">
							{convertSize(this.state.availableSize)} free of {convertSize(this.state.totalSize)}
						</p>
						<div className="progress">
							<div className="progress-bar" role="progressbar" style={{width:`${this.state.ratio + '%'}`}} aria-valuenow={this.state.ratio} aria-valuemin="0" aria-valuemax="100">{this.state.ratio} %</div>
						</div>
					</div>
				</div>
				<div className="card my-4 sticky-top">
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

