import React, {Component} from 'react';
import Config from 'Config';
import Popover, { ArrowContainer } from 'react-tiny-popover'

export default class Header extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	searchError: false,
	    	searchErrMsg:'',
	    	searchDir: 'root',
	    	searchKeyWord: '',
	    	searching: false
	    };
	}
	
	alertCloseHandler = () => {
		this.setState({
			searchError: false,
	    	searchErrMsg:''
		})
	}
	
	updateSearchPathHandler = (file) => {
		if (file == null) {
			this.setState ({searchDir: 'root' });
		} else if (file.isFile) {
			return;
		} else {
			this.setState ({searchDir: file.path });
		}
	}
	
	searchFiles = () => {
		const that = this
		that.setState({
			searchError: false,
	    	searchErrMsg:'',
			searching: true
		});
		
		fetch(Config.serverUrl + 'search_files_in_directory', {
			method: 'POST',
		    headers: {
		    	'Accept': 'application/json',
		    	'Content-Type': 'application/json'
		    },
		    body: JSON.stringify({dir : this.state.searchDir, keyword : this.state.searchKeyWord})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						
						that.setState({
							searching: false
						});
					} else {
						that.setState({
							searching: false, searchError: true, searchErrMsg: json.error
						});
					}
				})
				
			} else {
				that.setState({
					searching: false, searchError: true, searchErrMsg: 'Internal server error. Please try again later'
				});
			}
		});
	}
	
	render () {
		return (
			<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
				<a className="navbar-brand" href="#">Navbar</a>
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarSupportedContent">
					<ul className="navbar-nav mr-auto">
						<li className="nav-item active">
							<a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="#">Link</a>
						</li>
						<li className="nav-item dropdown">
							<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
							Dropdown
							</a>
							<div className="dropdown-menu" aria-labelledby="navbarDropdown">
								<a className="dropdown-item" href="#">Action</a>
								<a className="dropdown-item" href="#">Another action</a>
								<div className="dropdown-divider"></div>
								<a className="dropdown-item" href="#">Something else here</a>
							</div>
						</li>
					</ul>
					<form className="form-inline my-2 my-lg-0">
						
						<Popover isOpen={this.state.searchError} position={'bottom'} onClickOutside={this.alertCloseHandler} content={({ position, targetRect, popoverRect }) => (
							<ArrowContainer position={position} targetRect={targetRect} popoverRect={popoverRect}
					        	arrowColor={'#F8D7DA'} arrowSize={10}>
								<div className="alert alert-danger py-2" role="alert">
									{this.state.searchErrMsg}
								</div>
							</ArrowContainer>
						)} >
							<input className="form-control mr-sm-2" type="search" placeholder="Search" disabled={this.state.searching ? "disabled" : ""}
								onChange={(e) => this.setState({searchKeyWord: e.target.value}) }>
							</input>
				        </Popover>
						<button className={this.state.searching? "btn btn-outline-light my-2 my-sm-0 disabled" : "btn btn-outline-light my-2 my-sm-0"}
							type="button" onClick={this.searchFiles} >
							{this.state.searching ? <span className="fa fa-refresh fa-spin fa-1x fa-fw float-right"></span> : "Search"}
						</button>
					</form>
				</div>
			</nav>
		);
	}
}
