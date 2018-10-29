import React, {Component} from 'react';
import Config from 'Config';
import axios from 'axios'
import plus from '../../resources/static/plus.png';

export default class UploadFileModal extends Component {
	
	constructor() {
		super();
		this.state = {
			files: [],
			uploadButtonClass: '',
			errMsg: ''
		};
//		this.fileDrop = this.fileDrop.bind(this);
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
		for (var newFile of newFiles)  {
			
			let dup = this.state.files.some( file => {
				console.log(file.name + ' ' + newFile.name)
				return file.name == newFile.name
			})
			
			if (dup) {
				let msg = 'Cannot have duplicated file names \'' + newFile.name + '\' under the same directory.'
				this.setState({errMsg: msg, uploadButtonClass: ''})
				return false
			}
		}
		
		let currentFileList = this.state.files.slice();
		let combinedFileList = currentFileList.concat(newFiles)
		console.log(currentFileList);
		console.log(newFiles)
		console.log(combinedFileList)
		this.setState({files: combinedFileList, uploadButtonClass: '', errMsg: ''})
	}
	
	uploadFile = () => {
		var formData = new FormData();

		console.log('len: ' + this.state.files.length)
		Array.from(this.state.files).map(file =>{
			formData.append("file", file);
		})
		
		formData.append("dir", "some randome");
		axios.post(Config.serverUrl + 'upload_file', formData, {
			headers: {
			  'Content-Type': 'multipart/form-data'
			},
			onUploadProgress: ProgressEvent => {
				console.log(ProgressEvent.loaded / ProgressEvent.total*100)
			}
		})
		.then(null, res => {
			if (res.response) {
				console.log(res.response.status)
				console.log(res.response)
			} else {
				console.log("Internal server error")
			}
//			console.log(res)
//			console.log(res.response)
			//console.log(res.response.data)
		})
//		.catch(err => {
//		      console.log(err)
//		      console.log(err.response.status)
//	    })
	}
	
	removeFile = (fileName) => {
		let index = this.state.files.findIndex((f) => {
			return f.name == fileName
		});
		
		if (index != -1) {
			let newFileList = this.state.files.slice()
			newFileList.splice(index, 1);
			
			this.setState({
				files: newFileList, errMsg: ''
			});
		}
	}
	
	render () {//106 is done
		return (
			<div className="modal fade" id="uploadModal" tabIndex="-1" role="dialog" data-keyboard="false" data-backdrop="static">
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title" id="uploadModalLabel">Upload a file</h5>
							<button type="button" className="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
							</button>
						</div>
						
						<div className={"modal-body upload-btn d-flex align-items-center " + this.state.uploadButtonClass} id="uploadBox">
							<input type="file" name="filefield" multiple="multiple" id="fileSelectButton"></input>
							<div className="container text-center upload-btn-child">
							<img src={plus} width='80' height='80'></img>
							<h4 className="font-weight-light" >Click here or drop a file here</h4>
							</div>
						</div>
						
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
														<td  style={{width:'80%'}}>{file.name}</td>
														<td style={{width:'20%'}}>
															<button type="button" className="btn btn-danger btn-sm float-right" onClick={() => this.removeFile(file.name)} >
																delete
															</button>
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
							<button type="button" className="btn btn-success"  onClick={this.uploadFile}>Upload</button>
							<button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
						</div>
					</div>
				</div>
			</div>
		)
	}
	
}