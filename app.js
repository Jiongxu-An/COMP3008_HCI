const searchInput = document.getElementById('artist-search');
const clearButton = document.getElementById('clear-btn');
const tableBody = document.getElementById('exhibitor-tbody');
const categoryTabs = document.querySelectorAll('.category-tabs button');
let activeCategory = "Artists' Alley";

const modal = document.getElementById('exhibitor-modal');
const modalTitle = document.getElementById('modal-title');
const modalBooth = document.getElementById('modal-booth');
const modalBio = document.getElementById('modal-bio');
const modalWebsiteWrap = document.getElementById('modal-website-wrap');
const modalWebsite = document.getElementById('modal-website');
const modalArtworkWrap = document.getElementById('modal-artwork-wrap');
const modalArtworkList = document.getElementById('modal-artwork-list');

const lightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');

const mapFrame = document.querySelector('.map-frame');
const mapViewport = document.getElementById('map-viewport');
const mapStage = document.getElementById('map-stage');
const boothMarker = document.getElementById('booth-marker');
let mapZoom = 1;

function renderTable(items, queryText) {
  if (items.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="2" class="empty-cell">
          No results match "${queryText}".
          <button type="button" class="link-btn" id="inline-clear">Clear search</button>
        </td>
      </tr>`;
    document.getElementById('inline-clear').addEventListener('click', resetSearch);
    return;
  }

  tableBody.innerHTML = items
    .map(
      (item, index) => `
        <tr>
          <td><button type="button" class="table-link artist-link" data-index="${index}">${item.name}</button></td>
          <td><button type="button" class="table-link booth-link" data-index="${index}">${item.booth}</button></td>
        </tr>`
    )
    .join('');

  tableBody.querySelectorAll('.artist-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = items[btn.dataset.index];
      if (!item.bio) return;
      openModal(item);
    });
  });

  tableBody.querySelectorAll('.booth-link').forEach((btn) => {
    btn.addEventListener('click', () => highlightBooth(items[btn.dataset.index]));
  });
}

// Search across all categories when typing; otherwise show only the active tab
function filterExhibitors() {
  const rawQuery = searchInput.value.trim();
  const query = rawQuery.toLowerCase();
  const filtered = query
    ? DIRECTORY.filter((item) => item.name.toLowerCase().includes(query))
    : DIRECTORY.filter((item) => item.category === activeCategory);

  if (!filtered.some((item) => item.mapX)) {
    boothMarker.hidden = true;
  }

  renderTable(filtered, rawQuery);
}

function resetSearch() {
  searchInput.value = '';
  boothMarker.hidden = true;
  filterExhibitors();
}

function createArtworkHtml(exhibitorName, artwork) {
  const paragraphsHtml = artwork.paragraphs
    .map((text) => `<p>${text}</p>`)
    .join('');

  return `
    <div class="artwork-split">
      <div class="artwork-thumb-wrap">
        <button type="button" class="artwork-thumb-btn" title="Click to view original size">
          <img src="${artwork.image}" alt="${exhibitorName} - ${artwork.title}" />
        </button>
      </div>
      <div class="artwork-details">
        <h3>${artwork.title}</h3>
        <div class="artwork-box">
          ${paragraphsHtml}
          <p class="artwork-price">Price: ${artwork.price}</p>
        </div>
      </div>
    </div>`;
}

function openModal(exhibitor) {
  modalTitle.textContent = exhibitor.name;
  modalBooth.textContent = `Booth ${exhibitor.booth}`;
  modalBio.textContent = exhibitor.bio;

  if (exhibitor.website) {
    modalWebsiteWrap.hidden = false;
    modalWebsite.textContent = exhibitor.website;
    modalWebsite.href = exhibitor.website;
  } else {
    modalWebsiteWrap.hidden = true;
  }

  if (exhibitor.artworks && exhibitor.artworks.length > 0) {
    modalArtworkWrap.hidden = false;
    modalArtworkList.innerHTML = exhibitor.artworks
      .map((art) => createArtworkHtml(exhibitor.name, art))
      .join('');

    modalArtworkList.querySelectorAll('.artwork-thumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const img = btn.querySelector('img');
        openLightbox(img.src, img.alt);
      });
    });
  } else {
    modalArtworkWrap.hidden = true;
    modalArtworkList.innerHTML = '';
  }

  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
}

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.src = '';
}

// Show booth marker and center map on it; skip booths without coordinates
function highlightBooth(exhibitor) {
  if (!exhibitor.mapX) return;
  boothMarker.style.left = exhibitor.mapX + '%';
  boothMarker.style.top = exhibitor.mapY + '%';
  boothMarker.hidden = false;
  mapViewport.scrollLeft = 0;
  mapViewport.scrollTop = (mapStage.scrollHeight * exhibitor.mapY) / 100 - mapViewport.clientHeight / 2;
  mapFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateZoom(delta) {
  mapZoom = Math.min(3, Math.max(1, mapZoom + delta));
  mapStage.style.width = mapZoom * 100 + '%';
}

searchInput.addEventListener('input', filterExhibitors);
clearButton.addEventListener('click', resetSearch);

document.querySelectorAll('header a, footer a').forEach((link) => {
  link.addEventListener('click', (e) => e.preventDefault());
});

categoryTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    categoryTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    activeCategory = tab.textContent.trim();
    searchInput.value = '';
    filterExhibitors();
  });
});

document.getElementById('modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.getElementById('map-clear-btn').addEventListener('click', () => {
  boothMarker.hidden = true;
});

document.getElementById('zoom-in').addEventListener('click', () => updateZoom(0.5));
document.getElementById('zoom-out').addEventListener('click', () => updateZoom(-0.5));

// Zoom centered on the cursor position
mapViewport.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const prevZoom = mapZoom;
    updateZoom(e.deltaY < 0 ? 0.25 : -0.25);
    if (mapZoom !== prevZoom) {
      const rect = mapViewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + mapViewport.scrollLeft;
      const mouseY = e.clientY - rect.top + mapViewport.scrollTop;
      const ratio = mapZoom / prevZoom;
      mapViewport.scrollLeft = mouseX * ratio - (e.clientX - rect.left);
      mapViewport.scrollTop = mouseY * ratio - (e.clientY - rect.top);
    }
  },
  { passive: false }
);

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragScrollLeft = 0;
let dragScrollTop = 0;

mapViewport.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragScrollLeft = mapViewport.scrollLeft;
  dragScrollTop = mapViewport.scrollTop;
  mapViewport.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  mapViewport.scrollLeft = dragScrollLeft - (e.clientX - dragStartX);
  mapViewport.scrollTop = dragScrollTop - (e.clientY - dragStartY);
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  mapViewport.classList.remove('dragging');
});

filterExhibitors();
