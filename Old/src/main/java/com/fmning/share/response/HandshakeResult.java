package com.fmning.share.response;

public class HandshakeResult {
	
	private String version;
	private String error;

	public HandshakeResult(String version) {
		this.version = version;
		this.error = "";
	}

	public HandshakeResult(String version, String error) {
		this.version = version;
		this.error = error;
	}


	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}
	

}
