package com.fmning.drive.controller;

import com.fmning.drive.dto.Shareable;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import javax.servlet.ServletContext;
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
    private final ServletContext servletContext;

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
            }).map(f -> Shareable.builder()
                    .name(f.getName())
                    .path(getRelativePath(f, rootDir))
                    .isFile(f.isFile())
                    .created(getCreationTime(f))
                    .lastModified(f.lastModified())
                    .size(f.isFile() ? f.length() : 0)
                    .build()).collect(Collectors.toList());
        }
    }
}
