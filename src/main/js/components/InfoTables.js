import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate, numberWithCommas, getFileType, keepTwoDigits, getSecretKey, getRequestJsonHeader} from '../utils/Utils';
import Arrow from './Arrow';
import {LoadingStatus} from '../utils/Enums';
import MoveFileModal from './MoveFileModal'

export default class InfoTables extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	totalSize: 0,
	    	availableSize: 0,
	    	ratio: '0',
	    	loadingStatus: LoadingStatus.Loading,
	    	renaming: false,
	    	newName: '',
	    	submittingName: false,
	    	fileErrMsg: '',
	    	loadingFolderSize: false,
	    	moving: false,
	    	deleting: false,
	    	submittingDelete: false
	    };
	    this.moveFileModal = React.createRef();
	}
	
	componentDidMount() {
		this.loadStorageInfo()
	}
	
	loadStorageInfo = () => {
		var that = this;
		
		this.setState({
			loadingStatus: LoadingStatus.Loading
		});
		
		fetch(window.location.href + 'api/get_drive_status', {
			method: "GET",
			headers: {'Authorization': getSecretKey()}
			})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						let ratioString = keepTwoDigits((json.totalSize - json.availableSize) * 100 / json.totalSize);
						that.setState({
							totalSize: json.totalSize,
							availableSize: json.availableSize,
					    	ratio: ratioString,
					    	loadingStatus: LoadingStatus.Loaded
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
	
	showFileDetailsHandler = (clickedFile) => {
		if (clickedFile == null) {
			this.setState({
				file: null
			})
		} else if (clickedFile.isFile) {
			this.setState({
				file: clickedFile
			})
		} else {
			this.setState({
				file: clickedFile,
				loadingFolderSize: true
			})
			const that = this
			fetch(window.location.href + 'api/get_directory_size', {
				method: 'POST',
			    headers: getRequestJsonHeader(),
			    body: JSON.stringify({dir : clickedFile.path})
			})
			.then(function (response) {
				if (response.status == 200) {
					response.json().then(function(json) {
						if (json.error == '') {
							clickedFile.size = json.size
							that.setState({
								file : clickedFile,
								loadingFolderSize: false
							});
						} else {
							that.setState({ loadingFolderSize: false });
						}
					})
					
				} else {
					that.setState({ loadingFolderSize: false });
				}
			});
			
		}
		
	}
	
	createInfoFilePathHandler = (filePath) => {
		let resultPath = ['Home'];
		let filePathArray = filePath.split('/');
		let keyCount = 0;
		
		for (let ind in filePathArray) {
			resultPath.push(<Arrow key={keyCount ++} />);
			resultPath.push(<span key={keyCount ++}>{filePathArray[ind]}</span>);
		}
		
		return (<div>{resultPath}</div>)
	}
	
	downloadSelectedFile = () => {
		if (this.state.file == undefined || !this.state.file.isFile) return;
		window.open(window.location.href + 'api/download_file?file=' + encodeURIComponent(this.state.file.path))
	}
	
	moveSelectedFile = (destPath, deleteFile) => {
		if (window.innerWidth <= 768) {
			this.props.moveSelectedFile(destPath, deleteFile)
			return
		}
		if (this.state.file == undefined) return;
		const that = this
		
		if (destPath != null && this.state.file.path == destPath) {
			this.setState({
				moving: false, fileErrMsg: 'Cannot move folder into itself'
			});
			return
		}
		
		let paramBody = {};
		if (destPath == null || deleteFile) {
			paramBody = {filePath : this.state.file.path}
			this.setState({
				deleting: false, submittingDelete: true, fileErrMsg: ''
			});
		} else {
			paramBody = {filePath : this.state.file.path, newPath : destPath}
			this.setState({
				moving: true, fileErrMsg: ''
			});
		}
		paramBody.delete = deleteFile
		
		fetch(window.location.href + 'api/move_file', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify(paramBody )
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						that.props.fileMoveHandler(that.state.file)
						if (destPath == null) {
							that.setState({
								submittingDelete: false, fileErrMsg: ''
							});
						} else {
							that.setState({
								moving: false, fileErrMsg: ''
							});
						}
						
					} else {
						if (destPath == null) {
							that.setState({
								submittingDelete: false, fileErrMsg: json.error
							});
						} else {
							that.setState({
								moving: false, fileErrMsg: json.error
							});
						}
					}
				})
				
			} else {
				if (destPath == null) {
					that.setState({
						submittingDelete: false, fileErrMsg: 'Internal server error. Please try again later'
					});
				} else {
					that.setState({
						moving: false, fileErrMsg: 'Internal server error. Please try again later'
					});
				}
			}
		});
		
	}
	
	renameSelectedFile = () => {
		if (this.state.file == undefined) return;
		
		const that = this
		this.setState({
			submittingName: true, fileErrMsg: ''
		});
		
		fetch(window.location.href + 'api/rename_file', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify({filePath : this.state.file.path, name : this.state.newName})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						let renamedFile = json.file
						renamedFile.type = getFileType(renamedFile)
						that.props.fileRenameHandler(that.state.file, renamedFile)
						that.setState({
							submittingName: false, fileErrMsg: '', renaming : false,
							file : renamedFile
						});
					} else {
						that.setState({
							submittingName: false, fileErrMsg: json.error
						});
					}
				})
				
			} else {
				that.setState({
					submittingName: false, fileErrMsg: 'Internal server error. Please try again later'
				});
			}
		});
	}
	
	getAvailableDriveSize = () => {
		return this.state.availableSize
	}
	
	initiateMoveModal = () => {
		this.moveFileModal.current.loadFolder(null)
	}
	
	render () {
		return (
			<div className="col-md-3">
			
				<div className="card my-4">
					<h5 className="card-header">Storage</h5>
					
					{(() => {
						switch (this.state.loadingStatus) {
							case LoadingStatus.Loading:
								return (
									<div className="card-body">
										<div className="row">
											<div className="col-5">
												<span className="fa fa-refresh fa-spin fa-2x fa-fw float-right"></span>
											</div>
											<div className="col-7">
												<h4 className="float-left">Loading ...</h4>
											</div>
										</div>
									</div>
								)
								
							case LoadingStatus.Error:
								return (
									<div className="card-body">
										<div onClick={() => this.loadStorageInfo()} className="alert alert-warning text-center cursor-pointer" role="alert">
											<h4 className="alert-heading">Error</h4>
											<p>Something went wrong while loading the directory. {this.state.loadingMsg}</p>
											<hr></hr>
											<p><span className="fa fa-refresh fa-1x fa-fw pr-4"></span> Click here to refresh</p>
										</div>
									</div>
								)
								
							case LoadingStatus.Loaded:
								return (
									<div className="card-body">
										<p className="card-text">
											{convertSize(this.state.availableSize)} free of {convertSize(this.state.totalSize)}
										</p>
										<div className="progress">
											<div className="progress-bar" role="progressbar" style={{width:`${this.state.ratio + '%'}`}} aria-valuenow={this.state.ratio} aria-valuemin="0" aria-valuemax="100">{this.state.ratio} %</div>
										</div>
									</div>
								)
						}
							
					})()}
					
					
					
				</div>
				
				<div className="card my-4 sticky-top d-none d-md-block">
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
								<div className="col-lg-3 pr-0">
									<p className="card-text font-weight-bold">Name</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{this.state.file.name}</p>
								</div>
							</div>
							
							<div className="row my-1">
								<div className="col-lg-3 pr-0">
									<p className="card-text font-weight-bold">Type</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{this.state.file.type}</p>
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3 pr-0">
									<p className="card-text font-weight-bold">Size</p>
								</div>
								<div className="col-lg-9">
									{ (!this.state.file.isFile && this.state.loadingFolderSize) ? (
											<p className="card-text"> <span className="fa fa-refresh fa-spin fa-1x fa-fw"></span> Loading ...</p>
									) : (
											<p className="card-text">{convertSize(this.state.file.size) + '  (' + numberWithCommas(this.state.file.size) + ' Bytes)'}</p>
									)}{}
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3 pr-0">
									<p className="card-text font-weight-bold">Location</p>
								</div>
								<div className="col-lg-9">
									{this.createInfoFilePathHandler(this.state.file.path)}
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3 pr-0">
									<p className="card-text font-weight-bold">Modified</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{convertDate(this.state.file.lastModified)}</p>
								</div>
							</div>

							<div className="row my-1">
								<div className="col-lg-3 pr-0">
									<p className="card-text font-weight-bold">Created</p>
								</div>
								<div className="col-lg-9">
									<p className="card-text">{convertDate(this.state.file.created)}</p>
								</div>
							</div>
							
							<hr></hr>
							
							{this.state.fileErrMsg == '' ? (
								<div></div>
							) : (
								<div className="row my-1 text-center">
									<div className="col">
										<div className="alert alert-danger" role="alert">{this.state.fileErrMsg}</div>
									</div>
								</div>
							)}
							
							{this.state.renaming ? (
								<div className="row my-1 text-center">
									<div className="col">
										<div className="input-group">
											<input type="text" className="form-control" placeholder="Enter new file name" 
												onChange={(e) => this.setState({newName: e.target.value}) } disabled={this.state.submittingName? "disabled" : ""}
												onKeyPress={(e) => {
													if (e.key === 'Enter') this.renameSelectedFile()
												}}></input>
											{ this.state.submittingName ? (
												<div className="input-group-append">
													<button className="btn btn-success disabled" type="button"><span className="fa fa-refresh fa-spin fa-1x fa-fw float-right"></span></button>
												</div>
											) : (
												<div className="input-group-append">
													<button className="btn btn-success" type="button" onClick={this.renameSelectedFile} >Save</button>
													<button className="btn btn-secondary" type="button" onClick={() => this.setState({renaming : false})}>Cancel</button>
												</div>
											)}
										</div>
									</div>
								</div>
							) : this.state.deleting ? (
								<div className="row my-1 text-center">
									<div className="col-md-12 mb-4">
										<p className="card-text font-weight-bold">Are you sure about deleting this {this.state.file.isFile ? "file" : "folder"}?</p>
									</div>
									<div className="col-md-6">
										<button type="button" className="btn btn-danger btn-block px-0" onClick={() => this.moveSelectedFile(null, true)}>Delete</button>
									</div>
									<div className="col-md-6">
										<button type="button" className="btn btn-secondary btn-block px-0" onClick={() => this.setState({deleting : false}) }>Cancel</button>
									</div>
								</div>
							) : (
								<div className="row my-1 text-center">
									<div className="col-6 col-xl-3 px-1 py-1">
										<button type="button" className={this.state.file.isFile ? "btn btn-outline-primary btn-block px-0" : "btn btn-outline-primary btn-block px-0 disabled"}
											onClick={this.downloadSelectedFile}>Download</button>
									</div>
									<div className="col-6 col-xl-3 px-1 py-1">
										<button type="button" className="btn btn-outline-primary btn-block px-0" onClick={() => this.setState({renaming : true}) }>Rename</button>
									</div>
									<div className="col-6 col-xl-3 px-1 py-1">
										{ this.state.moving ? (
											<button type="button" className="btn btn-outline-primary btn-block px-0 disabled">
												<span className="fa fa-refresh fa-spin fa-1x fa-fw"></span>
											</button>
										) : (
											<button type="button" className="btn btn-outline-primary btn-block px-0" data-toggle="modal" data-target="#moveFileModal" onClick={this.initiateMoveModal} >Move</button>
										) }
										
									</div>
									<div className="col-6 col-xl-3 px-1 py-1">
										{ this.state.submittingDelete ? (
											<button type="button" className="btn btn-danger btn-block px-0  disabled"><span className="fa fa-refresh fa-spin fa-1x fa-fw"></span></button>
										) : (
											<button type="button" className="btn btn-outline-danger btn-block px-0" onClick={() => this.setState({deleting : true}) }>Delete</button>
										)}
										
									</div>
								</div>
							)}
							
						</div>
					)}
					
				</div>
				
				<MoveFileModal ref={this.moveFileModal} moveSelectedFile={this.moveSelectedFile} />
				
			</div>
		);
	}
}

