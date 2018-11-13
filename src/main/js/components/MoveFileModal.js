import React, {Component} from 'react';
import Config from 'Config';
import {getRequestJsonHeader} from '../utils/Utils'
import {LoadingStatus} from '../utils/Enums';
import folder from '../../resources/static/folder.png';
import ret from '../../resources/static/return.png';

export default class MoveFileModal extends Component {
	
	constructor() {
		super();
		this.state = {
		    	fileList: [],
		    	loadingStatus: LoadingStatus.Loading,
		    	loadingMsg: '',
		    	currentPath: null,
		    	moveToPath: null
	    };
		
	}
	
	loadFolder = (filePath) => {
		this.loadFolder(filePath, false)
	}
	
	loadFolder = (filePath, loadParent) => {
		const that = this
		
		this.setState({
			loadingStatus: LoadingStatus.Loading, moveToPath: filePath
		});
		
		if (filePath == null) {
			if (loadParent) {
				this.setState({
					loadingStatus: LoadingStatus.Error,
					loadingMsg: 'No more parent folder to load'
				});
			}
		}
		
		if (loadParent) {
			let paths = filePath.split("/");
			paths.pop()
			
			filePath = paths.length == 0 ? null : paths.join("/");
		}
		this.setState({
			currentPath: filePath
		});
		
		fetch(Config.serverUrl + 'get_files_in_directory', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify({dir : filePath, loadDirOnly: true})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						json.fileList.sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
						that.setState({
							loadingStatus: LoadingStatus.Loaded,
							fileList: json.fileList
						});
					} else {
						that.setState({
							loadingStatus: LoadingStatus.Error,
							loadingMsg: json.error
						});
					}
				})
				
			} else {
				that.setState({
					loadingStatus: LoadingStatus.Error,
					loadingMsg: 'Internal server error. Please try again later'
				});
			}
		});
		
	}
	
	selectTableRow = (row) => {
		$(row).parent().addClass('selected').siblings().removeClass('selected');
		let path = $(row).parent().attr('path')
		let pathToMove = path
		
		if (path =='.prev') {
			let paths = path.split("/");
			paths.pop()
			pathToMove = paths.length == 0 ? null : paths.join("/");
		}
		
		this.setState({moveToPath: pathToMove})
	}
	
	render () {
		return (
			<div className="modal fade" id="moveFileModal" tabIndex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
				<div className="modal-dialog modal-lg" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="moveFileModalLabel">Select a folder to move to</h5>
							<button type="button" className="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
							</button>
						</div>
						
						<div className="modal-body">
							<table className={this.state.loadingStatus == LoadingStatus.Loaded ? "table table-hover" : "table"}>
								<thead>
									<tr>
										<th>Folder name</th>
									</tr>
								</thead>
								{(() => {
									switch (this.state.loadingStatus) {
									case LoadingStatus.Loading:
										return (
											<tbody>
												<tr>
													<td colSpan="3">
														<div className="row">
															<div className="col-5">
																<span className="fa fa-refresh fa-spin fa-2x fa-fw float-right"></span>
															</div>
															<div className="col-7">
																<h4 className="float-left">Loading ...</h4>
															</div>
														</div>
													</td>
												</tr>
											</tbody>
										)
									case LoadingStatus.Error:
										return (
											<tbody>
												<tr onClick={() => this.loadFolder(this.state.currentPath)}>
													<td className="text-center" colSpan="3">
														<div className="alert alert-warning cursor-pointer" role="alert">
															<h4 className="alert-heading">Error</h4>
															<p>Something went wrong while loading the directory. {this.state.loadingMsg}</p>
															<hr></hr>
															<p><span className="fa fa-refresh fa-1x fa-fw pr-4"></span> Click here to refresh</p>
														</div>
													</td>
												</tr>
											</tbody>
											)
									case LoadingStatus.Loaded:
										return (
											<tbody>
												{(() => {
													if (this.state.currentPath != null) {
														return (
															<tr onClick={ (e) => this.selectTableRow(e.target) } path=".prev"
															onDoubleClick={ () => this.loadFolder(this.state.currentPath, true) }>
																<td>
																	<img src={ret} className='mr-2' width='30' height='30'></img>
																	Return to parent directory
																</td>
															</tr>
														)
													}
												})()}
												{this.state.fileList.map(file =>
													<tr key={file.path + file.name} path={file.path}
														onClick={ (e) => this.selectTableRow(e.target) }
														onDoubleClick={ () => this.loadFolder(file.path) }>
														<td>
															<img src={folder} className='mr-2' width='30' height='30'></img>
															{file.name}
														</td>
													</tr>
												)}
											</tbody>
										)
								}
								})()}
							</table>
						</div>
						
						<div className="modal-footer">
							<button type="button" className="btn btn-success" data-dismiss="modal" onClick={() => this.props.moveSelectedFile(this.state.moveToPath, false)}>Move</button>
							<button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
						</div>
					</div>
				</div>
			</div>
		)
	}
	
}