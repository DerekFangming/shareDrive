import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate, getFileType, getRequestJsonHeader} from '../utils/Utils'
import {LoadingStatus} from '../utils/Enums';
import UploadFileModal from './UploadFileModal'
import Popover, { ArrowContainer } from 'react-tiny-popover'

import archive from '../../resources/static/archive.png';
import audio from '../../resources/static/audio.png';
import document from '../../resources/static/document.png';
import fileIcon from '../../resources/static/file.png';
import folder from '../../resources/static/folder.png';
import image from '../../resources/static/image.png';
import video from '../../resources/static/video.png';


export default class FileTable extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	mobile: window.innerWidth <= 768,
	    	fileList: [],
	    	currentDir: null,
	    	loadingStatus: LoadingStatus.Loading,
	    	sortCol: 'name',
	    	sortOrder: 'neutral',
	    	creatingFolder: false,
	    	submittingFolder: false,
	    	folderErrMsg: '',
	    	mobileSelectedFileName: '',
	    	newName: '',
	    	renaming: false,
	    	submittingName: false,
	    	fileErrMsg: ''
	    };
	    this.uploadModal = React.createRef()
	}
	
	componentDidMount() {
		this.loadFolder(null)
		window.addEventListener('resize', this.windowSizeHandler);
	}
	
	componentWillUnmount() {
		window.removeEventListener('resize', this.windowSizeHandler);
	}
	
	windowSizeHandler = () => {
		this.setState({mobile: window.innerWidth <= 768});
	}
	
	loadFolder = (file) => {
		var that = this
		var requestedDir = null
			
		if (file == null) {
			this.setState({
				loadingStatus: LoadingStatus.Loading, sortCol: 'name', sortOrder: 'neutral'
			});
		} else if (file.isFile) {
			return
		} else {
			requestedDir = file.path;
			this.setState({
				loadingStatus: LoadingStatus.Loading, sortCol: 'name', sortOrder: 'neutral'
			});
		}
		
		fetch(Config.serverUrl + 'get_files_in_directory', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify({dir : requestedDir})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						json.fileList.sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
						that.setState({
							loadingStatus: LoadingStatus.Loaded,
							fileList: json.fileList,
							currentDir: requestedDir
						});
						that.props.createFilePathHandler(file)
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
	
	updateSearchResultHandler = (searchResultList) => {
		searchResultList.sort((a, b) => a.isFile == b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1);
		this.setState({
			loadingStatus: LoadingStatus.Loaded,
			fileList: searchResultList,
			sortCol: 'name',
			sortOrder: 'neutral'
		});
	}
	
	fileRenameHandler = (oldFile, newFile) => {
		let index = this.state.fileList.findIndex((f) => {
			return f.path == oldFile.path
		});
		
		if (index != -1) {
			let newFileList = this.state.fileList.slice()
			newFileList[index] = newFile
			
			this.setState({
				fileList: newFileList
			});
		}
	}
	
	 fileMoveHandler= (file) => {
		let index = this.state.fileList.findIndex((f) => {
			return f.path == file.path
		});
		
		if (index != -1) {
			let newFileList = this.state.fileList.slice()
			newFileList.splice(index, 1);
			
			this.setState({
				fileList: newFileList
			});
		}
	}
	
	sortColumnHandler =(colName) => {
		const isNumber = (colName != 'name')
    	if (this.state.sortOrder == 'neutral') {
    		this.setState({
    			sortCol: colName, sortOrder: 'asc',
    			fileList: this.sortHelper(colName, true)
    		});
    	} else if (this.state.sortCol == colName) {
    		if (this.state.sortOrder == 'asc') {
    			this.setState({
        			sortCol: colName, sortOrder: 'desc',
        			fileList: this.sortHelper(colName, false)
        		});
    		} else {
    			this.setState({
        			sortCol: colName, sortOrder: 'asc',
        			fileList: this.sortHelper(colName, true)
        		});
    		}
    	} else {
    		this.setState({
    			sortCol: colName, sortOrder: 'asc',
    			fileList: this.sortHelper(colName, true)
    		});
    	}
    	
	}
	
	sortHelper = (colName, isAsc) => {
		const fileList = this.state.fileList.slice();
		if (colName == 'name') {
			fileList.sort((a, b) => isAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
		} else if (colName == 'mod') {
			fileList.sort((a, b) => isAsc ? a.lastModified - b.lastModified : b.lastModified - a.lastModified)
		} else if (colName == 'size') {
			fileList.sort((a, b) => isAsc ? a.size - b.size : b.size - a.size)
		}
		return fileList
	}
	
	selectTableRow = (row, file) => {
		if (this.state.mobile) {
			this.setState({mobileSelectedFileName: file.name, fileErrMsg: ''})
		} else {
			this.props.showFileDetailsHandler(file);
			$(row).parent().addClass('selected').siblings().removeClass('selected');
		}
	}
	
	uploadBtnHandler = () => {
		let availableSize = this.props.getAvailableDriveSize()
		this.uploadModal.current.updateDriveStatus(this.state.fileList, availableSize, this.state.currentDir)
		$('#uploadModal').modal('show');
	}
	
	uploadDoneHanlder = (newFiles) => {
		let currentFileList = this.state.fileList.slice();
		let combinedFileList = newFiles.concat(currentFileList)
		this.setState({fileList: combinedFileList})
		this.props.refreshStorageInfoHandler()
	}
	
	createNewFolder = () => {
		const that = this
		this.setState({
			submittingFolder: true, folderErrMsg: ''
		});
		
		fetch(Config.serverUrl + 'create_folder', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify({dir : this.state.currentDir, folderName : this.state.newFolderName})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						let currentFileList = that.state.fileList.slice();
						currentFileList.unshift(json.file);
						that.setState({
							submittingFolder: false, folderErrMsg: '', creatingFolder : false, fileList: currentFileList
						});
					} else {
						that.setState({
							submittingFolder: false, folderErrMsg: json.error
						});
					}
				})
				
			} else {
				that.setState({
					submittingFolder: false, folderErrMsg: 'Internal server error. Please try again later'
				});
			}
		});
	}
	
	moveSelectedFile = (destPath, deleteFile) => {
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
		
		fetch(Config.serverUrl + 'move_file', {
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
	
	renameSelectedFile = (file) => {
		const that = this
		this.setState({
			submittingName: true, fileErrMsg: ''
		});
		
		fetch(Config.serverUrl + 'rename_file', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify({filePath : file.path, name : this.state.newName})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						let renamedFile = json.file
						renamedFile.type = getFileType(renamedFile)
						that.fileRenameHandler(file, renamedFile)
						that.setState({
							submittingName: false, fileErrMsg: '', renaming : false
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
	
	render () {
		
		return (
			<div className="col-md-9">
				<div className="row">
					<div className="col-12 col-md-3">
						<h2 className="mb-4 ml-2"><small>Files</small></h2>
					</div>
					{this.state.creatingFolder ? (
						<div className="col-12 col-md-9">
							<div className="input-group">
								<Popover isOpen={this.state.folderErrMsg != ''} position={'bottom'} onClickOutside={() => this.setState({folderErrMsg: ''})}
									content={({ position, targetRect, popoverRect }) => (
									<ArrowContainer position={position} targetRect={targetRect} popoverRect={popoverRect}
							        	arrowColor={'#F8D7DA'} arrowSize={10}>
										<div className="alert alert-danger py-2" role="alert">
											{this.state.folderErrMsg}
										</div>
									</ArrowContainer>
								)} >
									<input type="text" className="form-control" placeholder="Enter new folder name" 
										onChange={(e) => this.setState({newFolderName: e.target.value}) } disabled={this.state.submittingFolder? "disabled" : ""}
										onKeyPress={(e) => {
											if (e.key === 'Enter') this.createNewFolder()
										}}></input>
								</Popover>
								{ this.state.submittingFolder ? (
									<div className="input-group-append">
										<button className="btn btn-success disabled" type="button"><span className="fa fa-refresh fa-spin fa-1x fa-fw float-right"></span></button>
									</div>
								) : (
									<div className="input-group-append">
										<button className="btn btn-success" type="button" onClick={this.createNewFolder} >Create</button>
										<button className="btn btn-secondary" type="button" onClick={() => this.setState({creatingFolder : false})}>Cancel</button>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className={this.state.mobile? "col-12 col-md-9 d-flex justify-content-around" : "col-12 col-md-9"}>
							<button className={this.state.mobile? "btn btn-primary half-btn-width" : "btn btn-primary float-right"} type="button" onClick={this.uploadBtnHandler} ><span className="fa fa-plus mr-2"></span>Upload</button>
							<button className={this.state.mobile? "btn btn-primary half-btn-width" : "btn btn-primary float-right mr-2"} type="button" onClick={() => this.setState({creatingFolder: true})} ><span className="fa fa-folder-o mr-2"></span>New folder</button>
						</div>
					)}
				</div>
				
				<table className={this.state.loadingStatus == LoadingStatus.Loaded ? "table table-hover mt-3" : "table mt-3"}>
					<thead>
						{this.state.mobile ? (
							<tr>
								<th className="cursor-pointer">Name</th>
							</tr>
						):(
							<tr>
								<th className="cursor-pointer" style={{width:'70%'}} onClick={() => this.sortColumnHandler('name')} >
									Name { (() =>{
										if (this.state.sortOrder == 'neutral') return <i className="fa fa-minus float-right pt-1"></i>
										if (this.state.sortCol == 'name') {
											if (this.state.sortOrder == 'asc'){
												return <i className="fa fa-chevron-up float-right pt-1"></i>
											} else {
												return <i className="fa fa-chevron-down float-right pt-1"></i>
											}
										}
										return <i></i>
									})()}
									
								</th>
								<th className="cursor-pointer" style={{width:'20%'}} onClick={() => this.sortColumnHandler('mod')} >
									Last Modified { (() =>{
										if (this.state.sortOrder == 'neutral') return <i></i>
										if (this.state.sortCol == 'mod') {
											if (this.state.sortOrder == 'asc'){
												return <i className="fa fa-chevron-up float-right pt-1"></i>
											} else {
												return <i className="fa fa-chevron-down float-right pt-1"></i>
											}
										}
										return <i></i>
									})()}
								</th>
								<th className="cursor-pointer" style={{width:'10%'}} onClick={() => this.sortColumnHandler('size')} >
									Size { (() =>{
										if (this.state.sortOrder == 'neutral') return <i></i>
										if (this.state.sortCol == 'size') {
											if (this.state.sortOrder == 'asc'){
												return <i className="fa fa-chevron-up float-right pt-1"></i>
											} else {
												return <i className="fa fa-chevron-down float-right pt-1"></i>
											}
										}
										return <i></i>
									})()}
								</th>
							</tr>
						)}
							
					</thead>
					
					{(() => {
						switch (this.state.loadingStatus) {
							case LoadingStatus.Loading:
								return (
									<tbody>
										<tr>
											<td colSpan="3">
												<div className="row">
													<div className="col">
														<span className="fa fa-refresh fa-spin fa-2x fa-fw float-right"></span>
													</div>
													<div className="col">
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
										<tr onClick={() => this.loadFolder(null)}>
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
								if (this.state.mobile) {
									return (
										<tbody>
											{this.state.fileList.map(file =>
												<tr key={file.path + file.name} value={file.name}
													onClick={ (e) => this.selectTableRow(e.target, file) }
													onDoubleClick={ () => this.loadFolder(file) }>
													<td className="fix-text"><span> {(() => {
														let fileType = getFileType(file)
														file.type = fileType
														if (fileType.endsWith('Folder')) return (<img src={folder} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('image')) return (<img src={image} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('document')) return (<img src={document} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('archive')) return (<img src={archive} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('audio')) return (<img src={audio} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('video')) return (<img src={video} className='mr-2' width='30' height='30'></img>)
														return (<img src={fileIcon} className='mr-2' width='30' height='30'></img>)
														})()}
														{file.name}</span>
														
														<div className={this.state.mobileSelectedFileName == file.name? "" : "d-none"}>
														
															<div className="row mt-3">
																<div className="col">
																	<p className="font-weight-bold mobile-text">Type:</p>
																	<p className="font-italic mobile-text ml-4 pl-2">{file.type}</p>
																</div>
																<div className="col">
																	<p className="font-weight-bold mobile-text">Size:</p>
																	<p className="font-italic mobile-text ml-4 pl-2">{file.size == 0 ? " - " : convertSize(file.size)}</p>
																</div>
															</div>
															
															<div className="row">
																<div className="col">
																	<p className="font-weight-bold mobile-text">Modified:</p>
																	<p className="font-italic mobile-text">{convertDate(file.lastModified)}</p>
																</div>
																<div className="col">
																	<p className="font-weight-bold mobile-text">Created:</p>
																	<p className="font-italic mobile-text">{convertDate(file.created)}</p>
																</div>
															</div>
															
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
																					if (e.key === 'Enter') this.renameSelectedFile(file)
																				}}></input>
																			{ this.state.submittingName ? (
																				<div className="input-group-append">
																					<button className="btn btn-success disabled" type="button"><span className="fa fa-refresh fa-spin fa-1x fa-fw float-right"></span></button>
																				</div>
																			) : (
																				<div className="input-group-append">
																					<button className="btn btn-success" type="button" onClick={() => this.renameSelectedFile(file)} >Save</button>
																					<button className="btn btn-secondary" type="button" onClick={() => this.setState({renaming : false, fileErrMsg: ''})}>Cancel</button>
																				</div>
																			)}
																		</div>
																	</div>
																</div>
															):(
																<>
																<div className="row my-1">
																	<div className="col">
																		<button type="button" className="btn btn-outline-primary btn-block"
																			onClick={() => {
																				file.isFile ? window.open(Config.serverUrl + 'download_file?file=' + encodeURIComponent(file.path)) : this.loadFolder(file)
																			}	
																		}>{file.isFile ? "Download" : "View content"}</button>
																	</div>
																	<div className="col">
																		<button type="button" className="btn btn-outline-primary btn-block"  onClick={() => this.setState({renaming : true})} >Rename</button>
																	</div>
																</div>
																
																<div className="row my-1">
																	<div className="col">
																		<button type="button" className="btn btn-outline-primary btn-block">Move</button>
																	</div>
																	<div className="col">
																		<button type="button" className="btn btn-outline-danger btn-block" onClick={() => 
																			this.props.mobileMoveSelectedFile(file, null, true)
																		}>Delete</button>
																	</div>
																</div>
																</>
															)}
															
														</div>
													</td>
												</tr>
											)}
										</tbody>
									)
								} else {
									return (
										<tbody>
											{this.state.fileList.map(file =>
												<tr key={file.path + file.name} value={file.name}
													onClick={ (e) => this.selectTableRow(e.target, file) }
													onDoubleClick={ () => this.loadFolder(file) }>
													<td> {(() => {
														let fileType = getFileType(file)
														file.type = fileType
														if (fileType.endsWith('Folder')) return (<img src={folder} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('image')) return (<img src={image} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('document')) return (<img src={document} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('archive')) return (<img src={archive} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('audio')) return (<img src={audio} className='mr-2' width='30' height='30'></img>)
														if (fileType.endsWith('video')) return (<img src={video} className='mr-2' width='30' height='30'></img>)
														return (<img src={fileIcon} className='mr-2' width='30' height='30'></img>)
													})()}
													
													{file.name}</td>
													
													<td>{convertDate(file.lastModified)}</td>
													<td>{file.isFile ? convertSize(file.size) : '-'}</td>
												</tr>
												
											)}
										</tbody>
									)
								}
						}
					})()}
				</table>
				<UploadFileModal ref={this.uploadModal} uploadDoneHanlder={this.uploadDoneHanlder}/>
			</div>
		);
	}
}

