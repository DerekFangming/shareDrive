package com.fmning.drive.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class Shareable {
    private String name;
    private String path;
    private Boolean isFile;
    private long created;
    private long lastModified;
    private long size;
}
