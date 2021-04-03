package com.fmning.drive.controller;

import com.fmning.drive.dto.Capacity;
import com.fmning.drive.dto.DirectorySize;
import com.fmning.drive.dto.Shareable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.UnsupportedEncodingException;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static com.fmning.drive.FileUtil.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor(onConstructor_={@Autowired})
public class DirectoryController {

    private final File rootDir;
    private static final String DIRECTORY = "directory";
    private static final String DIRECTORY_SIZE = "directory-size";

    @GetMapping("/" + DIRECTORY + "/**")
    public List<Shareable> getFiles(HttpServletRequest request, @RequestParam(value = "dirOnly", required=false) boolean dirOnly) throws UnsupportedEncodingException {
        File directory = getInnerFolder(rootDir, getFilePath(request, DIRECTORY));

        if (directory.isFile()) {
            throw new IllegalArgumentException("Requested path is not a directory.");
        } else if (!directory.isDirectory()) {
            throw new IllegalArgumentException("Requested path does not exist.");
        } else {
            return Arrays.stream(Objects.requireNonNull(directory.listFiles())).filter(f -> {
                if (!f.isHidden() && !f.getName().startsWith(".") && !f.getName().startsWith("$")) {
                    return !dirOnly || f.isDirectory();
                }
                return false;
            }).map(f -> toShareable(rootDir, f)).collect(Collectors.toList());
        }
    }

    @GetMapping("/" + DIRECTORY_SIZE + "/**")
    public DirectorySize getDirectorySize(HttpServletRequest request) {
        File directory = getInnerFolder(rootDir, getFilePath(request, DIRECTORY_SIZE));

        if (directory.isFile()) {
            throw new IllegalArgumentException("Requested path is not a directory.");
        } else if (!directory.isDirectory()) {
            throw new IllegalArgumentException("Requested path does not exist.");
        } else {
            return DirectorySize.builder().size(FileUtils.sizeOfDirectory(directory)).build();
        }
    }

    @GetMapping("/capacity")
    public Capacity getCapacity() {
        return Capacity.builder().totalSpace(rootDir.getTotalSpace()).availableSpace(rootDir.getUsableSpace()).build();
    }

    @PostMapping("/directory")
    public Shareable createDirectory(@RequestBody Shareable shareable) {
        if (shareable == null || shareable.getPath() == null ) {
            throw new IllegalArgumentException("The request is invalid");
        } else if (isNameInvalid(shareable.getName())) {
            throw new IllegalArgumentException("File name cannot contain characters like / ` ? * \\ < > | \" :");
        }

        File newDir = getInnerFolder(rootDir, shareable.getPath());
        if (newDir.exists()) {
            throw new IllegalArgumentException("The folder already exits");
        }

       if (newDir.mkdirs()) {
           return toShareable(rootDir, newDir);
        } else {
           throw new IllegalArgumentException("Failed to create folder.");
        }
    }

}
