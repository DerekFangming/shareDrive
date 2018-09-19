package com.fmning.share.utils;

import java.util.List;

public class ResponseList {
	
	private String error;
	private List<?> objList;
	
	public ResponseList(List<?> objList) {
		this.error = "";
		this.objList = objList;
	}
	
	public ResponseList(String error) {
		this.error = error;
	}
	
	public String getError() {
		return error;
	}
	public void setError(String error) {
		this.error = error;
	}
	public List<?> getObjList() {
		return objList;
	}
	public void setObjList(List<Object> objList) {
		this.objList = objList;
	}

}
