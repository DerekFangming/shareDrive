import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate, numberWithCommas} from '../utils/Utils'

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
	
	fileClickHandler = (clickedFile) => {
		this.setState({
			file: clickedFile
		})
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
					<h5 className="card-header">File Details</h5>
					{this.state.file == undefined ? (
						<div className="card-body">
							<div className="row">
								<div className="col">
									<p className="card-text">Please select a file</p>
								</div>
							</div>
						</div>
					) : (
						<div className="card-body">
							<div className="row mb-1">
								<div className="col-lg-3">
									<p className="card-text">File name</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{this.state.file.name}</p>
								</div>
							</div>
							
							<div className="row my-1">
								<div className="col-lg-3">
									<p className="card-text">Type</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">Something</p>
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3">
									<p className="card-text">Size</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{convertSize(this.state.file.size) + '  (' + numberWithCommas(this.state.file.size) + ' Bytes)'}</p>
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3">
									<p className="card-text">location</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{this.state.file.path}</p>
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3">
									<p className="card-text">Modified</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{convertDate(this.state.file.lastModified)}</p>
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3">
									<p className="card-text">Created</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{convertDate(this.state.file.created)}</p>
								</div>
							</div>
							
						</div>
					)}
						
						
					
				</div>
				
			</div>
		);
	}
}

export default InfoTables;

