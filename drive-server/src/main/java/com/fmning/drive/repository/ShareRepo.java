package com.fmning.drive.repository;

import com.fmning.drive.domain.Share;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShareRepo extends CrudRepository<Share, String> {
    List<Share> findAll();
}
