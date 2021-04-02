package com.fmning.drive.controller;

import com.fmning.drive.dto.Shareable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.File;

import static com.fmning.drive.FileUtil.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class FileController {

    private final File rootDir;
    private static final String DELETE_FILE = "delete-file";

    @PutMapping("/rename-file")
    public Shareable renameFile(@RequestBody Shareable shareable) {
        if (shareable == null || shareable.getPath() == null ) {
            throw new IllegalArgumentException("The request is invalid");
        } else if (!isNameValid(shareable.getName())) {
            throw new IllegalArgumentException("File name cannot contain characters like / ` ? * \\ < > | \" :");
        }

        File previousFile = getInnerFolder(rootDir, shareable.getPath());
        if (!previousFile.exists()) throw new IllegalArgumentException("The file you are trying to rename does not exist");
        String previousExt = FilenameUtils.getExtension(previousFile.getPath());
        String newName = shareable.getName();
        String newExt = FilenameUtils.getExtension(newName);

        if (!newExt.equals("") && !previousExt.toLowerCase().equals(newExt.toLowerCase())) {
            throw new IllegalArgumentException("Cannot modify file extension. Please enter either the new name without file extension, or new name with the same extension");
        }

        if (!newExt.equals("")) {
            StringBuilder sb = new StringBuilder(newName);
            sb.replace(newName.lastIndexOf(newExt), newName.lastIndexOf(newExt) + newExt.length(), previousExt );
            newName = sb.toString();
        } else if (!previousExt.equals("")) {
            newName += '.' + previousExt;
        }

        String newPath = previousFile.getParent() + File.separator + newName;
        if (newPath.equals(previousFile.getPath())) throw new IllegalArgumentException("File name is the same as before");

        File newFile = new File(newPath);
        if (newFile.exists()) throw new IllegalArgumentException("There is already a file in the directory called " + newName);

        if (previousFile.renameTo(newFile)) {
            return toShareable(rootDir, newFile);
        } else {
            throw new IllegalArgumentException("Failed to rename file.");
        }
    }

    @DeleteMapping("/" + DELETE_FILE + "/**")
    public ResponseEntity<Void> deleteFile(HttpServletRequest request) {
        File file = getInnerFolder(rootDir, getFilePath(request, DELETE_FILE));
        if (!file.exists()) throw new IllegalArgumentException("The file you are trying to delete does not exist");

        if (file.delete()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        } else {
            throw new IllegalArgumentException("Failed to DELETE file.");
        }
    }
}
