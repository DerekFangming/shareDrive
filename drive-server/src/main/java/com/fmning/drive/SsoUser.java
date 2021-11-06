package com.fmning.drive;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SsoUser {
    private String name;
    private String userName;
    private String avatar;
}
