package com.fmning.share.response;

public class DirSize {
	
	private long size;
	private String error;
	
	public DirSize(long size) {
		this.size = size;
		error = "";
	}
	
	public DirSize(String error) {
		this.error = error;
	}

	public long getSize() {
		return size;
	}
	
	public void setSize(long size) {
		this.size = size;
	}
	
	public String getError() {
		return error;
	}
	
	public void setError(String error) {
		this.error = error;
	}

}
