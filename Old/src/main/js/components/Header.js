import React, {Component} from 'react';
import Config from 'Config';
import {getRequestJsonHeader, getCookie} from '../utils/Utils';
import Popover, { ArrowContainer } from 'react-tiny-popover';
import PreferenceModal from './PreferenceModal';
import "isomorphic-fetch";

export default class Header extends Component {
	
	constructor() {
	    super();
	    this.state = {
	    	mobile: window.innerWidth <= 768,
	    	searchError: false,
	    	searchErrMsg:'',
	    	searchDir: null,
	    	searchKeyWord: '',
	    	searching: false
	    };
	    this.preferenceModal = React.createRef();
	}
	
	componentDidMount() {
		window.addEventListener('resize', this.windowSizeHandler);
	}
	
	componentWillUnmount() {
		window.removeEventListener('resize', this.windowSizeHandler);
	}
	
	windowSizeHandler = () => {
		this.setState({mobile: window.innerWidth <= 768});
	}
	
	alertCloseHandler = () => {
		this.setState({
			searchError: false,
	    	searchErrMsg:''
		})
	}
	
	updateSearchPathHandler = (file) => {
		if (file == null) {
			this.setState ({searchDir: null });
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
		
		fetch(window.location.href + 'api/search_files_in_directory', {
			method: 'POST',
		    headers: getRequestJsonHeader(),
		    body: JSON.stringify({dir : this.state.searchDir, keyword : this.state.searchKeyWord})
		})
		.then(function (response) {
			if (response.status == 200) {
				response.json().then(function(json) {
					if (json.error == '') {
						if (json.fileList.length == 0) {
							that.setState({
								searching: false, searchError: true, searchErrMsg: 'No file found. Please try another (shorter) keyword'
							});
						} else {
							let searchedPathFile = that.state.searchDir == null ? null : {isFile: false, path: that.state.searchDir}
							that.props.updateSearchResultHandler(json.fileList, searchedPathFile)
							that.setState({
								searching: false
							});
						}
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
	
	logout = () => {
		this.props.logoutHandler()
	}
	
	render () {
		return (
			<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
				<a className="navbar-brand" href="./">Share drive</a>
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarSupportedContent">
					<ul className="navbar-nav mr-auto">
						<li className="nav-item dropdown active">
							<a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
								Loged in as {getCookie(Config.usernameCookieKey)}
							</a>
							<div className="dropdown-menu" aria-labelledby="navbarDropdown">
								<a className="dropdown-item cursor-pointer" data-toggle="modal" data-target="#preferenceModal"
									onClick={() => this.preferenceModal.current.loadUserList()} >Preference</a>
								<a className="dropdown-item cursor-pointer" onClick={this.logout} >Log out</a>
							</div>
						</li>
					</ul>
					
					<div className={this.state.mobile ? "form-inline input-group d-md-none" : "form-inline d-none d-md-block"} >
					
						<Popover isOpen={this.state.searchError} position={'bottom'} onClickOutside={this.alertCloseHandler} content={({ position, targetRect, popoverRect }) => (
							<ArrowContainer position={position} targetRect={targetRect} popoverRect={popoverRect}
					        	arrowColor={'#F8D7DA'} arrowSize={10}>
								<div className="alert alert-danger py-2" role="alert">
									{this.state.searchErrMsg}
								</div>
							</ArrowContainer>
						)} >
							<input className="form-control mr-2" type="text" placeholder="Search" disabled={this.state.searching ? "disabled" : ""}
								onChange={(e) => this.setState({searchKeyWord: e.target.value})} onKeyPress={(e) => { if (e.key === 'Enter') this.searchFiles() } }>
							</input>
				        </Popover>
						<button className={this.state.searching? "btn btn-outline-light disabled" : "btn btn-outline-light"}
							type="button" onClick={this.searchFiles} >
							{this.state.searching ? <span className="fa fa-refresh fa-spin fa-1x fa-fw float-right"></span> : "Search"}
						</button>
					</div>
				
					
				</div>
				<PreferenceModal ref={this.preferenceModal} />
			</nav>
		);
	}
}
