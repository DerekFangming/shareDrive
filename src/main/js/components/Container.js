import React, {Component} from 'react';
import DirectoryPath from './DirectoryPath';
import FileTable from './FileTable';
import InfoTables from './InfoTables';

export default class Container extends Component {
	
	constructor() {
		super();
		this.dirPath = React.createRef();
		this.fileTable = React.createRef();
		this.infoTable = React.createRef();
	}
	
	fileClickHandler = (file) => {
		this.dirPath.current.createFilePath(file);
		this.infoTable.current.fileClickHandler(file.isFile ? file : null);
	}
	
	dirPathClickHandler = (path) => {
		let file = path == null ? null : {isFile: false, path: path}
		this.fileTable.current.loadFolder(file);
	}
	
	render () {
		return (
			<div className="container-fluid">
				<div className="row mt-2">
					<DirectoryPath ref={this.dirPath} dirPathClickHandler={this.dirPathClickHandler}/>
				</div>
				
				<div className="row">
					<FileTable ref={this.fileTable} fileClickHandler={this.fileClickHandler}/>
					<InfoTables ref={this.infoTable}/>
				</div>
			</div>
		)
	}
	
}
