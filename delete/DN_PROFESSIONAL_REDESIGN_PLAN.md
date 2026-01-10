# DN Professional Redesign - Implementation Plan

## User Requirements (from feedback)

### 1. Header Section
- ❌ **Problem:** "Delivery to" box is big, "Warehouse detail" box is small
- ✅ **Solution:** Make both boxes **equal size** (50% width each)
- ❌ **Problem:** Borders look "shot thin"
- ✅ **Solution:** Make borders **thicker** (2px instead of 1.2px)

### 2. Table Headers
- ❌ **Problem:** Headers "not too good"
- ✅ **Solution:** Make headers **bold and dark** with white text
- ✅ **Solution:** Increase header font size and padding

### 3. Footer Section
- ❌ **Problem:** Driver info comes after dotted lines
- ✅ **Solution:** Move driver info **ABOVE** dotted lines
- ❌ **Problem:** "Receiving stamp box" present
- ✅ **Solution:** **Remove** the stamp box, keep only "Receiver Stamp" text
- ❌ **Problem:** "creator" shown in footer
- ✅ **Solution:** **Remove** creator from footer
- ❌ **Problem:** "checker and verifier name" not aligned
- ✅ **Solution:** Move verifier name **more to the right**

### 4. Body Text
- ❌ **Problem:** Body headers not bold/dark enough
- ✅ **Solution:** Make section headers **bold, dark, and uppercase**
- ❌ **Problem:** "DN" text not professional
- ✅ **Solution:** Change to "Delivery Note" with better styling

### 5. Totals Section
- ❌ **Problem:** "items total gross weight and cbm are to closer"
- ✅ **Solution:** Separate into **full-width lines**, not cramped

### 6. Page Numbering
- ❌ **Problem:** No page numbers for multiple pages
- ✅ **Solution:** Add **"Page X of Y"** system

## Implementation Steps

### Step 1: Update HTML CSS (_buildDnHtml function)

```css
/* Equal-sized boxes with thicker borders */
.delivery-to-box, .dispatched-from-box {
  flex: 1;
  border: 2px solid #000;
  padding: 8mm;
}

/* Dark table headers */
th {
  background-color: #1a1a1a;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  padding: 10px 8px;
  border: 2px solid #000;
}

/* Thicker borders everywhere */
table, th, td {
  border: 2px solid #000;
}

/* Bold section headers */
.section-header {
  font-weight: 700;
  font-size: 15px;
  color: #000;
  text-transform: uppercase;
  margin-bottom: 4mm;
}

/* Separate totals lines */
.totals-section {
  margin-top: 4mm;
  border: 2px solid #000;
  padding: 6mm;
}

.total-line {
  padding: 3mm 0;
  border-bottom: 1px solid #ddd;
  font-size: 13px;
  font-weight: 600;
}

.total-line:last-child {
  border-bottom: none;
}

/* Page numbers */
.page-number {
  position: fixed;
  bottom: 10mm;
  right: 10mm;
  font-size: 11px;
  font-weight: 600;
}
```

### Step 2: Update HTML Structure

```html
<!-- HEADER: Equal boxes -->
<div class="delivery-section">
  <div class="delivery-to-box">
    <div class="section-header">Delivery To:</div>
    <!-- content -->
  </div>
  <div class="dispatched-from-box">
    <div class="section-header">Dispatched From:</div>
    <!-- content -->
  </div>
</div>

<!-- TABLE: Dark headers -->
<table>
  <thead>
    <tr style="background-color: #1a1a1a;">
      <th style="color: #fff; font-weight: 700;">ITEM #</th>
      <th style="color: #fff; font-weight: 700;">PART NUMBER</th>
      <!-- ... -->
    </tr>
  </thead>
</table>

<!-- TOTALS: Separate lines -->
<div class="totals-section">
  <div class="total-line">
    <strong>Total Cases:</strong> 52 CASES
  </div>
  <div class="total-line">
    <strong>Gross Weight (KG):</strong> 618.0
  </div>
  <div class="total-line">
    <strong>Volume (CBM):</strong> 10.30
  </div>
</div>

<!-- FOOTER: Driver info ABOVE lines -->
<div class="driver-info-section">
  <div class="section-header">Delivery Information</div>
  <div><strong>Driver:</strong> Name | <strong>Mobile:</strong> +966...</div>
  <div><strong>Carrier:</strong> Company | <strong>Vehicle:</strong> Type</div>
</div>

<!-- Receiver fields with dotted lines -->
<div class="receiver-section">
  <div class="section-header">Receiver Confirmation</div>
  <div class="receiver-field">
    <span>NAME:</span>
    <span class="dotted-line">........................</span>
  </div>
  <!-- ... more fields ... -->
  
  <!-- Only stamp text, NO box -->
  <div class="stamp-text">Receiver Stamp</div>
  
  <!-- Verifier on right -->
  <div class="verifier-right">
    <strong>Verified by:</strong> verifier
  </div>
</div>

<!-- Page number -->
<div class="page-number">Page 1 of 1</div>
```

### Step 3: Update Preview Widget (_previewContent function)

Similar changes to Flutter widgets:
- Equal-sized Container widgets for delivery/dispatched
- Thicker borders (width: 2.0)
- Dark table headers with white text
- Separate totals rows
- Reorganized footer layout

## Files to Modify

1. **lib/screens/web/dn_creation_screen.dart**
   - `_buildDnHtml()` function (~200 lines)
   - `_previewContent()` function (~400 lines)

## Testing Checklist

- [ ] Header boxes are equal size
- [ ] Borders are thicker (2px)
- [ ] Table headers are dark with white text
- [ ] Driver info appears ABOVE dotted lines
- [ ] Stamp box removed, only text remains
- [ ] Creator removed from footer
- [ ] Verifier aligned to right
- [ ] Totals on separate lines
- [ ] Page numbers show correctly
- [ ] Print preview matches HTML export
- [ ] Multiple pages show correct page numbers

## Next Action

Implement changes to `_buildDnHtml()` function first, then `_previewContent()` function.
