import React, {Component} from 'react';
import Config from 'Config';
import axios from 'axios'
import plus from '../../resources/static/plus.png';

export default class UploadFileModal extends Component {
	
	constructor() {
		super();
		this.state = {
			files: [],
			uploadButtonClass: ''
		};
//		this._onDrop = this._onDrop.bind(this);
	}
	
	componentDidMount() {
		//document.getElementById('uploadBox').addEventListener('mouseup', this._onDragLeave);
		document.getElementById('uploadBox').addEventListener('dragenter', this._onDragEnter);
		document.getElementById('uploadBox').addEventListener('dragover', this._onDragOver);
		document.getElementById('uploadBox').addEventListener('dragleave', this._onDragLeave);
		document.getElementById('uploadBox').addEventListener('drop', this._onDrop);
	}
	  
	componentWillUnmount() {
		//document.getElementById('uploadBox').removeEventListener('mouseup', this._onDragLeave);
		document.getElementById('uploadBox').removeEventListener('dragenter', this._onDragEnter);
		document.getElementById('uploadBox').addEventListener('dragover', this._onDragOver);
		document.getElementById('uploadBox').removeEventListener('dragleave', this._onDragLeave);
		document.getElementById('uploadBox').removeEventListener('drop', this._onDrop);
	}
	  
	_onDragEnter = (e) => {
		this.setState({ uploadButtonClass: 'upload-btn-drag-over' });
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	  
	_onDragOver = (e) => {
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	  
	_onDragLeave = (e) => {
		this.setState({uploadButtonClass: ''});
		e.stopPropagation();
		e.preventDefault();
		return false;
	}
	  
	_onDrop = (e) => {
		e.preventDefault();
		let files = e.dataTransfer.files;
		this.setState({files: files})
		console.log('Files dropped: ', files);
		// Upload files
		this.setState({className: 'drop-zone-hide'});
		return false;
	}
	
	uploadFile = () => {
		var formData = new FormData();
		
		formData.append("file", this.state.files[0]);
		axios.post(Config.serverUrl + 'upload_file', formData, {
			headers: {
			  'Content-Type': 'multipart/form-data'
			}
		})
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
							<div className="container text-center upload-btn-child">
							<img src={plus} width='80' height='80'></img>
							<h4 className="font-weight-light" >Click this button or drop a file here</h4>
							</div>
						</div>
						
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