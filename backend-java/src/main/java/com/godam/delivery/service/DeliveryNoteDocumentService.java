package com.godam.delivery.service;

import com.godam.delivery.dto.DeliveryNoteResponse;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.springframework.stereotype.Service;

@Service
public class DeliveryNoteDocumentService {
  private final SpringTemplateEngine templateEngine;
  private final Map<Long, byte[]> pdfCache = new ConcurrentHashMap<>();

  public DeliveryNoteDocumentService(SpringTemplateEngine templateEngine) {
    this.templateEngine = templateEngine;
  }

  public byte[] generatePdf(DeliveryNoteResponse response) {
    byte[] pdf = renderToPdf(renderHtml(response));
    pdfCache.put(response.getId(), pdf);
    return pdf;
  }

  public byte[] getCachedOrGenerate(DeliveryNoteResponse response) {
    return pdfCache.computeIfAbsent(response.getId(), key -> renderToPdf(renderHtml(response)));
  }

  private String renderHtml(DeliveryNoteResponse response) {
    Context context = new Context();
    context.setVariable("dn", response);
    return templateEngine.process("delivery-note-preview", context);
  }

  private byte[] renderToPdf(String html) {
    try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      PdfRendererBuilder builder = new PdfRendererBuilder();
      builder.useFastMode();
      builder.withHtmlContent(html, "");
      builder.toStream(out);
      builder.run();
      return out.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to render delivery note PDF", ex);
    }
  }
}
