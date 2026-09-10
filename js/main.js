/**
 * Vansh Fire XROSS - Main UI Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile drawer navigation
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  const openDrawer = () => {
    if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('translate-x-full');
  };

  const closeDrawer = () => {
    if (mobileMenuDrawer) mobileMenuDrawer.classList.add('translate-x-full');
  };

  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDrawer();
    });
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeDrawer);
  }

  // Dismiss on outside click
  document.addEventListener('click', (e) => {
    if (
      mobileMenuDrawer &&
      !mobileMenuDrawer.contains(e.target) &&
      mobileMenuBtn &&
      !mobileMenuBtn.contains(e.target)
    ) {
      closeDrawer();
    }
  });

  // Dismiss on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Sticky header background transition on scroll
  const headerNav = document.getElementById('mainHeader');
  if (headerNav) {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        headerNav.classList.add('shadow-md', 'bg-white/98');
      } else {
        headerNav.classList.remove('shadow-md', 'bg-white/98');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // Product category filter tabs
  const productFilterBtns = document.querySelectorAll('.prod-filter-btn');
  const productCards = document.querySelectorAll('.product-card-item');

  if (productFilterBtns.length && productCards.length) {
    productFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        productFilterBtns.forEach(b => {
          b.classList.remove('active', 'bg-fireRed', 'text-white');
          b.classList.add('text-slate-600', 'hover:text-slate-900');
        });

        btn.classList.add('active', 'bg-fireRed', 'text-white');
        btn.classList.remove('text-slate-600', 'hover:text-slate-900');

        const category = btn.getAttribute('data-filter') || 'all';

        productCards.forEach(card => {
          const cardCat = card.getAttribute('data-category') || '';
          if (category === 'all' || cardCat.includes(category)) {
            card.classList.remove('hidden');
            card.classList.add('animate-fade-in');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // FAQ accordions
  const faqItems = document.querySelectorAll('.faq-item, .faq-item-light');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // Active / Passive view toggle
  const deployTabs = document.querySelectorAll('.deploy-mode-btn');
  const deployPassiveView = document.getElementById('deployPassiveView');
  const deployActiveView = document.getElementById('deployActiveView');

  if (deployTabs.length) {
    deployTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        deployTabs.forEach(t => {
          t.classList.remove('active', 'bg-white', 'text-fireRed', 'shadow-sm', 'border-slate-200');
          t.classList.add('text-slate-600');
        });
        tab.classList.add('active', 'bg-white', 'text-fireRed', 'shadow-sm', 'border', 'border-slate-200');
        tab.classList.remove('text-slate-600');

        const target = tab.getAttribute('data-deploy-target');
        if (target === 'passive') {
          if (deployPassiveView) deployPassiveView.classList.remove('hidden');
          if (deployActiveView) deployActiveView.classList.add('hidden');
        } else {
          if (deployPassiveView) deployPassiveView.classList.add('hidden');
          if (deployActiveView) deployActiveView.classList.remove('hidden');
        }
      });
    });
  }

  // Hero product subtle 3D tilt
  const ball3D = document.querySelector('.product-hero-image');
  if (ball3D && window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
      const rect = ball3D.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const rotateY = (e.clientX - centerX) / 45;
      const rotateX = (centerY - e.clientY) / 45;

      ball3D.style.transform = `perspective(800px) rotateY(${rotateY.toFixed(2)}deg) rotateX(${rotateX.toFixed(2)}deg)`;
    });
  }

  // Inquiry / Lead form submission
  const leadForm = document.getElementById('dealershipEnquiryForm') || document.getElementById('contactForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('leadName')?.value || document.getElementById('contactName')?.value || 'Client';
      const phone = document.getElementById('leadPhone')?.value || document.getElementById('contactPhone')?.value || '';
      const email = document.getElementById('leadEmail')?.value || document.getElementById('contactEmail')?.value || '';
      const city = document.getElementById('leadCity')?.value || document.getElementById('contactCity')?.value || '';
      const inquiryType = document.getElementById('leadInquiryType')?.value || document.getElementById('contactSubject')?.value || 'General Inquiry';
      const message = document.getElementById('leadMessage')?.value || document.getElementById('contactMessage')?.value || '';

      const lines = [
        '*New Inquiry via Vansh Fire XROSS Website*',
        '',
        `*Name:* ${name}`,
        `*Phone:* ${phone}`,
        `*Email:* ${email}`,
        `*Location:* ${city}`,
        `*Interest:* ${inquiryType}`,
        `*Requirement:* ${message || 'N/A'}`
      ];
      const encoded = encodeURIComponent(lines.join('\n'));

      const feedback = document.getElementById('formFeedbackMsg');
      if (feedback) {
        feedback.classList.remove('hidden');
        feedback.innerHTML = `
          <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm">
            <i class="fas fa-check-circle mr-2 text-emerald-600"></i> Thanks, <strong>${name}</strong>! Redirecting you to WhatsApp support...
          </div>
        `;
      }

      setTimeout(() => {
        window.open(`https://api.whatsapp.com/send?phone=918302550902&text=${encoded}`, '_blank');
      }, 800);
    });
  }

  // Datasheet download preview
  window.downloadDatasheet = function(modelName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in text-center">
        <div class="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-file-pdf text-2xl text-fireRed"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-1">Technical Datasheet</h3>
        <p class="text-xs text-slate-600 mb-6">
          Specifications & MSDS overview for <strong>${modelName}</strong>.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition">
            Close
          </button>
          <a href="assets/brochure.jpeg" download="${modelName.replace(/\s+/g, '-')}-Specifications.jpeg" onclick="this.closest('.fixed').remove()" class="btn-primary-red px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md">
            Download Sheet
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };
});

// Image Lightbox
window.openImageModal = function(imageSrc, captionText) {
  const modal = document.getElementById('imageLightboxModal');
  const img = document.getElementById('lightboxImage');
  const caption = document.getElementById('lightboxCaption');
  if (modal && img) {
    img.src = imageSrc;
    if (caption) caption.textContent = captionText || 'Product Preview';
    modal.classList.remove('hidden');
  }
};

window.closeImageModal = function() {
  const modal = document.getElementById('imageLightboxModal');
  if (modal) {
    modal.classList.add('hidden');
  }
};

