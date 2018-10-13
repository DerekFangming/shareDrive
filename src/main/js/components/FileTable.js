import React, {Component} from 'react';
import Config from 'Config';
import {convertSize, convertDate} from '../utils/Utils'
import {LoadingStatus} from '../utils/Enums';

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
	
	somefunc = () => {
//		this.state.fileList.map(file =>
//		<tr key={file.name} value={file.name}
//			onClick={ () =>
//				{this.props.fileClickHandler(file);
//				 this.loadFolder(file);}
//			}
//		>
//			<td>{file.name}</td>
//			<td>{convertDate(file.lastModified)}</td>
//			<td>{file.isFile ? convertSize(file.size) : '-'}</td>
//		</tr>
//	)
//	}
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
					<tbody>
						{(() => {
							switch (this.state.loadingStatus) {
								case LoadingStatus.Loading:
									return (
										<tr><td colspan="3"> <span className="fa fa-refresh fa-spin fa-2x fa-fw float-right"></span> </td></tr>
									)
								case LoadingStatus.Error:
									return (
										<tr><td colspan="3"> Something is wrong! </td></tr>
									)
								case LoadingStatus.Loaded:
									return (
										<tr>
											<td className="text-center" colspan="3">
												<div className="alert alert-warning" role="alert">
													<h4 className="alert-heading">Error</h4>
													<p>Something went wrong while loading the directory. {this.state.loadingMsg}</p>
													<hr></hr>
													<p><span className="fa fa-refresh fa-1x fa-fw pr-4"></span> Click here to refresh</p>
												</div>
											</td>
										</tr>
									)
							}
						})()}
						
						
							

					</tbody>
				</table>
				
			</div>
		);
	}
}

