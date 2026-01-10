package com.godam.delivery.repository;

import com.godam.delivery.DeliveryNote;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryNoteRepository extends JpaRepository<DeliveryNote, Long> {
  Optional<DeliveryNote> findByDnNumber(String dnNumber);
}
