package com.fmning.share.response;

public class GenericResponse {
	
	private String error;

	public GenericResponse() {
		this.error = "";
	}
	
	public GenericResponse(String error) {
		this.error = error;
	}

	public String getError() {
		return error;
	}

	public void setError(String error) {
		this.error = error;
	}
	

}
