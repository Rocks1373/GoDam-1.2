package com.godam.masters.repository;

import com.godam.masters.Customer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
  Optional<Customer> findByNameIgnoreCase(String name);

  Optional<Customer> findBySapCustomerIdIgnoreCase(String sapCustomerId);

  @Query(
      "select c from Customer c where c.active = true and " +
      "(lower(c.name) like lower(concat('%', :query, '%')) " +
      "or lower(c.locationText) like lower(concat('%', :query, '%'))) " +
      "order by c.name")
  List<Customer> searchActive(@Param("query") String query);

  List<Customer> findTop20ByActiveTrueOrderByNameAsc();
}
