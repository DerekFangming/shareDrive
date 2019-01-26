package com.fmning.share.response;

public class HandshakeResult {
	
	private String version;

	public HandshakeResult(String version) {
		this.version = version;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

}
