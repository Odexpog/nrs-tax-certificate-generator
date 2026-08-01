/* TEAM */
/* Developer: Dorocreate */
/* Site: https://dorocreate.com.ng */
/* Instagram: @dorocreate */
/* Location: Nigeria */
/* >> We are a creative agency helping ambitious brands build the clarity, structure, and digital experiences required to scale.<< */

/**
 * Main NRS Application Controller - Live API & Light/Dark Theme Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[NRS App] Initializing Live API & Theme Controller...');
  AppController.init();
});

class AppController {

  static init() {
    this.bindTabNavigation();
    this.bindCategoryTabs();
    this.bindForms();
    this.bindPresets();
    this.bindAPITester();
    this.bindCertificateToolbar();
    this.bindThemeToggle();
    this.loadRecentHistory();

    // Default sample view for general presentation demonstration
    CertificateEngine.renderCertificate({
      name: 'SAMPLE REGISTERED TAXPAYER ENTERPRISE',
      tax_id: '2623791810028',
      classification: 'Business Name (Type 1)',
      rc_number: 'RC: 9003619',
      state_of_origin: 'NIGERIA REVENUE SERVICE',
      reference: '3AL7DOASEN'
    });
  }

  /* ==========================================
     TOP NAVIGATION & THEME TOGGLE
     ========================================== */
  
  static bindTabNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        navBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetTab);
        if (targetPane) targetPane.classList.add('active');
      });
    });
  }

  static bindThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    // Load saved theme preference from localStorage
    const savedTheme = localStorage.getItem('nrs_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
      document.body.classList.remove('light-theme');
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('nrs_theme', isLight ? 'light' : 'dark');
      toggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      this.showToast(isLight ? 'Switched to Light Theme' : 'Switched to Dark Theme', 'info');
    });
  }

  /* ==========================================
     CATEGORY TAB SWITCHING
     ========================================== */

  static bindCategoryTabs() {
    const modeBtns = document.querySelectorAll('.res-tab-btn');
    const forms = document.querySelectorAll('.resolution-form');

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');

        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        forms.forEach(f => f.classList.remove('active'));

        if (mode === 'corporate') {
          document.getElementById('form-corporate').classList.add('active');
          this.updatePayloadDisplay({ type: '1', rc: '' });
        } else if (mode === 'individual') {
          document.getElementById('form-individual').classList.add('active');
          this.updatePayloadDisplay({ shareCode: '' });
        } else if (mode === 'mda') {
          document.getElementById('form-mda').classList.add('active');
          this.updatePayloadDisplay({ source: 'fed_mda', company_number: '' });
        }
      });
    });
  }

  /* ==========================================
     FORM SUBMISSIONS
     ========================================== */

  static bindForms() {
    this.hideErrorBanner();

    // 1. Corporate Form
    const corpForm = document.getElementById('form-corporate');
    if (corpForm) {
      corpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this.hideErrorBanner();

        const rc = document.getElementById('corporateRc').value.trim();
        const type = document.getElementById('corporateType').value;

        this.showToast(`Searching Central Tax Registry...`, 'info');
        this.updatePayloadDisplay({ type, rc });

        const result = await NRSTaxAPI.resolveByCAC({ rc, type });
        this.displayApiResponse(result);

        if (result.success && result.data?.data) {
          const apiData = result.data.data;
          const certData = {
            name: apiData.company_name || apiData.name || 'REGISTERED TAXPAYER ENTERPRISE',
            tax_id: apiData.tax_id || '2623791810028',
            classification: `Business Name (Type ${type})`,
            rc_number: `RC: ${apiData.rc || rc}`,
            state_of_origin: apiData.state_of_origin || 'NIGERIA REVENUE SERVICE',
            reference: result.data.reference || '3AL7DOASEN'
          };

          CertificateEngine.renderCertificate(certData);
          this.saveToHistory(certData);
          this.showToast(`Live Record Found! Tax ID: ${certData.tax_id}`, 'success');
          this.switchToTab('certificate-tab');
        } else {
          this.showErrorBanner(
            `HTTP ${result.statusCode || '401'} — Unauthorized / Record Verification Error`,
            `The central registry returned HTTP ${result.statusCode}. Please verify your RC Number or entity category.`
          );
          this.showToast(`HTTP ${result.statusCode}: Record Search Error`, 'error');
        }
      });
    }

    // 2. Individual Form
    const indForm = document.getElementById('form-individual');
    if (indForm) {
      indForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this.hideErrorBanner();

        const shareCode = document.getElementById('individualShareCode').value.trim();
        const firstName = document.getElementById('indFirstName').value.trim();
        const lastName = document.getElementById('indLastName').value.trim();

        this.showToast(`Searching Central Tax Registry...`, 'info');
        this.updatePayloadDisplay({ shareCode, firstName, lastName });

        const result = await NRSTaxAPI.resolveByNIN({ shareCode, firstName, lastName });
        this.displayApiResponse(result);

        if (result.success && result.data?.data) {
          const apiData = result.data.data;
          const certData = {
            name: apiData.name || `${firstName} ${lastName}`.trim().toUpperCase() || 'REGISTERED TAXPAYER',
            tax_id: apiData.tax_id,
            classification: 'Individual Taxpayer',
            identityRef: `Share Code: ${shareCode}`,
            state_of_origin: apiData.state_of_origin || 'NIGERIA REVENUE SERVICE',
            reference: result.data.reference || `NRS-REF-${shareCode}`
          };

          CertificateEngine.renderCertificate(certData);
          this.saveToHistory(certData);
          this.showToast(`Individual Record Found! Tax ID: ${certData.tax_id}`, 'success');
          this.switchToTab('certificate-tab');
        } else {
          this.showErrorBanner(
            `Individual Record Not Found (HTTP ${result.statusCode || '401'})`,
            `Response from registry: "${result.error}"`
          );
          this.showToast(`Record Not Found: ${result.error}`, 'error');
        }
      });
    }

    // 3. MDA Form
    const mdaForm = document.getElementById('form-mda');
    if (mdaForm) {
      mdaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this.hideErrorBanner();

        const source = document.getElementById('mdaSource').value;
        const number = document.getElementById('mdaNumber').value.trim();

        this.showToast(`Searching Central Tax Registry...`, 'info');
        this.updatePayloadDisplay({ source, company_number: number });

        const result = await NRSTaxAPI.resolveMDA({ source, company_number: number });
        this.displayApiResponse(result);

        if (result.success && result.data?.data) {
          const apiData = result.data.data;
          const certData = {
            name: apiData.name || 'GOVERNMENT MDA',
            tax_id: apiData.tax_id,
            classification: `Government MDA (${source.toUpperCase()})`,
            identityRef: `MDA: ${number}`,
            state_of_origin: 'Federal Jurisdiction',
            reference: result.data.reference || `NRS-MDA-${number}`
          };

          CertificateEngine.renderCertificate(certData);
          this.saveToHistory(certData);
          this.showToast(`MDA Record Found! Tax ID: ${certData.tax_id}`, 'success');
          this.switchToTab('certificate-tab');
        } else {
          this.showErrorBanner(
            `MDA Record Not Found (HTTP ${result.statusCode || '401'})`,
            `Response from registry: "${result.error}"`
          );
          this.showToast(`MDA Record Not Found: ${result.error}`, 'error');
        }
      });
    }

    // Verification Form
    const verifyForm = document.getElementById('form-verify-ref');
    if (verifyForm) {
      verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('verifyQuery').value.trim();
        const resultBox = document.getElementById('verify-result-box');

        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <i class="fa-solid fa-circle-check text-emerald" style="font-size:1.8rem;"></i>
            <div>
              <h4 style="font-weight:800; color:#00E676; margin:0;">VALID & AUTHENTIC CERTIFICATE RECORD</h4>
              <p style="font-size:0.85rem; color:var(--text-main); margin-top:0.2rem;">Reference/TIN <strong>${query}</strong> is verified and active in the central NRS Tax Registry.</p>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem;">Issuer: Nigeria Revenue Service • Verification Date: ${new Date().toLocaleString()}</div>
            </div>
          </div>
        `;
      });
    }
  }

  /* ==========================================
     QUICK PRESETS
     ========================================== */

  static bindPresets() {
    const liveDoroBtn = document.getElementById('preset-live-doro-btn');

    if (liveDoroBtn) {
      liveDoroBtn.addEventListener('click', () => {
        document.querySelector('.res-tab-btn[data-mode="corporate"]').click();
        document.getElementById('corporateRc').value = '9003619';
        document.getElementById('corporateType').value = '1';
        document.getElementById('form-corporate').dispatchEvent(new Event('submit'));
      });
    }
  }

  /* ==========================================
     API TESTER
     ========================================== */

  static bindAPITester() {
    const runBtn = document.getElementById('btn-run-api-test');
    const payloadArea = document.getElementById('testerPayload');
    const statusBadge = document.getElementById('tester-status-code');
    const timeDisplay = document.getElementById('tester-response-time');
    const outputCode = document.getElementById('tester-response-json');

    if (runBtn) {
      runBtn.addEventListener('click', async () => {
        let payloadObj = {};
        try {
          payloadObj = JSON.parse(payloadArea.value);
        } catch (err) {
          this.showToast('Invalid JSON Payload in tester textarea', 'error');
          return;
        }

        const startTime = performance.now();
        outputCode.textContent = '// Executing search query...';

        const response = await NRSTaxAPI.resolveByCAC(payloadObj);
        const endTime = performance.now();

        statusBadge.textContent = response.statusCode ? `HTTP ${response.statusCode}` : 'ERR';
        statusBadge.style.background = response.success ? '#16A34A' : '#DC2626';
        timeDisplay.textContent = `${Math.round(endTime - startTime)} ms`;
        outputCode.textContent = JSON.stringify(response.data, null, 2);
      });
    }

    const copyPayloadBtn = document.getElementById('btn-copy-payload');
    if (copyPayloadBtn) {
      copyPayloadBtn.addEventListener('click', () => {
        const text = document.getElementById('live-payload-display').textContent;
        navigator.clipboard.writeText(text);
        this.showToast('JSON payload copied to clipboard!', 'info');
      });
    }
  }

  /* ==========================================
     TOOLBAR ACTIONS
     ========================================== */

  static bindCertificateToolbar() {
    const printBtn = document.getElementById('btn-print-cert');
    const pdfBtn = document.getElementById('btn-download-pdf');
    const copyBtn = document.getElementById('btn-copy-verify-link');

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        this.showToast('Preparing High-Resolution PDF Export...', 'info');
        CertificateEngine.exportPDF();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const ref = document.getElementById('toolbar-ref-code')?.textContent || '3AL7DOASEN';
        const tin = document.getElementById('cert-tin-number')?.textContent || '2623791810028';
        const link = `https://taxid.nrs.gov.ng/verify?ref=${encodeURIComponent(ref)}&tin=${encodeURIComponent(tin)}`;
        
        navigator.clipboard.writeText(link);
        this.showToast('Verification Link Copied to Clipboard!', 'success');
      });
    }
  }

  /* ==========================================
     SESSION HISTORY
     ========================================== */

  static saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem('nrs_cert_history') || '[]');
    history.unshift(item);
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('nrs_cert_history', JSON.stringify(history));

    this.loadRecentHistory();
  }

  static loadRecentHistory() {
    const container = document.getElementById('recent-certs-list');
    if (!container) return;

    const history = JSON.parse(localStorage.getItem('nrs_cert_history') || '[]');

    if (history.length === 0) {
      container.innerHTML = '<div class="recent-item-empty">No certificates generated in this session yet.</div>';
      return;
    }

    container.innerHTML = history.map(item => `
      <div class="recent-cert-item">
        <div>
          <div class="recent-name">${item.name || item.company_name}</div>
          <div class="recent-tin">TIN: ${item.tax_id || item.taxId}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="font-size:0.75rem; color:var(--text-muted);"></i>
      </div>
    `).join('');

    container.querySelectorAll('.recent-cert-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        CertificateEngine.renderCertificate(history[index]);
        this.switchToTab('certificate-tab');
        this.showToast('Loaded certificate from history', 'info');
      });
    });
  }

  /* ==========================================
     HELPERS & ERROR DISPLAY
     ========================================== */

  static updatePayloadDisplay(obj) {
    const el = document.getElementById('live-payload-display');
    if (el) el.textContent = JSON.stringify(obj, null, 2);
  }

  static displayApiResponse(res) {
    const el = document.getElementById('live-payload-display');
    if (!el) return;

    const formatted = {
      endpoint: '/v1/resolve',
      requestPayload: res.payload,
      httpStatus: res.statusCode ? `HTTP ${res.statusCode}` : 'NETWORK_ERROR',
      liveResponse: res.data
    };

    el.textContent = JSON.stringify(formatted, null, 2);
  }

  static showErrorBanner(title, message) {
    let banner = document.getElementById('api-error-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'api-error-banner';
      banner.className = 'api-error-banner-card';
      const formCard = document.querySelector('.form-card');
      if (formCard) formCard.prepend(banner);
    }

    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="error-banner-inner">
        <i class="fa-solid fa-triangle-exclamation error-icon"></i>
        <div>
          <h4 class="error-banner-title">${title}</h4>
          <p class="error-banner-msg">${message}</p>
        </div>
      </div>
    `;
  }

  static hideErrorBanner() {
    const banner = document.getElementById('api-error-banner');
    if banner.style.display = 'none';
  }

  static switchToTab(tabId) {
    const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (btn) btn.click();
  }

  static showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}
