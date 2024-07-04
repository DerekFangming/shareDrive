package com.fmning.drive.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="dr_shares")
@DynamicUpdate
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Share {

    @Id
    @Column(name="id")
    private String id;

    @Column(name="name", columnDefinition = "TEXT")
    private String name;

    @Column(name="path", columnDefinition = "TEXT")
    private String path;

    @Column(name="expiration", columnDefinition = "TIMESTAMP")
    private Instant expiration;

    @Column(name="created", columnDefinition = "TIMESTAMP")
    private Instant created;

    @Column(name="write_access", columnDefinition = "BOOLEAN")
    private boolean writeAccess;

    @Column(name="creator_id", columnDefinition = "TEXT")
    private String creatorId;

    @Column(name="creator_name", columnDefinition = "TEXT")
    private String creatorName;
}
