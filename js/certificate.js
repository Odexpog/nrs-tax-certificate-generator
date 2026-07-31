/* TEAM */
/* Developer: Dorocreate */
/* Site: https://dorocreate.com.ng */
/* Twitter: @dorocreate */
/* Location: Nigeria */
/* >> We are a creative agency helping ambitious brands build the clarity, structure, and digital experiences required to scale.<< */

/**
 * Official NRS Landscape Tax Certificate Engine
 * Replicates the exact official NRS PDF template (1:1 Match).
 * Generates JSON QR code payload: {"Type":"Corporate TIN","Name":"...","TIN":"...","RC":"...","Date":"YYYY-MM-DD"}
 */

class CertificateEngine {

  /**
   * Renders Taxpayer details onto the official landscape Certificate template
   * @param {Object} data 
   */
  static renderCertificate(data) {
    console.log('[CERTIFICATE ENGINE] Rendering official landscape certificate:', data);

    const nameEl = document.getElementById('cert-taxpayer-name');
    const tinEl = document.getElementById('cert-tin-number');
    const stateEl = document.getElementById('cert-state-jurisdiction');
    const dateEl = document.getElementById('cert-issue-date');
    const toolbarRef = document.getElementById('toolbar-ref-code');

    const taxpayerName = data.name || data.company_name || 'ADO (EKITI) PECULIAR PEOPLE COOPERATIVE MULTIPURPOSE SOCIETY LIMITED';
    const taxId = data.tax_id || data.taxId || '2527061676440';
    const rcNumber = data.rc || data.rc_number || '3998552';
    const cleanRc = String(rcNumber).replace(/[^0-9]/g, '') || '3998552';
    const taxAuthority = 'NIGERIA REVENUE SERVICE';
    const referenceCode = data.reference || '3AL7DOASEN';

    const formattedDisplayDate = this.getFormattedDisplayDate(); // e.g. "29 Jul 2026"
    const formattedIsoDate = this.getIsoDate(); // e.g. "2026-07-29"

    if (nameEl) nameEl.textContent = taxpayerName.toUpperCase();
    if (tinEl) tinEl.textContent = taxId;
    if (stateEl) stateEl.textContent = taxAuthority;
    if (dateEl) dateEl.textContent = formattedDisplayDate;
    if (toolbarRef) toolbarRef.textContent = referenceCode;

    // Exact QR JSON Data Payload:
    // {"Type":"Corporate TIN","Name":"...","TIN":"...","RC":"...","Date":"2026-07-29"}
    const qrPayloadObj = {
      Type: data.classification?.includes('Individual') ? 'Individual TIN' : 'Corporate TIN',
      Name: taxpayerName.toUpperCase(),
      TIN: String(taxId),
      RC: String(cleanRc),
      Date: formattedIsoDate
    };

    const qrDataString = JSON.stringify(qrPayloadObj);
    console.log('[CERTIFICATE ENGINE] Encoded QR JSON Payload:', qrDataString);

    this.generateQRCode(qrDataString);

    // Show ready indicator
    const certDot = document.getElementById('cert-ready-dot');
    if (certDot) certDot.style.display = 'inline-block';
  }

  /**
   * Generates QR Code inside red box
   */
  static generateQRCode(text) {
    const qrContainer = document.getElementById('cert-qr-code');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';

    if (window.QRCode) {
      try {
        new QRCode(qrContainer, {
          text: text,
          width: 170,
          height: 170,
          colorDark: "#000000",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        this.renderFallbackQR(qrContainer);
      }
    } else {
      this.renderFallbackQR(qrContainer);
    }
  }

  /**
   * Vector Fallback SVG QR Code
   */
  static renderFallbackQR(container) {
    container.innerHTML = `
      <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
        <rect width="100" height="100" fill="#FFF"/>
        <rect x="10" y="10" width="30" height="30" fill="#C83B1F"/>
        <rect x="15" y="15" width="20" height="20" fill="#FFF"/>
        <rect x="20" y="20" width="10" height="10" fill="#C83B1F"/>
        
        <rect x="60" y="10" width="30" height="30" fill="#C83B1F"/>
        <rect x="65" y="15" width="20" height="20" fill="#FFF"/>
        <rect x="70" y="20" width="10" height="10" fill="#C83B1F"/>
        
        <rect x="10" y="60" width="30" height="30" fill="#C83B1F"/>
        <rect x="15" y="65" width="20" height="20" fill="#FFF"/>
        <rect x="20" y="70" width="10" height="10" fill="#C83B1F"/>

        <rect x="50" y="50" width="15" height="15" fill="#C83B1F"/>
        <rect x="70" y="65" width="15" height="15" fill="#C83B1F"/>
      </svg>
    `;
  }

  /**
   * Single-Page PDF Export Handler (Guarantees exactly 1 page PDF with 0 blank extra pages)
   */
  static exportPDF() {
    const node = document.getElementById('printable-certificate-node');
    if (!node) return;

    const name = document.getElementById('cert-taxpayer-name')?.textContent || 'Taxpayer';
    const filename = `NRS_Tax_Certificate_${name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    if (window.html2pdf) {
      // Lock container height to strictly fit within 1 A4 Landscape page (210mm)
      const originalMaxHeight = node.style.maxHeight;
      const originalOverflow = node.style.overflow;
      const originalBoxShadow = node.style.boxShadow;
      
      node.style.maxHeight = '208mm';
      node.style.overflow = 'hidden';
      node.style.boxShadow = 'none';

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
        pagebreak: { mode: 'avoid-all' }
      };

      html2pdf().set(opt).from(node).save().then(() => {
        // Restore original node styling after export
        node.style.maxHeight = originalMaxHeight;
        node.style.overflow = originalOverflow;
        node.style.boxShadow = originalBoxShadow;
      }).catch(err => {
        console.error('[PDF EXPORT ERROR]', err);
        node.style.maxHeight = originalMaxHeight;
        node.style.overflow = originalOverflow;
        node.style.boxShadow = originalBoxShadow;
      });
    } else {
      window.print();
    }
  }

  /**
   * Format Date: e.g. "29 Jul 2026"
   */
  static getFormattedDisplayDate() {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  /**
   * Format ISO Date: e.g. "2026-07-29"
   */
  static getIsoDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
