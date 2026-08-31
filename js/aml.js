// ==================== AML SECURITY (отдельный модуль) ====================

const AML_LANG = {
  ru: {
    title: 'AML Security',
    desc: 'Проверьте TON-адрес на связи с высокорисковыми источниками: миксеры, санкционные адреса, даркнет-площадки',
    btn: 'Проверить адрес',
    placeholder: 'Введите TON-адрес (EQ... или UQ...)',
    cancel: 'Отмена',
    errorEmpty: 'Введите TON-адрес',
    errorFormat: 'Неверный формат адреса. Должен начинаться с EQ или UQ'
  },
  en: {
    title: 'AML Security',
    desc: 'Check TON address for links to high-risk sources: mixers, sanctioned addresses, darknet marketplaces',
    btn: 'Check Address',
    placeholder: 'Enter TON address (EQ... or UQ...)',
    cancel: 'Cancel',
    errorEmpty: 'Enter TON address',
    errorFormat: 'Invalid address format. Must start with EQ or UQ'
  },
  fr: {
    title: 'AML Security',
    desc: 'Vérifiez l\'adresse TON pour des liens avec des sources à haut risque : mixeurs, adresses sanctionnées, places de marché du darknet',
    btn: 'Vérifier l\'adresse',
    placeholder: 'Entrez l\'adresse TON (EQ... ou UQ...)',
    cancel: 'Annuler',
    errorEmpty: 'Entrez l\'adresse TON',
    errorFormat: 'Format d\'adresse invalide. Doit commencer par EQ ou UQ'
  },
  es: {
    title: 'AML Security',
    desc: 'Verifique la dirección TON para enlaces con fuentes de alto riesgo: mixers, direcciones sancionadas, mercados de la darknet',
    btn: 'Verificar dirección',
    placeholder: 'Ingrese la dirección TON (EQ... o UQ...)',
    cancel: 'Cancelar',
    errorEmpty: 'Ingrese la dirección TON',
    errorFormat: 'Formato de dirección inválido. Debe comenzar con EQ o UQ'
  }
};

function amlT() {
  return AML_LANG[currentLang] || AML_LANG.en;
}

function renderAmlCard() {
  const t = amlT();
  
  return `
    <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(0,204,255,0.15);padding:20px;text-align:center;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#00ccff,#7a2eff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">🛡️ ${t.title}</div>
      <div style="font-size:0.85rem;background:linear-gradient(90deg,#c8d0e0 0%,#ffffff 50%,#c8d0e0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px;line-height:1.5;">${t.desc}</div>
      <button onclick="openAmlModal()" style="position:relative;width:100%;height:80px;padding:0;background:none;border:none;cursor:pointer;border-radius:12px;overflow:hidden;">
        <img src="/main/btn_portfolio_action.webp" style="width:100%;height:100%;object-fit:fill;display:block;opacity:0.65;">
        <span style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;font-size:0.95rem;font-weight:700;background:linear-gradient(90deg,#00ccff 0%,#ffffff 50%,#00ccff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:1px;">🛡️ ${t.btn}</span>
      </button>
    </div>`;
}

function openAmlModal() {
  const existing = document.getElementById('amlModal');
  if (existing) existing.remove();
  
  const t = amlT();
  
  const modal = document.createElement('div');
  modal.id = 'amlModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
  
  modal.innerHTML = `
    <div style="background:rgba(10,15,30,0.98);border:1.5px solid rgba(220,220,225,0.5);border-radius:20px;padding:24px 20px;max-width:400px;width:90%;text-align:center;box-shadow:0 0 30px rgba(220,220,225,0.1);">
      <div style="font-size:2rem;margin-bottom:12px;">🛡️</div>
      <div style="font-size:1.1rem;font-weight:800;background:linear-gradient(90deg,#00ccff,#7a2eff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">${t.title}</div>
      <div style="font-size:0.85rem;color:#8899aa;margin-bottom:20px;line-height:1.5;">${t.desc}</div>
      
      <input id="amlAddress" placeholder="${t.placeholder}" style="width:100%;padding:12px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,204,255,0.3);border-radius:12px;color:#fff;font-size:0.85rem;outline:none;margin-bottom:16px;text-align:center;">
      
      <button onclick="openAmlCheck()" style="width:100%;padding:14px;background:linear-gradient(135deg,#00ccff,#7a2eff);border:none;border-radius:40px;font-size:0.9rem;font-weight:700;color:white;cursor:pointer;margin-bottom:10px;">
        🛡️ ${t.btn}
      </button>
      
      <button onclick="document.getElementById('amlModal').remove()" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:40px;font-size:0.85rem;font-weight:600;color:#8899aa;cursor:pointer;">
        ${t.cancel}
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Фокус на инпут
  setTimeout(() => {
    const input = document.getElementById('amlAddress');
    if (input) input.focus();
  }, 100);
}

function openAmlCheck() {
  const t = amlT();
  const addr = document.getElementById('amlAddress').value.trim();
  
  if (!addr) {
    showToast(t.errorEmpty, 2000);
    return;
  }
  
  if (!addr.startsWith('EQ') && !addr.startsWith('UQ') && !addr.startsWith('0:')) {
    showToast(t.errorFormat, 3000);
    return;
  }
  
  window.open(`https://misttrack.app/ru/address/${addr}`, '_blank');
}

// Глобальные функции
window.AML_LANG = AML_LANG;
window.renderAmlCard = renderAmlCard;
window.openAmlModal = openAmlModal;
window.openAmlCheck = openAmlCheck;
