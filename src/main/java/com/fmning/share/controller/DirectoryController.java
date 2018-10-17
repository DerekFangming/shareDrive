package com.fmning.share.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fmning.share.response.DirSize;
import com.fmning.share.response.DriveStatus;
import com.fmning.share.response.Shareable;
import com.fmning.share.utils.ResponseList;

@RestController
@RequestMapping("/api")
public class DirectoryController {
	
	@Value("${homeDir}")
	private String homeDir;
	
	@PostMapping("/get_files_in_directory")
	public ResponseList getFiles(@RequestBody Map<String, Object> payload) {
		
		String dirStr = (String)payload.get("dir");
		if (dirStr == null) return new ResponseList("The request is not complete");
		
		File dir = dirStr.equals("root") ? new File(homeDir) : new File(homeDir + dirStr);
		
		if (dir.isFile()) {
			return new ResponseList("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new ResponseList("Requested path does not exist.");
		} else if (dir.listFiles() == null) {
			return new ResponseList("Internal server error.");
		} else {
			File[] childFileList = dir.listFiles();
			
			if (childFileList == null) {
				return new ResponseList("Internal server error.");
			} else {
				List<Shareable> fileList = new ArrayList<>();
				for(File f : childFileList) {
					if (!f.isHidden()) {
						fileList.add(new Shareable(f, homeDir));
					}
				}

				return new ResponseList(fileList);
			}
			
		}
	}
	
	@PostMapping("/search_files_in_directory")
	public ResponseList searchFiles(@RequestBody Map<String, Object> payload) {
		
		String dirStr = (String)payload.get("dir");
		if (dirStr == null) return new ResponseList("The request is not complete");
		
		File dir = dirStr.equals("root") ? new File(homeDir) : new File(homeDir + dirStr);
		
		if (dir.isFile()) {
			return new ResponseList("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new ResponseList("Requested path does not exist.");
		} else if (dir.listFiles() == null) {
			return new ResponseList("Internal server error.");
		} else {
			File[] childFileList = dir.listFiles();
			
			if (childFileList == null) {
				return new ResponseList("Internal server error.");
			} else {
				List<Shareable> fileList = new ArrayList<>();
				
				//Arrays.stream(childFileList).parallel().filter(f -> f.getName().matches(regex))
				
				
				for(File f : childFileList) {
					if (!f.isHidden()) {
						fileList.add(new Shareable(f, homeDir));
					}
				}

				return new ResponseList(fileList);
			}
			
		}
	}
	
	@GetMapping("/test")
	public void test() {
		File[] childFileList = (new File("/Users/fangming.ning/Desktop/")).listFiles();
		List<File> res = Arrays.stream(childFileList).parallel().filter(f -> f.getName().matches("e")).collect(Collectors.toList());
		
		System.out.println("");
		System.out.println("==================");
		
		for (File d : res) {
			System.out.println(d.getName());
		}
	}
	
	@GetMapping("/get_drive_status")
	public DriveStatus getDriveStatus() {
		File root = new File(homeDir);
		return new DriveStatus(root.getTotalSpace(), root.getUsableSpace());
	}
	
	@PostMapping("/get_directory_size")
	public DirSize getDirSize(@RequestBody Map<String, Object> payload) {
		
		String dirStr = (String)payload.get("dir");
		if (dirStr == null) return new DirSize("The request is not complete");
		
		File dir = new File(homeDir + dirStr);
		
		if (dir.isFile()) {
			return new DirSize("Requested path is not a directory.");
		} else if (!dir.isDirectory()) {
			return new DirSize("Requested path does not exist.");
		} else {
			return new DirSize(FileUtils.sizeOfDirectory(dir));
		}
	}
	

}
