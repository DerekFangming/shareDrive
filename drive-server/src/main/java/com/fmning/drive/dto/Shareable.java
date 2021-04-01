package com.fmning.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Shareable {
    private String name;
    private String path;
    private Boolean isFile;
    private long created;
    private long lastModified;
    private long size;
}
