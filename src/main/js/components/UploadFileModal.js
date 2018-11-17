import React, {Component} from 'react';
import {convertSize, secondsToStr, keepTwoDigits, getAccessToken} from '../utils/Utils'
import Config from 'Config';
import axios from 'axios'
import plus from '../../resources/static/plus.png';

export default class UploadFileModal extends Component {
	
	constructor() {
		super();
		this.state = {
			files: [],
			fileSize: 0,
			existingFiles: [],
			availableDriveSize: 0,
			currentDir: null,
			uploadButtonClass: '',
			errMsg: '',
			uploading: false,
			ratio: 0,
			remainMsg: ''
		};
	}
	
	updateDriveStatus = (existingFiles, availableDriveSize, currentDir) => {
		this.setState({
			existingFiles: existingFiles,
			availableDriveSize: availableDriveSize,
			currentDir: currentDir
		})
	}
	
	componentDidMount() {
		document.getElementById('fileSelectButton').addEventListener('change', this.filePick);
		document.getElementById('uploadBox').addEventListener('dragenter', this.dragEnter);
		document.getElementById('uploadBox').addEventListener('dragover', this.dragOver);
		document.getElementById('uploadBox').addEventListener('dragleave', this.dragLeave);
		document.getElementById('uploadBox').addEventListener('drop', this.fileDrop);
	}
	  
	componentWillUnmount() {
		document.getElementById('fileSelectButton').removeEventListener('change', this.filePick);
		document.getElementById('uploadBox').removeEventListener('dragenter', this.dragEnter);
		document.getElementById('uploadBox').addEventListener('dragover', this.dragOver);
		document.getElementById('uploadBox').removeEventListener('dragleave', this.dragLeave);
		document.getElementById('uploadBox').removeEventListener('drop', this.fileDrop);
	}
	  
