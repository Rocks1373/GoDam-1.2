package com.godam.masters.repository;

import com.godam.masters.Driver;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DriverRepository extends JpaRepository<Driver, Long> {
  @Query("select d from Driver d where d.isActive = true and (lower(d.driverName) like lower(concat('%', :q, '%')) or lower(d.driverNumber) like lower(concat('%', :q, '%')) or lower(d.idNumber) like lower(concat('%', :q, '%')) or lower(d.truckNo) like lower(concat('%', :q, '%')))")
  List<Driver> searchActive(@Param("q") String query);

  @Query("select d from Driver d where (lower(d.driverName) like lower(concat('%', :q, '%')) or lower(d.driverNumber) like lower(concat('%', :q, '%')) or lower(d.idNumber) like lower(concat('%', :q, '%')) or lower(d.truckNo) like lower(concat('%', :q, '%')))")
  List<Driver> searchAll(@Param("q") String query);

  List<Driver> findByIsActiveTrue();

  Optional<Driver> findFirstByDriverNameIgnoreCaseAndDriverNumberIgnoreCaseAndIsActiveTrue(String driverName, String driverNumber);
}
