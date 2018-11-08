package com.fmning.share.controller;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartRequest;

import com.fmning.share.response.FileDownloadResult;
import com.fmning.share.response.FileRenameResult;
import com.fmning.share.response.FileRetrieveResult;
import com.fmning.share.response.Shareable;
import com.fmning.share.utils.Utils;

@RestController
@RequestMapping("/api")
public class FileController {
	
	@Value("${homeDir}")
	private String homeDir;
	
	@Value("${secretValue}")
	private String secretValue;
	
	@GetMapping("/download_file")
	public FileDownloadResult getFile(@RequestParam("file") String filename, HttpServletResponse response) throws IOException {
		File file = new File(homeDir + filename);
		
		if (file.isDirectory()) {
			return new FileDownloadResult("Cannot download a directory");
		} else if (!file.isFile()) {
			return new FileDownloadResult("The file does not exist");
		}
		
		String mimeType= URLConnection.guessContentTypeFromName(file.getName());
        if (mimeType == null) mimeType = "application/octet-stream";
        
        String encodedFileName = URLEncoder.encode(file.getName(), "UTF-8").replace("+", "%20").replace("%28", "(").replace("%29", ")");
         
        response.setContentType(mimeType);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + encodedFileName + "\"");
        response.setContentLength((int)file.length());
 
        InputStream inputStream = new BufferedInputStream(new FileInputStream(file));
        FileCopyUtils.copy(inputStream, response.getOutputStream());
        
		return null;
	}
	
	@PostMapping("/rename_file")
	public FileRenameResult renameFile(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (!auth.equals(secretValue)) {
			return new FileRenameResult("Not autorized.");
		}
		
		String filePath = (String)payload.get("filePath");
		String newName = (String)payload.get("name");
		if (filePath == null || newName == null) return new FileRenameResult("The request is not complete");
		
		newName = newName.trim();
		if (newName.length() == 0) return new FileRenameResult("File name cannot be empty");
		
		if (newName.matches(".*[/\n\r\t\0\f`?*\\<>|\":].*")) return new FileRenameResult("File name cannot contain characters like / ` ? * \\ < > | \" :");
		
		File previousFile = new File(homeDir + filePath);		
		String previousExt = FilenameUtils.getExtension(previousFile.getPath());
		String newExt = FilenameUtils.getExtension(newName);
		
		if (!newExt.equals("") && !previousExt.toLowerCase().equals(newExt.toLowerCase())) {
			return new FileRenameResult("Cannot modify file extension. Please enter either the new name without file extension, or new name with the same extension");
		}
		
		if (!newExt.equals("")) {
			StringBuilder sb = new StringBuilder(newName);
			sb.replace(newName.lastIndexOf(newExt), newName.lastIndexOf(newExt) + newExt.length(), previousExt );
			newName = sb.toString();
		} else if (!previousExt.equals("")) {
			newName += '.' + previousExt;
		}
		
		String newPath = previousFile.getParent() + '/' + newName;
		
		if (newPath.equals(homeDir + filePath)) return new FileRenameResult("File name is the same as before");
		
		File newFile = new File(newPath);
		if (newFile.exists()) return new FileRenameResult("There is already a file in the directory called " + newName);
		
		if (previousFile.renameTo(newFile)) {
			return new FileRenameResult(newFile, homeDir);
		} else {
			return new FileRenameResult("Internal Server error. Please try again later");
		}
	}
	
	@PostMapping("/move_file")
	public FileRenameResult moveFile(@RequestHeader("Authorization") String auth, @RequestBody Map<String, Object> payload) {
		if (!auth.equals(secretValue)) {
			return new FileRenameResult("Not autorized.");
		}
		
		String filePath = (String)payload.get("filePath");
		String newPath = (String)payload.get("newPath");
		if (filePath == null) return new FileRenameResult("The request is not complete");
		
		filePath = homeDir + filePath;
		if (newPath == null) {
			Boolean deleteFile = (Boolean)payload.get("delete");
			boolean delete = deleteFile == null ? false : deleteFile;
			if (delete) {
				newPath = homeDir + Utils.RECYCLE_BIN_FOLDER_NAME + File.separator + System.currentTimeMillis() + "_";
			} else {
				newPath = homeDir;
			}
		} else {
			newPath = homeDir + newPath + File.separator;
		}
		
		String[] paths = filePath.split(File.separator);
		String originalName = paths[paths.length - 1];
		newPath += originalName;
		
		if (filePath.equals(newPath)) {
			return new FileRenameResult("The file is already at the selected directory");
		}
		
		if ((new File(filePath)).renameTo((new File(newPath)))) {
			return new FileRenameResult(new File(newPath), homeDir);
		} else {
			return new FileRenameResult("Internal Server error. Please try again later");
		}
	}
	
	@PostMapping("/upload_file")
	public FileRetrieveResult uploadFiles(@RequestHeader("Authorization") String auth, @RequestParam("files") List<MultipartFile> files, @RequestParam(value = "dir", required=false) String dir, MultipartRequest request) {
		if (!auth.equals(secretValue)) {
			return new FileRetrieveResult("Not autorized.");
		}
		
		String errorMessage = "";
		List<Shareable> fileList = new ArrayList<>();
		
		for (MultipartFile file : files) {
			File uploadedFile = dir == null ? new File(homeDir + file.getOriginalFilename()): new File(homeDir + dir + File.separator + file.getOriginalFilename());
			
			try {
				file.transferTo(uploadedFile);
				fileList.add(new Shareable(uploadedFile, homeDir));
			} catch (Exception e) {
				errorMessage = "Some files are not uploaded successfully.";
			}
		}
		
		FileRetrieveResult response = new FileRetrieveResult(errorMessage);
		response.setFileList(fileList);
		
		return response;
		
	}

}
