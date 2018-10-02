package com.fmning.share.response;

public class DriveStatus {
	
	private long totalSize;
	private long availableSize;
	private String error;
	
	public DriveStatus(long totalSize, long availableSize) {
		this.totalSize = totalSize;
		this.availableSize = availableSize;
		error = "";
	}
	
	public long getTotalSize() {
		return totalSize;
	}
	
	public void setTotalSize(long totalSize) {
		this.totalSize = totalSize;
	}
	
	public long getAvailableSize() {
		return availableSize;
	}
	
	public void setAvailableSize(long availableSize) {
		this.availableSize = availableSize;
	}
	
	public String getError() {
		return error;
	}
	
	public void setError(String error) {
		this.error = error;
	}

}
