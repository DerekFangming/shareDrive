import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate} from '../utils/Utils'

class FileTable extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	fileList: []
	    };
	}
	
	componentDidMount() {
		this.loadFolder(null)
	}
	
	loadFolder = (file) => {
		var that = this
		var requestedDir
			
		if (file == null) {
			requestedDir = 'root'
		} else if (file.isFile) {
			return
		} else {
			requestedDir = file.path
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
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function (data) {
			data.objList.sort((a, b) => a.isFile == b.isFile ? 0 : a.isFile ? 1 : -1);
			that.setState({
				fileList: data.objList
			});
		});
	}
	
	render () {
		
		return (
			<div className="col-md-9">
				<h2 className="my-4 ml-2"><small>Files</small></h2>
				<table className="table table-hover">
					<thead>
						<tr>
							<th style={{width:'70%'}}>Name</th>
							<th style={{width:'20%'}}>Last Modified</th>
							<th style={{width:'10%'}}>Size</th>
						</tr>
					</thead>
					<tbody>
						{this.state.fileList.map(file =>
							<tr key={file.name} value={file.name}
								onClick={ () =>
									{this.props.fileClickHandler(file.isFile ? file : null);
									 this.loadFolder(file);}
								}
							>
								<td>{file.name}</td>
								<td>{convertDate(file.lastModified)}</td>
								<td>{file.isFile ? convertSize(file.size) : '-'}</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		);
	}
}

export default FileTable;

