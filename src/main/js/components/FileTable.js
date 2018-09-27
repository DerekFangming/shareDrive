import React, {Component} from 'react';
import Config from 'Config';

class FileTable extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	//fileList: [{name: 'test.txt', path: 'haha', isFile: 'wtf', lastModified: 123}]
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
		    // /Users/fangming.ning/Desktop
		    // D:/Github/shareDrive
		    body: JSON.stringify({dir : 'D:/Github/shareDrive'})
		})
		.then(function (response) {
			if (response.status >= 400) {
				throw new Error("Bad response from server");
			}
			return response.json();
		})
		.then(function (data) {
			that.setState({
				fileList: data.objList
			});
		});
	}
	
	convertDate(secs)   {
		return (new Date(secs)).toLocaleString();
    }
	
	render () {
		
		var items = this.state.fileList.map(it =>
			<tr key={it.name}>
				<td>{it.name}</td>
				<td>{this.convertDate(it.lastModified)}</td>
				<td>1kb</td>
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

