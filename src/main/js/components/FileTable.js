import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate, getFileType} from '../utils/Utils'
import {LoadingStatus} from '../utils/Enums';

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
	    	loadingStatus: LoadingStatus.Loading
	    };
	}
	
	componentDidMount() {
		this.loadFolder(null)
	}
	
	loadFolder = (file) => {
		var that = this
		var requestedDir
			
		if (file == null) {
			requestedDir = this.state.currentDir;
			this.setState({
				loadingStatus: LoadingStatus.Loading
			});
		} else if (file.isFile) {
			return
		} else {
			requestedDir = file.path;
			this.setState({
				loadingStatus: LoadingStatus.Loading
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
						json.objList.sort((a, b) => a.isFile == b.isFile ? 0 : a.isFile ? 1 : -1);
						that.setState({
							loadingStatus: LoadingStatus.Loaded,
							fileList: json.objList
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
	
	render () {
		
		return (
			<div className="col-md-9">
				<h2 className="mb-4 ml-2"><small>Files</small></h2>
				<table className={this.state.loadingStatus == LoadingStatus.Loaded ? "table table-hover" : "table"}>
					<thead>
						<tr>
							<th style={{width:'70%'}}>Name</th>
							<th style={{width:'20%'}}>Last Modified</th>
							<th style={{width:'10%'}}>Size</th>
						</tr>
					</thead>
					
					{(() => {
						switch (this.state.loadingStatus) {
							case LoadingStatus.Loading:
								return (
									<tbody>
										<tr>
											<td colspan="3">
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
											<td className="text-center" colspan="3">
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
											<tr key={file.name} value={file.name}
												onClick={ () => this.props.showFileDetailsHandler(file) }
												onDoubleClick={ () => this.loadFolder(file) }>
												<td> {(() => {
													let fileType = getFileType(file.path)
													file.type = fileType
													if (!file.isFile) return (<img src={folder} className='mr-2' width='30' height='30'></img>)
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
				
			</div>
		);
	}
}

