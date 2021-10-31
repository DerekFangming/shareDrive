package com.fmning.drive.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class UploadResult {
    String error;
    List<Shareable> files;
}
