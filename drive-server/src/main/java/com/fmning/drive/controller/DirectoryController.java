package com.fmning.drive.controller;

import com.fmning.drive.dto.Capacity;
import com.fmning.drive.dto.DirectorySize;
import com.fmning.drive.dto.Shareable;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
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

    @GetMapping("/directory/**")
    public List<Shareable> getFiles(HttpServletRequest request, @RequestParam(value = "dirOnly", required=false) boolean dirOnly) {
        String path = new AntPathMatcher().extractPathWithinPattern((String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE), request.getRequestURI());
        File directory = getInnerFolder(rootDir, path.replaceFirst("directory", ""));

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
            }).map(this::toShareable).collect(Collectors.toList());
        }
    }

    @GetMapping("/directory-size/**")
    public DirectorySize getDirectorySize(HttpServletRequest request) {
        String path = new AntPathMatcher().extractPathWithinPattern((String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE), request.getRequestURI());
        File directory = getInnerFolder(rootDir, path.replaceFirst("directory-size", ""));

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
        if (shareable == null || shareable.getPath() == null) {
            throw new IllegalArgumentException("The request is not complete");
        }

        File newDir = getInnerFolder(rootDir, shareable.getPath());
        if (newDir.exists()) {
            throw new IllegalArgumentException("The folder already exits");
        }

       if (newDir.mkdirs()) {
           return toShareable(newDir);
        } else {
           throw new IllegalArgumentException("Failed to create folder.");
        }
    }

    private Shareable toShareable(File file) {
        return Shareable.builder()
                .name(file.getName())
                .path(getRelativePath(file, rootDir))
                .isFile(file.isFile())
                .created(getCreationTime(file))
                .lastModified(file.lastModified())
                .size(file.isFile() ? file.length() : 0)
                .build();
    }

}
