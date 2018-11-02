import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate, getFileType} from '../utils/Utils'
import {LoadingStatus} from '../utils/Enums';
import UploadFileModal from './UploadFileModal'

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
	    	fileList: [],
	    	currentDir: 'root',
	    	loadingStatus: LoadingStatus.Loading,
	    	sortCol: 'name',
	    	sortOrder: 'neutral'
	    };
	    this.uploadModal = React.createRef()
	}
	
	componentDidMount() {
		this.loadFolder(null)
	}
	
	loadFolder = (file) => {
		var that = this
		var requestedDir
			
		if (file == null) {
			requestedDir = 'root';
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
		    headers: {
		    	'Accept': 'application/json',
		    	'Content-Type': 'application/json'
		    },
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
		this.props.showFileDetailsHandler(file);
		$(row).parent().addClass('selected').siblings().removeClass('selected');
	}
	
	uploadBtnHandler = () => {
		let availableSize = this.props.getAvailableDriveSize()
		console.log(this.state.currentDir)
		this.uploadModal.current.updateDriveStatus(this.state.fileList, availableSize, this.state.currentDir)
		$('#uploadModal').modal('show');
	}
	
	render () {
		
		return (
			<div className="col-md-9">
				<div className="row">
					<div className="col">
						<h2 className="mb-4 ml-2"><small>Files</small></h2>
					</div>
					<div className="col">
						<button className="btn btn-primary float-right" type="button" onClick={this.uploadBtnHandler} ><span className="fa fa-plus mr-2"></span>Upload</button>
					</div>
				</div>
				
				
				<table className={this.state.loadingStatus == LoadingStatus.Loaded ? "table table-hover" : "table"}>
					<thead>
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
					})()}
						
						
							

				</table>
				<UploadFileModal ref={this.uploadModal} />
			</div>
		);
	}
}

