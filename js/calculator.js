/**
 * Fire safety coverage and unit estimation calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  const facilityTypeEl = document.getElementById('calcFacilityType');
  const areaRangeEl = document.getElementById('calcAreaRange');
  const areaValueEl = document.getElementById('calcAreaValue');
  const hazardCheckboxes = document.querySelectorAll('.calc-hazard-check');
  const btnCalculate = document.getElementById('calcSubmitBtn');
  const btnWhatsAppQuote = document.getElementById('calcWhatsAppQuote');

  const outClassicEl = document.getElementById('calcOutClassic');
  const outCompactEl = document.getElementById('calcOutCompact');
  const outProEl = document.getElementById('calcOutPro');
  const outSavingsEl = document.getElementById('calcOutSavings');
  const outCoverageDescEl = document.getElementById('calcCoverageDesc');

  function calculateCoverage() {
    if (!facilityTypeEl || !areaRangeEl) return;

    const facility = facilityTypeEl.value;
    const areaSqFt = parseInt(areaRangeEl.value, 10) || 1200;
    
    let hazardCount = 0;
    hazardCheckboxes.forEach(cb => {
      if (cb.checked) hazardCount++;
    });

    let classicUnits = 0;
    let compactUnits = 0;
    let proUnits = 0;
    let annualServiceCostPerUnit = 1200;

    switch (facility) {
      case 'home':
        classicUnits = Math.max(1, Math.ceil(areaSqFt / 450));
        compactUnits = Math.max(1, hazardCount);
        proUnits = 0;
        break;

      case 'office':
        classicUnits = Math.max(2, Math.ceil(areaSqFt / 400));
        compactUnits = Math.max(1, hazardCount + 1);
        proUnits = areaSqFt > 3000 ? Math.ceil(areaSqFt / 2500) : 0;
        break;

      case 'server':
        classicUnits = Math.max(2, Math.ceil(areaSqFt / 250));
        compactUnits = Math.max(2, hazardCount * 2 + 1);
        proUnits = Math.max(1, Math.ceil(areaSqFt / 800));
        annualServiceCostPerUnit = 2500;
        break;

      case 'factory':
        classicUnits = Math.max(4, Math.ceil(areaSqFt / 300));
        compactUnits = Math.max(2, hazardCount);
        proUnits = Math.max(2, Math.ceil(areaSqFt / 1200));
        annualServiceCostPerUnit = 3500;
        break;

      case 'kitchen':
        classicUnits = Math.max(2, Math.ceil(areaSqFt / 250));
        compactUnits = Math.max(2, hazardCount + 1);
        proUnits = 0;
        break;

      case 'vehicle':
        classicUnits = 0;
        compactUnits = Math.max(1, Math.ceil(areaSqFt / 100));
        proUnits = 0;
        break;

      default:
        classicUnits = 2;
        compactUnits = 1;
        proUnits = 0;
    }

    // 5-year traditional vs autonomous ball cost projection
    const equivUnits = classicUnits + (compactUnits * 0.5) + (proUnits * 2);
    const traditional5Yr = Math.round((equivUnits * annualServiceCostPerUnit * 5) + (equivUnits * 1800));
    const ballCost5Yr = Math.round(equivUnits * 1400);
    const savings = Math.max(5000, traditional5Yr - ballCost5Yr);

    if (outClassicEl) outClassicEl.textContent = `${classicUnits} Units`;
    if (outCompactEl) outCompactEl.textContent = `${compactUnits} Units`;
    if (outProEl) outProEl.textContent = `${proUnits} Units`;
    if (outSavingsEl) outSavingsEl.textContent = `₹${savings.toLocaleString('en-IN')}`;

    if (outCoverageDescEl) {
      const perimeterCovered = (classicUnits * 8.5).toFixed(1);
      outCoverageDescEl.innerHTML = `
        <div class="text-xs text-slate-600 space-y-1.5">
          <p><i class="fas fa-shield-alt text-emerald-600 mr-1.5"></i> <strong>Strategic Placement:</strong> Mount 15–30 cm above ${hazardCount > 0 ? 'selected electrical & gas points' : 'identified fire risk zones'}.</p>
          <p><i class="fas fa-check-circle text-amber-600 mr-1.5"></i> <strong>Radial Span:</strong> 360° ABC dry chemical envelope covering ~${perimeterCovered} m² area.</p>
          <p><i class="fas fa-calendar-check text-blue-600 mr-1.5"></i> <strong>5-Year Warranty:</strong> 100% Maintenance-free readiness with zero refills.</p>
        </div>
      `;
    }
  }

  if (areaRangeEl && areaValueEl) {
    areaRangeEl.addEventListener('input', (e) => {
      areaValueEl.textContent = `${parseInt(e.target.value, 10).toLocaleString('en-IN')} sq. ft.`;
      calculateCoverage();
    });
  }

  if (facilityTypeEl) {
    facilityTypeEl.addEventListener('change', calculateCoverage);
  }

  hazardCheckboxes.forEach(cb => {
    cb.addEventListener('change', calculateCoverage);
  });

  if (btnCalculate) {
    btnCalculate.addEventListener('click', (e) => {
      e.preventDefault();
      calculateCoverage();
    });
  }

  if (btnWhatsAppQuote) {
    btnWhatsAppQuote.addEventListener('click', () => {
      const facility = facilityTypeEl ? facilityTypeEl.options[facilityTypeEl.selectedIndex].text : 'Premises';
      const area = areaRangeEl ? areaRangeEl.value : '1000';
      const classic = outClassicEl ? outClassicEl.textContent : '2';
      const compact = outCompactEl ? outCompactEl.textContent : '1';
      const pro = outProEl ? outProEl.textContent : '0';

      const lines = [
        'Hello Vansh Fire XROSS Team,',
        '',
        `I configured safety coverage on your website calculator for *${facility}* (${area} sq.ft.).`,
        '',
        '*Recommended Setup:*',
        `• Classic (1.3kg): ${classic}`,
        `• Compact (400g): ${compact}`,
        `• Pro Modular: ${pro}`,
        '',
        'Please send me official pricing and delivery lead time.'
      ];

      const url = `https://api.whatsapp.com/send?phone=918302550902&text=${encodeURIComponent(lines.join('\n'))}`;
      window.open(url, '_blank');
    });
  }

  calculateCoverage();
});
