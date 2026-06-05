package com.jali.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jali.entity.FamilyTree;

public interface FamilyTreeRepository extends JpaRepository<FamilyTree, Long> {

	Optional<FamilyTree> findByOwnerId(Long ownerId);
}
