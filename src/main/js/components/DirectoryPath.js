import React, {Component} from 'react';

class DirectoryPath extends Component {
	render () {
		return (
			<div className="col-md-12">
				<nav className="nav nav-pills">
					<a className="nav-link px-1" href="#">Root</a>
					<a className="nav-link px-1 disabled" href="#">/</a>
					<a className="nav-link px-1" href="#">Longer nav link long long</a>
					<a className="nav-link px-1 disabled" href="#">/</a>
					<a className="nav-link px-1" href="#">Link</a>
					<a className="nav-link px-1 disabled" href="#">/</a>
					<a className="nav-link px-1" href="#">Disabled</a>
				</nav>
			</div>
		);
	}
}

export default DirectoryPath;

