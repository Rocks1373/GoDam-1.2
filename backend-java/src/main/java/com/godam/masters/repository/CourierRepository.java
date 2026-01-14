package com.godam.masters.repository;

import com.godam.masters.Courier;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourierRepository extends JpaRepository<Courier, Long> {
  @Query("select c from Courier c where lower(c.name) like lower(concat('%', :q, '%'))")
  List<Courier> search(@Param("q") String query);
}
