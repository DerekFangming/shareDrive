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
	
	showFileDetailsHandler = (file) => {
		this.infoTable.current.showFileDetailsHandler(file);
	}
	
	createFilePathHandler = (file) => {
		this.dirPath.current.createFilePathHandler(file);
		this.props.updateSearchPathHandler(file);
	}
	
	fileRenameHandler = (oldFile, newFile) => {
		this.fileTable.current.fileRenameHandler(oldFile, newFile);
	}
	
	dirPathClickHandler = (path) => {
		let file = path == null ? null : {isFile: false, path: path}
		this.fileTable.current.loadFolder(file);
		this.infoTable.current.showFileDetailsHandler(null);
	}
	
	updateSearchResultHandler = (fileList, searchedPathFile) => {
		this.fileTable.current.updateSearchResultHandler(fileList);
		this.dirPath.current.createFilePathHandler(searchedPathFile, true)
	}
	
	render () {
		return (
			<div className="container-fluid">
				<div className="row mt-2">
					<DirectoryPath ref={this.dirPath} dirPathClickHandler={this.dirPathClickHandler}/>
				</div>
				
				<div className="row">
					<FileTable ref={this.fileTable} showFileDetailsHandler={this.showFileDetailsHandler} createFilePathHandler={this.createFilePathHandler}/>
					<InfoTables ref={this.infoTable} fileRenameHandler={this.fileRenameHandler}/>
				</div>
			</div>
		)
	}
	
}
