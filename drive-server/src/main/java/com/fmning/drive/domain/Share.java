package com.fmning.drive.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;

import javax.persistence.*;
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

    @Column(name="file", columnDefinition = "TEXT")
    private String file;

    @Column(name="expiration", columnDefinition = "TIMESTAMP")
    private Instant expiration;

    @Column(name="created", columnDefinition = "TIMESTAMP")
    private Instant created;

    @Column(name="creator_id", columnDefinition = "TEXT")
    private String creatorId;

    @Column(name="creator_name", columnDefinition = "TEXT")
    private String creatorName;
}