	dragEnter = (e) => {
		this.setState({ uploadButtonClass: 'upload-btn-drag-over' });
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	  
	dragOver = (e) => {
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	  
	dragLeave = (e) => {
		this.setState({uploadButtonClass: ''});
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	  
	fileDrop = (e) => {
		e.preventDefault();
		let newFiles = Array.from(e.dataTransfer.files);
		this.processNewFiles(newFiles)
		
		return false;
	}
	
	filePick = (e) => {
		let newFiles = Array.from(e.target.files);
		this.processNewFiles(newFiles)
	}
	
	processNewFiles = (newFiles) => {
		let newFileSize = 0
		for (var newFile of newFiles)  {
			let dup = this.state.files.some( file => {
				return file.name == newFile.name
			})
			
			if (dup) {
				let msg = 'Cannot have duplicated file names \'' + newFile.name + '\' under the same directory.'
				this.setState({errMsg: msg, uploadButtonClass: ''})
				return false
			}
			
			dup = this.state.existingFiles.some( file => {
				return file.name == newFile.name
			})
			
			if (dup) {
				let msg = 'The current directory already has a file named \'' + newFile.name + '\'.'
				this.setState({errMsg: msg, uploadButtonClass: ''})
				return false
			}
			
			newFileSize += newFile.size
			
		}
		
		let totalSize = newFileSize + this.state.fileSize;
		if (totalSize > Config["spring.servlet.multipart.max-file-size"]) {
			let msg = 'File size limit reached. You can only upload ' + convertSize(Config["spring.servlet.multipart.max-file-size"])
				+ ' worth of files at a time';
			this.setState({errMsg: msg, uploadButtonClass: ''})
			return false
		} else if (totalSize > this.state.availableDriveSize) {
			let msg = 'Share drive is full. Cannot upload more file than the left over ' + convertSize(this.state.availableDriveSize)
			+ ' worth of space';
			this.setState({errMsg: msg, uploadButtonClass: ''})
			return false
		}
		
		let currentFileList = this.state.files.slice();
		let combinedFileList = currentFileList.concat(newFiles)
		this.setState({files: combinedFileList, fileSize: totalSize, uploadButtonClass: '', errMsg: ''})
	}
	
	uploadFile = () => {
		if (this.state.files.length == 0) {
			this.setState({errMsg: 'Nothing to upload. Please select files or drop files above first.'})
			return
		} else {
			this.setState({uploading: true, ratio: 0, errMsg: ''})
		}

		var formData = new FormData();
		Array.from(this.state.files).map(file =>{
			formData.append("files", file);
		})
		
		if (this.state.currentDir != null) {
			formData.append("dir", this.state.currentDir);
		}
		
		let previousRatio = 0;
		let that = this
		let progressCal = setInterval(() => {
			let currentRatio = this.state.ratio
			let newProgress = currentRatio - previousRatio;
			previousRatio = currentRatio
			if (newProgress <= 0) {
				this.setState({remainMsg: '-'})
			} else {
				let remainingSeconds = (100 - currentRatio)/newProgress
				let remainingStr = secondsToStr(remainingSeconds)
				this.setState({remainMsg: remainingStr})
				
			}
			
			if (this.state.ratio == 100 || !this.state.uploading) {
				
				clearInterval(progressCal)
			}
		}, 1000)
		
		axios.post(window.location.href + 'api/upload_file', formData, {
			headers: {
			  'Content-Type': 'multipart/form-data',
			  'Authorization': getAccessToken()
			},
			onUploadProgress: ProgressEvent => {
				let percent = keepTwoDigits(ProgressEvent.loaded / ProgressEvent.total * 100)
				this.setState({ratio: percent })
			}
		})
		.then(res => {
			if(res.data.error == '') {
				this.setState({ files: [], fileSize: 0, errMsg: '', uploading: false, ratio: 0 });
				this.props.uploadDoneHanlder(res.data.fileList);
				$('#uploadModal').modal('hide');
			} else if (res.data.error == 'Some files are not uploaded successfully.') {
				let uploadFileList = this.state.files.slice();
				
				let newFileSize = this.state.fileSize;
				for (var uploadedFile of res.data.fileList)  {
					let index = uploadFileList.findIndex((f) => {
						return f.name == uploadedFile.name
					});
					
					if (index != -1) {
						uploadFileList.splice(index, 1);
						newFileSize -= uploadedFile.size
					}
				}
				
				this.setState({ files: uploadFileList, fileSize: newFileSize, errMsg: 'The following files failed to upload. Please try again later.', uploading: false, ratio: 0 });
				this.props.uploadDoneHanlder(res.data.fileList);
			} else {
				this.setState({errMsg: 'Failed to upload files due to internal error. Please try again later. ', uploading: false, ratio: 0});
			}
			
			this.setState({})
			
		})
		.then(null, res => {
			this.setState({errMsg: 'Failed to upload files due to internal error. Please try again later. ', uploading: false, ratio: 0})
		})
		
	}
	
	removeFile = (fileName) => {
		let index = this.state.files.findIndex((f) => {
			return f.name == fileName
		});
		
		if (index != -1) {
			let newFileList = this.state.files.slice()
			let totalSize = this.state.fileSize - newFileList[index].size;
			newFileList.splice(index, 1);
			
			
			this.setState({ files: newFileList, fileSize: totalSize, errMsg: '' });
		}
	}
	
	removeAllFiles = () => {
		this.setState({ files: [], fileSize: 0, errMsg: '' });
	}
	
	cancelBtnHandler = () => {
		this.setState({ files: [], fileSize: 0, errMsg: '' });
		$('#uploadModal').modal('hide');
	}
	
	render () {
		return (
			<div className="modal fade" id="uploadModal" tabIndex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="uploadModalLabel">Upload a file</h5>
							<button type="button" className={this.state.uploading ? "close d-none" : "close"} onClick={this.cancelBtnHandler} aria-label="Close">
							<span aria-hidden="true">&times;</span>
							</button>
						</div>
						
						<div className={this.state.uploading ? "d-none" : "modal-body upload-btn d-flex align-items-center " + this.state.uploadButtonClass} id="uploadBox">
							<input type="file" name="filefield" multiple="multiple" id="fileSelectButton"></input>
							<div className="container text-center upload-btn-child">
								<img src={plus} width='80' height='80'></img>
								<h4 className="font-weight-light" >Click here or drop a file here</h4>
							</div>
						</div>
						
						{(() => {
							if (this.state.uploading) {
								return(
									<div className="modal-body">
										<div className="row">
											<div className="col-md-2 pr-0 pt-1">
												<span className="fa fa-refresh fa-spin fa-fw float-right"></span>
											</div>
											<div className="col-md-10">
												<p className="float-left">Uploading ... Remaining time: {this.state.remainMsg}</p>
											</div>
										</div>
										<div className="progress">
											<div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{width:`${this.state.ratio + '%'}`}} aria-valuenow={this.state.ratio} aria-valuemin="0" aria-valuemax="100">{this.state.ratio} %</div>
										</div>
									</div>
								)
							}
						})()}
						
						<div className={this.state.errMsg == '' ? "d-none" : "modal-body"}>
							<div className="alert alert-danger" role="alert">{this.state.errMsg}</div>
						</div>
						
						{(() => {
							if (this.state.files.length > 0) {
								return (
									<div className="modal-body">
										<table className="table table-sm">
											<tbody>
												
												{Array.from(this.state.files).map(file =>
													<tr key={file.name}>
														<td className="fix-text" style={{width:'70%'}}><span>{file.name}</span></td>
														<td  style={{width:'15%'}}>{convertSize(file.size)}</td>
														<td style={{width:'15%'}}>
															<button type="button" className="btn btn-danger btn-sm float-right" onClick={() => this.removeFile(file.name)}
																disabled={this.state.uploading ? "disabled" : ""}>remove</button>
														</td>
													</tr>
												)}
												
											</tbody>
										</table>
									</div>
								)
							}
						})()}
						
						<div className="modal-footer">
							<button type="button" className="btn btn-success" onClick={this.uploadFile} disabled={this.state.uploading ? "disabled" : ""} >Upload</button>
							{(() => {
								if (this.state.files.length > 0) {
									return <button type="button" className="btn btn-danger" onClick={this.removeAllFiles} disabled={this.state.uploading ? "disabled" : ""}>Clear all files</button>
								}
							})()}
							<button type="button" className="btn btn-secondary" onClick={this.cancelBtnHandler}
								disabled={this.state.uploading ? "disabled" : ""} >Cancel</button>
						</div>
					</div>
				</div>
			</div>
		)
	}
	
}