package com.fmning.share.utils;

import java.util.List;

public class FileStructure {
	
	public String name;
    public long size;
    public boolean isFile;
    public boolean isMissing;
    public String adjustedName;
    public List<FileStructure> children;

}
