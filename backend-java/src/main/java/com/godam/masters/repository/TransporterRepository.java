package com.godam.masters.repository;

import com.godam.masters.Transporter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransporterRepository extends JpaRepository<Transporter, Long> {
  @Query("select t from Transporter t where t.isActive = true and (lower(t.companyName) like lower(concat('%', :q, '%')) or lower(t.contactName) like lower(concat('%', :q, '%')))")
  List<Transporter> searchActive(@Param("q") String query);

  List<Transporter> findByIsActiveTrue();

  Optional<Transporter> findFirstByCompanyNameIgnoreCaseAndIsActiveTrue(String companyName);
}
