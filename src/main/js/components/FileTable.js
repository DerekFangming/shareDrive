import React, {Component} from 'react';
import Config from 'Config';
import {convertSize} from '../utils/Utils'

class FileTable extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	fileList: []
	    };
	}
	
	componentDidMount() {
		var that = this;
		
		fetch(Config.serverUrl + 'get_files_in_directory', {
			method: 'POST',
		    headers: {
		    	'Accept': 'application/json',
		    	'Content-Type': 'application/json'
		    },
		    body: JSON.stringify({dir : Config.homeDir})
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
	
	/**
	 * Convert seconds to formated date string
	 */
	convertDate(secs) {
		return (new Date(secs)).toLocaleString();
    }
	
	render () {
		
		var items = this.state.fileList.map(it =>
			<tr key={it.name}>
				<td>{it.name}</td>
				<td>{this.convertDate(it.lastModified)}</td>
				<td>{it.isFile ? convertSize(it.size) : '-'}</td>
			</tr>
		);
		
		return (
			<div className="col-md-8">
				<h1 className="my-4">Page Heading
					<small>Secondary Text</small>
				</h1>
				<table className="table table-hover">
					<thead>
						<tr>
							<th style={{width:'70%'}}>Name</th>
							<th style={{width:'20%'}}>Last Modified</th>
							<th style={{width:'10%'}}>Size</th>
						</tr>
					</thead>
					<tbody>
						{items}
					</tbody>
				</table>
			</div>
		);
	}
}

export default FileTable;

