package com.fmning.drive.dto;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class Capacity {
    private long totalSpace;
    private long availableSpace;
}
