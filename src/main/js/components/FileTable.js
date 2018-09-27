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
		    body: JSON.stringify({dir : '/Users/fangming.ning/Desktop'})
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
	
	
	
	render () {
		
		const convertDate(secs)  = () => {
			var t = new Date(1970, 0, 1);
		    t.setSeconds(secs);
		    return t;
	    };
		
		var items = this.state.fileList.map(it =>
			<tr>
				<td>{it.name}</td>
				<td>{convertDate(it.lastModified)}</td>
				<td>1kb</td>
			</tr>
		);
		
		return (
			<div className="col-md-8">
				<h1 className="my-4">Page Heading
					<small>Secondary Text</small>
				</h1>
				<table className="table table-hover">
					<caption>List of users</caption>
					<thead>
						<tr>
							<th style={{width:'70%'}}>Name</th>
							<th style={{width:'20%'}}>Last Modified</th>
							<th style={{width:'10%'}}>Size</th>
						</tr>
					</thead>
					<tbody>
						{items}
						<tr>
							<td>Something.txt</td>
							<td>2016/01/20</td>
							<td>1kb</td>
						</tr>
						<tr>
							<td>ahhahaha ha hjkasdhs sad askdh.doc</td>
							<td>2016/01/20</td>
							<td>3MB</td>
						</tr>
						<tr>
							<td>dafjdks.mp3</td>
							<td>2016/01/20</td>
							<td>20TB</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}
}

export default FileTable;

