// ==UserScript==
// @name         APKPure Captcha Overlay
// @namespace    https://apkpure.com/
// @match        *://i.apkpure.com/captchas*
// @match        *://*.apkpure.com/captchas*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const overlayId = 'apkpure-captcha-overlay';
  const isFullscreenMode = location.hostname === 'i.apkpure.com' && /^\/captchas(?:\/|$)/i.test(location.pathname);
  const countryCodes = [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'CM', 'CV', 'CI', 'EG', 'GA', 'GH', 'GW', 'KE', 'ML', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'SN', 'ZA', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
    'AG', 'AR', 'AW', 'BS', 'BZ', 'BO', 'BR', 'CA', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HT', 'HN', 'JM', 'MX', 'NI', 'PA', 'PY', 'PE', 'TT', 'US', 'UY', 'VE',
    'AM', 'AZ', 'BH', 'BD', 'KH', 'CN', 'CY', 'HK', 'IN', 'ID', 'IR', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MM', 'NP', 'OM', 'PK', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'TW', 'TJ', 'TH', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE',
    'AL', 'AT', 'AN', 'BY', 'BE', 'BA', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MK', 'MT', 'MD', 'NL', 'NO', 'PL', 'PT', 'RO', 'RU', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB',
    'AU', 'FJ', 'NZ', 'PG', 'ZZ'
  ];

  function getPackageIdFromPage() {
    const metaAppId = document.querySelector('meta[property="og:app_id"]');
    if (metaAppId && metaAppId.getAttribute('content')) {
      return metaAppId.getAttribute('content').trim();
    }

    const pathMatch = location.pathname.match(/(?:\/apk\/|\/download\/)([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    return '';
  }

  function buildCopyButton(url) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'apkpure-overlay-copy-btn';
    button.textContent = 'Copy Download Link';
    button.title = url;

    button.addEventListener('click', async function () {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          button.textContent = 'Link Copied';
        } else {
          const tempInput = document.createElement('textarea');
          tempInput.value = url;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          tempInput.remove();
          button.textContent = 'Link Copied';
        }
      } catch (err) {
        button.textContent = 'Copy Failed';
      }

      setTimeout(function () {
        button.textContent = 'Copy Download Link';
      }, 1800);
    });

    return button;
  }

  function buildOpenInNewTabButton(url) {
    const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://apkpure.com' + url;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open in New Tab';
    link.title = fullUrl;
    link.style.display = 'inline-block';
    link.style.width = '100%';
    link.style.height = '42px';
    link.style.lineHeight = '42px';
    link.style.textAlign = 'center';
    link.style.textDecoration = 'none';
    link.style.borderRadius = '8px';
    link.style.background = '#198754';
    link.style.color = '#fff';
    link.style.fontSize = '15px';
    link.style.fontWeight = '600';
    link.style.cursor = 'pointer';
    return link;
  }

  function makeCaptchaUrl() {
    return 'https://i.apkpure.com/captcha?ts=' + Date.now();
  }

  function injectOverlay() {
    if (document.getElementById(overlayId)) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.id = overlayId;
    wrapper.style.position = 'fixed';
    wrapper.style.zIndex = '2147483647';
    wrapper.style.fontFamily = 'Arial, sans-serif';
    wrapper.style.color = '#1f2937';

    if (isFullscreenMode) {
      wrapper.style.inset = '0';
      wrapper.style.width = '100vw';
      wrapper.style.height = '100vh';
      wrapper.style.background = 'rgba(15, 23, 42, 0.55)';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.padding = '20px';
      wrapper.style.boxSizing = 'border-box';
    } else {
      wrapper.style.right = '18px';
      wrapper.style.bottom = '18px';
      wrapper.style.width = '420px';
      wrapper.style.maxWidth = 'calc(100vw - 24px)';
      wrapper.style.background = '#ffffff';
      wrapper.style.border = '1px solid rgba(0,0,0,0.1)';
      wrapper.style.borderRadius = '12px';
      wrapper.style.boxShadow = '0 12px 24px rgba(0,0,0,0.16)';
      wrapper.style.padding = '16px';
    }

    const panel = document.createElement('div');
    if (isFullscreenMode) {
      panel.style.width = '420px';
      panel.style.maxWidth = '420px';
    } else {
      panel.style.width = '100%';
      panel.style.maxWidth = 'none';
    }
    panel.style.background = '#ffffff';
    panel.style.border = '1px solid rgba(0,0,0,0.1)';
    panel.style.borderRadius = '12px';
    panel.style.boxShadow = '0 12px 24px rgba(0,0,0,0.16)';
    panel.style.padding = '16px';
    panel.style.boxSizing = 'border-box';

    const title = document.createElement('div');
    title.textContent = 'APKPure Download Helper';
    title.style.fontSize = '15px';
    title.style.fontWeight = '700';
    title.style.marginBottom = '12px';

    const packageWrap = document.createElement('div');
    packageWrap.style.marginBottom = '12px';

    const packageLabel = document.createElement('label');
    packageLabel.textContent = 'Package ID';
    packageLabel.style.display = 'block';
    packageLabel.style.marginBottom = '6px';
    packageLabel.style.fontSize = '12px';
    packageLabel.style.fontWeight = '600';

    const packageInput = document.createElement('input');
    packageInput.type = 'text';
    packageInput.value = getPackageIdFromPage();
    packageInput.placeholder = 'e.g com.facebook.katana';
    packageInput.style.width = '100%';
    packageInput.style.boxSizing = 'border-box';
    packageInput.style.height = '38px';
    packageInput.style.border = '1px solid #d1d5db';
    packageInput.style.borderRadius = '8px';
    packageInput.style.padding = '0 10px';
    packageInput.style.fontSize = '14px';

    packageWrap.appendChild(packageLabel);
    packageWrap.appendChild(packageInput);

    const captchaRow = document.createElement('div');
    captchaRow.style.display = 'flex';
    captchaRow.style.alignItems = 'center';
    captchaRow.style.gap = '10px';
    captchaRow.style.marginBottom = '12px';

    const captchaInputWrap = document.createElement('div');
    captchaInputWrap.style.flex = '1';

    const captchaLabel = document.createElement('label');
    captchaLabel.textContent = 'Captcha';
    captchaLabel.style.display = 'block';
    captchaLabel.style.marginBottom = '6px';
    captchaLabel.style.fontSize = '12px';
    captchaLabel.style.fontWeight = '600';

    const captchaInput = document.createElement('input');
    captchaInput.type = 'text';
    captchaInput.placeholder = 'xxxx';
    captchaInput.maxLength = 8;
    captchaInput.style.width = '100%';
    captchaInput.style.boxSizing = 'border-box';
    captchaInput.style.height = '38px';
    captchaInput.style.border = '1px solid #d1d5db';
    captchaInput.style.borderRadius = '8px';
    captchaInput.style.padding = '0 10px';
    captchaInput.style.fontSize = '14px';

    captchaInputWrap.appendChild(captchaLabel);
    captchaInputWrap.appendChild(captchaInput);

    const captchaImage = document.createElement('img');
    captchaImage.alt = 'captcha';
    captchaImage.src = makeCaptchaUrl();
    captchaImage.width = 80;
    captchaImage.height = 30;
    captchaImage.style.width = '80px';
    captchaImage.style.height = '30px';
    captchaImage.style.border = '1px solid #d1d5db';
    captchaImage.style.borderRadius = '6px';
    captchaImage.style.objectFit = 'cover';
    captchaImage.style.cursor = 'pointer';
    captchaImage.style.background = '#fff';
    captchaImage.title = 'Click to reload captcha';

    const countrySelect = document.createElement('select');
    countrySelect.setAttribute('aria-label', 'Country');
    countrySelect.style.width = '118px';
    countrySelect.style.height = '38px';
    countrySelect.style.border = '1px solid #d1d5db';
    countrySelect.style.borderRadius = '8px';
    countrySelect.style.padding = '0 6px';
    countrySelect.style.fontSize = '13px';
    const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    countryCodes.forEach(function (code) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = code === 'AN' ? 'Netherlands Antilles' : countryDisplayNames.of(code);
      countrySelect.appendChild(option);
    });
    countrySelect.value = 'US';

    captchaRow.appendChild(captchaInputWrap);
    captchaRow.appendChild(captchaImage);
    captchaRow.appendChild(countrySelect);

    const sendButton = document.createElement('button');
    sendButton.type = 'button';
    sendButton.textContent = 'Send';
    sendButton.style.width = '100%';
    sendButton.style.height = '42px';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '8px';
    sendButton.style.background = '#0d6efd';
    sendButton.style.color = '#fff';
    sendButton.style.fontSize = '15px';
    sendButton.style.fontWeight = '600';
    sendButton.style.cursor = 'pointer';
    sendButton.style.marginBottom = '8px';

    const statusMessage = document.createElement('div');
    statusMessage.style.minHeight = '20px';
    statusMessage.style.fontSize = '12px';
    statusMessage.style.color = '#dc2626';
    statusMessage.style.marginBottom = '8px';

    const resultContainer = document.createElement('div');
    resultContainer.style.display = 'flex';
    resultContainer.style.flexDirection = 'column';
    resultContainer.style.gap = '8px';

    function setStatus(message, isError) {
      statusMessage.textContent = message || '';
      statusMessage.style.color = isError ? '#dc2626' : '#16a34a';
    }

    function clearResult() {
      resultContainer.innerHTML = '';
    }

    function reloadCaptcha() {
      captchaImage.src = makeCaptchaUrl();
    }

    function parsePayload(responseText) {
      if (!responseText) {
        return null;
      }
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start === -1 || end === -1 || end < start) {
        return null;
      }
      const jsonText = responseText.slice(start, end + 1);
      try {
        return JSON.parse(jsonText);
      } catch (err) {
        return null;
      }
    }

    function handleResponse(payload) {
      if (!payload || typeof payload !== 'object') {
        setStatus('Unexpected captcha response.', true);
        reloadCaptcha();
        return;
      }

      if (payload.status_code === 'CAPTCHA_ERROR') {
        captchaInput.value = '';
        setStatus('Captcha error. Please try again.', true);
        reloadCaptcha();
        return;
      }

      if (payload.status_code === 'APK_HAS_VERSION' && payload.url) {
        captchaInput.value = '';
        clearResult();
        const openLink = buildOpenInNewTabButton(payload.url);
        resultContainer.appendChild(openLink);
        setStatus('App version found.', false);
        reloadCaptcha();
        return;
      }

      if (payload.status_code === 'SUCCESS' && payload.down_url) {
        captchaInput.value = '';
        clearResult();
        const copyButton = buildCopyButton(payload.down_url);
        resultContainer.appendChild(copyButton);
        setStatus('Download link ready.', false);
        reloadCaptcha();
        return;
      }

      setStatus('Unexpected server response.', true);
      reloadCaptcha();
    }

    function sendRequest() {
      const packageId = packageInput.value.trim();
      const captcha = captchaInput.value.trim();

      if (!packageId) {
        setStatus('Please enter a package ID.', true);
        return;
      }

      if (!captcha) {
        setStatus('Please enter the captcha.', true);
        return;
      }

      clearResult();
      setStatus('', false);
      sendButton.disabled = true;
      sendButton.textContent = 'Sending...';

      const callbackName = 'jQuery' + Date.now() + Math.floor(Math.random() * 10000);
      const requestUrl = 'https://i.apkpure.com/api/v1/region_download' +
        '?callback=' + encodeURIComponent(callbackName) +
        '&region=' + encodeURIComponent(countrySelect.value) +
        '&captcha=' + encodeURIComponent(captcha) +
        '&package_name=' + encodeURIComponent(packageId) +
        '&_=' + Date.now();

      GM_xmlhttpRequest({
        method: 'GET',
        url: requestUrl,
        responseType: 'text',
        onload: function (response) {
          const payload = parsePayload(response.responseText || '');
          handleResponse(payload);
          sendButton.disabled = false;
          sendButton.textContent = 'Send';
        },
        onerror: function () {
          setStatus('Request failed. Please try again.', true);
          reloadCaptcha();
          sendButton.disabled = false;
          sendButton.textContent = 'Send';
        }
      });
    }

    packageInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        captchaInput.focus();
      }
    });

    captchaInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendRequest();
      }
    });

    sendButton.addEventListener('click', sendRequest);
    captchaImage.addEventListener('click', function () {
      captchaInput.value = '';
      reloadCaptcha();
    });
    captchaImage.addEventListener('error', function () {
      reloadCaptcha();
    });

    panel.appendChild(title);
    panel.appendChild(packageWrap);
    panel.appendChild(captchaRow);
    panel.appendChild(sendButton);
    panel.appendChild(statusMessage);
    panel.appendChild(resultContainer);

    wrapper.appendChild(panel);
    document.body.appendChild(wrapper);
  }

  injectOverlay();
})();
