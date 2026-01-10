package com.godam.delivery.service;

import com.godam.common.exception.BusinessRuleException;
import com.godam.delivery.dto.DeliveryNoteEmailRequest;
import com.godam.delivery.dto.DeliveryNoteResponse;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class DeliveryNoteEmailService {
  private final JavaMailSender mailSender;
  private final DeliveryNoteDocumentService documentService;
  private final DeliveryNoteService deliveryNoteService;

  public DeliveryNoteEmailService(
      JavaMailSender mailSender,
      DeliveryNoteDocumentService documentService,
      DeliveryNoteService deliveryNoteService) {
    this.mailSender = mailSender;
    this.documentService = documentService;
    this.deliveryNoteService = deliveryNoteService;
  }

  public void sendDeliveryNote(Long id, DeliveryNoteEmailRequest request) {
    DeliveryNoteResponse response = deliveryNoteService.getDeliveryNoteById(id);
    byte[] pdf = documentService.getCachedOrGenerate(response);
    MimeMessage message = mailSender.createMimeMessage();
    try {
      MimeMessageHelper helper = new MimeMessageHelper(message, true);
      helper.setTo(asArray(request.getRecipients()));
      helper.setSubject(request.getSubject());
      helper.setText(
          request.getMessage() != null ? request.getMessage() : "Delivery note attached.",
          false);
      helper.addAttachment(
          "DeliveryNote-" + (response.getDnNumber() != null ? response.getDnNumber() : id) + ".pdf",
          new ByteArrayResource(pdf));
      mailSender.send(message);
    } catch (MessagingException ex) {
      throw new BusinessRuleException("Unable to send delivery note email.", ex);
    }
  }

  private String[] asArray(List<String> recipients) {
    return recipients.toArray(new String[0]);
  }
}
